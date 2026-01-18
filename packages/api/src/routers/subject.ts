import { db } from "@bimbelbeta/db";
import { question, questionAnswerOption } from "@bimbelbeta/db/schema/practice-pack";
import {
	contentItem,
	contentPracticeQuestions,
	noteMaterial,
	recentContentView,
	subject,
	userProgress,
	userSubjectView,
	videoMaterial,
} from "@bimbelbeta/db/schema/subject";
import { ORPCError } from "@orpc/client";
import { type } from "arktype";
import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { authed, authedRateLimited } from "../index";
import { canAccessContent } from "../lib/content-access";

export function convertToTiptap(text: string) {
	try {
		const parsed = JSON.parse(text);
		if (parsed && parsed.type === "doc") return parsed;
	} catch {}

	return {
		type: "doc",
		content: [
			{
				type: "paragraph",
				content: [{ type: "text", text }],
			},
		],
	};
}

function escapeLikePattern(value: string): string {
	return value.replace(/[%_\\]/g, (char) => `\\${char}`);
}

/**
 * Get all subjects with basic info
 * GET /api/subjects
 */
const listSubjects = authed
	.route({
		path: "/subjects",
		method: "GET",
		tags: ["Content"],
	})
	.input(
		type({
			"category?": "'sd' | 'smp' | 'sma' | 'utbk'",
			"search?": "string",
		}).or(type({})),
	)
	.handler(async ({ input, context }) => {
		const conditions = [];
		if (input?.category) {
			conditions.push(eq(subject.category, input.category));
		}
		if (input?.search) {
			conditions.push(ilike(subject.name, `%${escapeLikePattern(input.search)}%`));
		}

		const subjects = await db
			.select({
				id: subject.id,
				name: subject.name,
				shortName: subject.shortName,
				description: subject.description,
				order: subject.order,
				category: subject.category,
				gradeLevel: subject.gradeLevel,
				totalContent: sql<number>`COUNT(${contentItem.id})`,
				hasViewed: sql<boolean>`EXISTS(
					SELECT 1 FROM ${userSubjectView}
					WHERE ${userSubjectView.userId} = ${context.session.user.id}
					AND ${userSubjectView.subjectId} = ${subject.id}
				)`,
			})
			.from(subject)
			.leftJoin(contentItem, eq(contentItem.subjectId, subject.id))
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.groupBy(
				subject.id,
				subject.name,
				subject.shortName,
				subject.description,
				subject.order,
				subject.category,
				subject.gradeLevel,
			)
			.orderBy(subject.order);

		return subjects;
	});

/**
 * Get content items by subject and category
 * Returns ALL content items with metadata (no content detail)
 * Frontend will show lock overlay for premium content
 * GET /api/subjects/{subjectId}/content or /api/subjects/by-shortname/{shortName}/content
 */
const listContentBySubjectCategory = authedRateLimited
	.route({
		path: "/subjects/{subjectId}/content",
		method: "GET",
		tags: ["Content"],
	})
	.input(
		type({
			subjectId: "number",
			"search?": "string",
			"limit?": "number >= 1",
			"offset?": "number >= 0",
		}),
	)
	.handler(async ({ input, context }) => {
		const [targetSubject] = await db
			.select({
				id: subject.id,
				name: subject.name,
				shortName: subject.shortName,
				description: subject.description,
				order: subject.order,
				category: subject.category,
				gradeLevel: subject.gradeLevel,
			})
			.from(subject)
			.where(eq(subject.id, input.subjectId))
			.limit(1);

		if (!targetSubject) {
			throw new ORPCError("NOT_FOUND", { message: "Subject tidak ditemukan" });
		}

		const conditions = [eq(contentItem.subjectId, input.subjectId)];
		if (input.search) {
			conditions.push(ilike(contentItem.title, `%${escapeLikePattern(input.search)}%`));
		}

		const items = await db
			.select({
				id: contentItem.id,
				title: contentItem.title,
				order: contentItem.order,
				hasVideo: sql<boolean>`${videoMaterial.id} IS NOT NULL`,
				hasNote: sql<boolean>`${noteMaterial.id} IS NOT NULL`,
				hasPracticeQuestions: sql<boolean>`${contentPracticeQuestions.contentItemId} IS NOT NULL`,
				videoCompleted: userProgress.videoCompleted,
				noteCompleted: userProgress.noteCompleted,
				practiceQuestionsCompleted: userProgress.practiceQuestionsCompleted,
				lastViewedAt: userProgress.lastViewedAt,
			})
			.from(contentItem)
			.leftJoin(videoMaterial, eq(videoMaterial.contentItemId, contentItem.id))
			.leftJoin(noteMaterial, eq(noteMaterial.contentItemId, contentItem.id))
			.leftJoin(contentPracticeQuestions, eq(contentPracticeQuestions.contentItemId, contentItem.id))
			.leftJoin(
				userProgress,
				and(eq(userProgress.contentItemId, contentItem.id), eq(userProgress.userId, context.session.user.id)),
			)
			.where(and(...conditions))
			.orderBy(contentItem.order)
			.limit(input.limit ?? 20)
			.offset(input.offset ?? 0)
			.groupBy(
				contentItem.id,
				videoMaterial.id,
				noteMaterial.id,
				contentPracticeQuestions.contentItemId,
				userProgress.videoCompleted,
				userProgress.noteCompleted,
				userProgress.practiceQuestionsCompleted,
				userProgress.lastViewedAt,
			);

		return {
			subject: targetSubject,
			items,
		};
	});

const getContentById = authedRateLimited
	.route({
		path: "/content/{contentId}",
		method: "GET",
		tags: ["Content"],
	})
	.input(
		type({
			contentId: "number",
		}),
	)
	.handler(async ({ input, context }) => {
		const [row] = await db
			.select({
				id: contentItem.id,
				title: contentItem.title,
				order: contentItem.order,
				subjectId: contentItem.subjectId,
				subtestOrder: subject.order,

				videoId: videoMaterial.id,
				videoUrl: videoMaterial.videoUrl,
				videoContent: videoMaterial.content,

				noteId: noteMaterial.id,
				noteContent: noteMaterial.content,
			})
			.from(contentItem)
			.innerJoin(subject, eq(subject.id, contentItem.subjectId))
			.leftJoin(videoMaterial, eq(videoMaterial.contentItemId, contentItem.id))
			.leftJoin(noteMaterial, eq(noteMaterial.contentItemId, contentItem.id))
			.where(eq(contentItem.id, input.contentId))
			.limit(1);

		if (!row) {
			throw new ORPCError("NOT_FOUND", { message: "Konten tidak ditemukan" });
		}

		const hasAccess = canAccessContent(
			context.session.user.isPremium,
			context.session.user.role,
			row.subtestOrder,
			row.order,
		);

		if (!hasAccess) {
			throw new ORPCError("FORBIDDEN", { message: "Konten ini memerlukan akun premium" });
		}

		// Get practice questions with full question and answer data
		const practiceQuestionsRows = await db
			.select({
				questionId: contentPracticeQuestions.questionId,
				order: contentPracticeQuestions.order,
				questionContent: question.content,
				questionContentJson: question.contentJson,
				questionDiscussion: question.discussion,
				questionDiscussionJson: question.discussionJson,
				answerId: questionAnswerOption.id,
				answerContent: questionAnswerOption.content,
				answerCode: questionAnswerOption.code,
				answerIsCorrect: questionAnswerOption.isCorrect,
			})
			.from(contentPracticeQuestions)
			.innerJoin(question, eq(question.id, contentPracticeQuestions.questionId))
			.innerJoin(questionAnswerOption, eq(questionAnswerOption.questionId, question.id))
			.where(eq(contentPracticeQuestions.contentItemId, input.contentId))
			.orderBy(contentPracticeQuestions.order, questionAnswerOption.code);

		// Group questions and their answers
		const questionMap = new Map<
			number,
			{
				questionId: number;
				order: number;
				question: string;
				discussion: string;
				answers: Array<{
					id: number;
					content: string;
					code: string;
					isCorrect: boolean;
				}>;
			}
		>();

		for (const row of practiceQuestionsRows) {
			if (!questionMap.has(row.questionId)) {
				questionMap.set(row.questionId, {
					questionId: row.questionId,
					order: row.order,
					question: row.questionContentJson || convertToTiptap(row.questionContent),
					discussion: row.questionDiscussionJson || convertToTiptap(row.questionDiscussion),
					answers: [],
				});
			}
			questionMap.get(row.questionId)?.answers.push({
				id: row.answerId,
				content: row.answerContent,
				code: row.answerCode,
				isCorrect: row.answerIsCorrect,
			});
		}

		// Sort questions by order and answers by code
		const questions = Array.from(questionMap.values())
			.map((q) => ({
				...q,
				answers: q.answers.sort((a, b) => a.code.localeCompare(b.code)),
			}))
			.sort((a, b) => a.order - b.order);

		return {
			id: row.id,
			title: row.title,
			subjectId: row.subjectId,
			video: row.videoId
				? {
						id: row.videoId,
						videoUrl: row.videoUrl,
						content: row.videoContent,
					}
				: null,
			note: row.noteId
				? {
						id: row.noteId,
						content: row.noteContent,
					}
				: null,
			practiceQuestions:
				questions.length > 0
					? {
							questions,
						}
					: null,
		};
	});

/**
 * Track content view (for recent views)
 * POST /api/content/{id}/view
 */
const trackView = authed
	.route({
		path: "/content/{id}/view",
		method: "POST",
		tags: ["Content"],
	})
	.input(type({ id: "number" }))
	.output(type({ message: "string" }))
	.handler(async ({ input, context }) => {
		// Verify content exists
		const [item] = await db
			.select({ id: contentItem.id })
			.from(contentItem)
			.where(eq(contentItem.id, input.id))
			.limit(1);

		if (!item)
			throw new ORPCError("NOT_FOUND", {
				message: "Konten tidak ditemukan",
			});

		await db.transaction(async (tx) => {
			await tx
				.delete(recentContentView)
				.where(
					and(eq(recentContentView.userId, context.session.user.id), eq(recentContentView.contentItemId, input.id)),
				);

			await tx.insert(recentContentView).values({
				userId: context.session.user.id,
				contentItemId: input.id,
			});

			const allViews = await tx
				.select({
					id: recentContentView.id,
					contentItemId: recentContentView.contentItemId,
					viewedAt: recentContentView.viewedAt,
				})
				.from(recentContentView)
				.where(eq(recentContentView.userId, context.session.user.id))
				.orderBy(desc(recentContentView.viewedAt));

			const contentMap = new Map<number, (typeof allViews)[0]>();
			const duplicateIds: number[] = [];

			for (const view of allViews) {
				if (contentMap.has(view.contentItemId)) {
					duplicateIds.push(view.id);
				} else {
					contentMap.set(view.contentItemId, view);
				}
			}

			if (duplicateIds.length > 0) {
				await tx.delete(recentContentView).where(inArray(recentContentView.id, duplicateIds));
			}

			const uniqueViews = Array.from(contentMap.values())
				.sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
				.slice(5);

			if (uniqueViews.length > 0) {
				const idsToDelete = uniqueViews.map((v) => v.id);
				await tx.delete(recentContentView).where(inArray(recentContentView.id, idsToDelete));
			}
		});

		return { message: "Berhasil mencatat aktivitas" };
	});

/**
 * Get recent 5 content views for dashboard
 * GET /api/content/recent
 */
const getRecentViews = authedRateLimited
	.route({
		path: "/content/recent",
		method: "GET",
		tags: ["Content"],
	})
	.handler(async ({ context }) => {
		const allViewsForCleanup = await db
			.select({
				id: recentContentView.id,
				contentItemId: recentContentView.contentItemId,
				viewedAt: recentContentView.viewedAt,
			})
			.from(recentContentView)
			.where(eq(recentContentView.userId, context.session.user.id))
			.orderBy(desc(recentContentView.viewedAt));

		const contentMap = new Map<number, (typeof allViewsForCleanup)[0]>();
		const duplicateIds: number[] = [];

		for (const view of allViewsForCleanup) {
			if (contentMap.has(view.contentItemId)) {
				duplicateIds.push(view.id);
			} else {
				contentMap.set(view.contentItemId, view);
			}
		}

		if (duplicateIds.length > 0) {
			await db.delete(recentContentView).where(inArray(recentContentView.id, duplicateIds));
		}

		const uniqueContentIds = Array.from(contentMap.values()).map((v) => v.contentItemId);

		if (uniqueContentIds.length === 0) {
			return [];
		}

		const views = await db
			.select({
				viewedAt: recentContentView.viewedAt,
				contentId: contentItem.id,
				contentTitle: contentItem.title,
				subjectId: subject.id,
				subtestName: subject.name,
				subtestShortName: subject.shortName,
				hasVideo: sql<boolean>`${videoMaterial.id} IS NOT NULL`,
				hasNote: sql<boolean>`${noteMaterial.id} IS NOT NULL`,
				hasPracticeQuestions: sql<boolean>`${contentPracticeQuestions.contentItemId} IS NOT NULL`,
			})
			.from(recentContentView)
			.innerJoin(contentItem, eq(contentItem.id, recentContentView.contentItemId))
			.innerJoin(subject, eq(subject.id, contentItem.subjectId))
			.leftJoin(videoMaterial, eq(videoMaterial.contentItemId, contentItem.id))
			.leftJoin(noteMaterial, eq(noteMaterial.contentItemId, contentItem.id))
			.leftJoin(contentPracticeQuestions, eq(contentPracticeQuestions.contentItemId, contentItem.id))
			.where(and(eq(recentContentView.userId, context.session.user.id), inArray(contentItem.id, uniqueContentIds)))
			.groupBy(
				recentContentView.viewedAt,
				contentItem.id,
				contentItem.title,
				subject.id,
				subject.name,
				subject.shortName,
				videoMaterial.id,
				noteMaterial.id,
				contentPracticeQuestions.contentItemId,
			)
			.orderBy(desc(recentContentView.viewedAt));

		const finalMap = new Map<number, (typeof views)[0]>();
		for (const view of views) {
			if (!finalMap.has(view.contentId)) {
				finalMap.set(view.contentId, view);
			} else {
				const existing = finalMap.get(view.contentId)!;
				if (new Date(view.viewedAt).getTime() > new Date(existing.viewedAt).getTime()) {
					finalMap.set(view.contentId, view);
				}
			}
		}

		return Array.from(finalMap.values())
			.sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
			.slice(0, 5);
	});

/**
 * Track subject view (when user opens a subject)
 * POST /api/subjects/{subjectId}/view
 */
const trackSubjectView = authed
	.route({
		path: "/subjects/{subjectId}/view",
		method: "POST",
		tags: ["Content"],
	})
	.input(type({ subjectId: "number" }))
	.output(type({ message: "string" }))
	.handler(async ({ input, context }) => {
		const [targetSubject] = await db
			.select({ id: subject.id })
			.from(subject)
			.where(eq(subject.id, input.subjectId))
			.limit(1);

		if (!targetSubject) {
			throw new ORPCError("NOT_FOUND", { message: "Subject tidak ditemukan" });
		}

		await db
			.insert(userSubjectView)
			.values({
				userId: context.session.user.id,
				subjectId: input.subjectId,
			})
			.onConflictDoUpdate({
				target: [userSubjectView.userId, userSubjectView.subjectId],
				set: { viewedAt: new Date(), updatedAt: new Date() },
			});

		return { message: "Berhasil mencatat aktivitas" };
	});

/**
 * Update user progress
 * PATCH /api/content/{id}/progress
 */
const updateProgress = authed
	.route({
		path: "/content/{id}/progress",
		method: "PATCH",
		tags: ["Content"],
	})
	.input(
		type({
			id: "number",
			videoCompleted: "boolean?",
			noteCompleted: "boolean?",
			practiceQuestionsCompleted: "boolean?",
		}),
	)
	.output(type({ message: "string" }))
	.handler(async ({ input, context }) => {
		const [item] = await db
			.select({ id: contentItem.id })
			.from(contentItem)
			.where(eq(contentItem.id, input.id))
			.limit(1);

		if (!item)
			throw new ORPCError("NOT_FOUND", {
				message: "Konten tidak ditemukan",
			});

		const updateData: {
			videoCompleted?: boolean;
			noteCompleted?: boolean;
			practiceQuestionsCompleted?: boolean;
			lastViewedAt: Date;
			updatedAt: Date;
		} = {
			lastViewedAt: new Date(),
			updatedAt: new Date(),
		};

		if (input.videoCompleted !== undefined) updateData.videoCompleted = input.videoCompleted;
		if (input.noteCompleted !== undefined) updateData.noteCompleted = input.noteCompleted;
		if (input.practiceQuestionsCompleted !== undefined)
			updateData.practiceQuestionsCompleted = input.practiceQuestionsCompleted;

		await db
			.insert(userProgress)
			.values({
				userId: context.session.user.id,
				contentItemId: input.id,
				...updateData,
			})
			.onConflictDoUpdate({
				target: [userProgress.userId, userProgress.contentItemId],
				set: updateData,
			});

		return { message: "Progress berhasil disimpan" };
	});

/**
 * Get user progress statistics
 * GET /api/content/progress/stats
 */
const getProgressStats = authed
	.route({
		path: "/content/progress/stats",
		method: "GET",
		tags: ["Content"],
	})
	.handler(async ({ context }) => {
		const [stats] = await db
			.select({
				materialsCompleted: sql<number>`COUNT(DISTINCT CASE WHEN ${userProgress.videoCompleted} = true OR ${userProgress.noteCompleted} = true OR ${userProgress.practiceQuestionsCompleted} = true THEN ${userProgress.contentItemId} END)`,
			})
			.from(userProgress)
			.where(eq(userProgress.userId, context.session.user.id));

		return {
			materialsCompleted: Number(stats?.materialsCompleted ?? 0),
		};
	});

export const subjectRouter = {
	listSubjects,
	listContentBySubjectCategory,
	getContentById,
	trackView,
	trackSubjectView,
	getRecentViews,
	updateProgress,
	getProgressStats,
};
