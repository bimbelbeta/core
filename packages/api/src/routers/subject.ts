import { canAccessContent } from "@bimbelbeta/contract/common/content-access";
import { db } from "@bimbelbeta/db";
import { question, questionChoice } from "@bimbelbeta/db/schema/question";
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
import { and, desc, eq, gt, ilike, inArray, lt, sql } from "drizzle-orm";
import { authed } from "../index";
import { fetchContentForRead } from "../lib/content-utils";
import { buildIdCursorPage, parseIdCursor } from "../lib/pagination/cursor";
import type { Role } from "../lib/roles";

import type { ChoiceWithAnswer } from "../types/question";

function escapeLikePattern(value: string): string {
	return value.replace(/[%_\\]/g, (char) => `\\${char}`);
}

const list = authed.subject.list.handler(async ({ input, context }) => {
	const conditions = [];
	if (input?.category) conditions.push(eq(subject.category, input.category));
	if (input?.search) conditions.push(ilike(subject.name, `%${escapeLikePattern(input.search)}%`));

	const subjects = await db
		.select({
			id: subject.id,
			name: subject.name,
			shortName: subject.shortName,
			description: subject.description,
			order: subject.order,
			category: subject.category,
			gradeLevel: subject.gradeLevel,
			totalContent: sql<number>`COUNT(${contentItem.id})::int`,
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

const listContent = authed.subject.listContent.handler(async ({ input, context, errors }) => {
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
		throw errors.NOT_FOUND({ message: "Subject tidak ditemukan" });
	}

	const limit = input.limit ?? 20;
	const isBackward = !!input.before;
	const cursorStr = input.after ?? input.before;
	const cursorId = cursorStr ? parseIdCursor(cursorStr) : null;

	const conditions = [eq(contentItem.subjectId, input.subjectId)];
	if (input.search) {
		conditions.push(ilike(contentItem.title, `%${escapeLikePattern(input.search)}%`));
	}
	if (cursorId !== null) {
		conditions.push(isBackward ? lt(contentItem.id, cursorId) : gt(contentItem.id, cursorId));
	}

	const rows = await db
		.select({
			id: contentItem.id,
			title: contentItem.title,
			order: contentItem.order,
			hasVideo: sql<boolean>`${videoMaterial.id} IS NOT NULL`,
			hasNote: sql<boolean>`${noteMaterial.id} IS NOT NULL`,
			hasPracticeQuestions: sql<boolean>`EXISTS(
				SELECT 1 FROM ${contentPracticeQuestions}
				WHERE ${contentPracticeQuestions.contentItemId} = ${contentItem.id}
			)`,
			videoCompleted: userProgress.videoCompleted,
			noteCompleted: userProgress.noteCompleted,
			practiceQuestionsCompleted: userProgress.practiceQuestionsCompleted,
			lastViewedAt: userProgress.lastViewedAt,
		})
		.from(contentItem)
		.leftJoin(videoMaterial, eq(videoMaterial.contentItemId, contentItem.id))
		.leftJoin(noteMaterial, eq(noteMaterial.contentItemId, contentItem.id))
		.leftJoin(
			userProgress,
			and(eq(userProgress.contentItemId, contentItem.id), eq(userProgress.userId, context.session.user.id)),
		)
		.where(and(...conditions))
		.orderBy(isBackward ? desc(contentItem.id) : contentItem.id)
		.limit(limit + 1);

	const { items, pageInfo } = buildIdCursorPage(rows, limit, isBackward, !!cursorStr);

	return {
		subject: targetSubject,
		items,
		pageInfo,
	};
});

const findContent = authed.subject.findContent.handler(async ({ input, context, errors }) => {
	if (!Number.isFinite(input.contentId) || input.contentId <= 0) {
		throw errors.BAD_REQUEST({ message: "Invalid content ID" });
	}

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
		throw errors.NOT_FOUND({ message: "Konten tidak ditemukan" });
	}

	const hasAccess = canAccessContent(
		context.session.user.isPremium,
		context.session.user.role as Role,
		row.subtestOrder,
		row.order,
	);

	if (!hasAccess) {
		throw errors.FORBIDDEN({ message: "Konten ini memerlukan akun premium" });
	}

	const practiceQuestionsRows = await db
		.select({
			questionId: contentPracticeQuestions.questionId,
			order: contentPracticeQuestions.order,
			questionContent: question.content,
			questionContentJson: question.contentJson,
			questionDiscussion: question.discussion,
			questionDiscussionJson: question.discussionJson,
			questionType: question.type,
			essayCorrectAnswer: question.essayCorrectAnswer,
			answerId: questionChoice.id,
			answerContent: questionChoice.content,
			answerCode: questionChoice.code,
			answerIsCorrect: questionChoice.isCorrect,
		})
		.from(contentPracticeQuestions)
		.innerJoin(question, eq(question.id, contentPracticeQuestions.questionId))
		.leftJoin(questionChoice, eq(questionChoice.questionId, question.id))
		.where(eq(contentPracticeQuestions.contentItemId, input.contentId))
		.orderBy(contentPracticeQuestions.order, questionChoice.code);

	const questionMap = new Map<
		number,
		{
			questionId: number;
			order: number;
			question: Record<string, unknown>;
			discussion: Record<string, unknown>;
			type: "multiple_choice" | "multiple_choice_complex" | "essay";
			essayCorrectAnswer: string | null;
			answers: ChoiceWithAnswer[];
		}
	>();

	for (const row of practiceQuestionsRows) {
		if (!questionMap.has(row.questionId)) {
			questionMap.set(row.questionId, {
				questionId: row.questionId,
				order: row.order,
				question: fetchContentForRead(row.questionContentJson, row.questionContent),
				discussion: fetchContentForRead(row.questionDiscussionJson, row.questionDiscussion),
				type: row.questionType,
				essayCorrectAnswer: row.essayCorrectAnswer ?? null,
				answers: [],
			});
		}
		if (row.answerId !== null) {
			questionMap.get(row.questionId)?.answers.push({
				id: row.answerId,
				content: row.answerContent!,
				code: row.answerCode!,
				isCorrect: row.answerIsCorrect!,
			});
		}
	}

	const questions = Array.from(questionMap.values())
		.map((q) => ({
			...q,
			answers: q.answers.sort((a, b) => a.code.localeCompare(b.code)),
		}))
		.sort((a, b) => a.order - b.order);

	return {
		id: row.id,
		title: row.title,
		order: row.order,
		subjectId: row.subjectId,
		video: row.videoId
			? {
					id: row.videoId,
					videoUrl: row.videoUrl!,
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

const trackView = authed.subject.trackView.handler(async ({ input, context, errors }) => {
	const [item] = await db
		.select({ id: contentItem.id })
		.from(contentItem)
		.where(eq(contentItem.id, input.contentId))
		.limit(1);

	if (!item)
		throw errors.NOT_FOUND({
			message: "Konten tidak ditemukan",
		});

	await db.transaction(async (tx) => {
		await tx
			.delete(recentContentView)
			.where(
				and(
					eq(recentContentView.userId, context.session.user.id),
					eq(recentContentView.contentItemId, input.contentId),
				),
			);

		await tx.insert(recentContentView).values({
			userId: context.session.user.id,
			contentItemId: input.contentId,
		});

		const toDelete = await tx
			.select({ id: recentContentView.id })
			.from(recentContentView)
			.where(eq(recentContentView.userId, context.session.user.id))
			.orderBy(desc(recentContentView.viewedAt))
			.offset(5);

		if (toDelete.length > 0) {
			await tx.delete(recentContentView).where(
				inArray(
					recentContentView.id,
					toDelete.map((v) => v.id),
				),
			);
		}
	});

	return { message: "Berhasil mencatat aktivitas" };
});

const listRecentViews = authed.subject.listRecentViews.handler(async ({ context }) => {
	const views = await db
		.select({
			viewedAt: recentContentView.viewedAt,
			contentId: contentItem.id,
			contentTitle: contentItem.title,
			subjectId: subject.id,
			subjectName: subject.name,
			subjectShortName: subject.shortName,
			hasVideo: sql<boolean>`${videoMaterial.id} IS NOT NULL`,
			hasNote: sql<boolean>`${noteMaterial.id} IS NOT NULL`,
			hasPracticeQuestions: sql<boolean>`EXISTS(
				SELECT 1 FROM ${contentPracticeQuestions}
				WHERE ${contentPracticeQuestions.contentItemId} = ${contentItem.id}
			)`,
		})
		.from(recentContentView)
		.innerJoin(contentItem, eq(contentItem.id, recentContentView.contentItemId))
		.innerJoin(subject, eq(subject.id, contentItem.subjectId))
		.leftJoin(videoMaterial, eq(videoMaterial.contentItemId, contentItem.id))
		.leftJoin(noteMaterial, eq(noteMaterial.contentItemId, contentItem.id))
		.where(eq(recentContentView.userId, context.session.user.id))
		.orderBy(desc(recentContentView.viewedAt))
		.limit(5);

	return views;
});

const trackSubjectView = authed.subject.trackSubjectView.handler(async ({ input, context, errors }) => {
	const [targetSubject] = await db
		.select({ id: subject.id })
		.from(subject)
		.where(eq(subject.id, input.subjectId))
		.limit(1);

	if (!targetSubject) {
		throw errors.NOT_FOUND({ message: "Subject tidak ditemukan" });
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

const updateProgress = authed.subject.updateProgress.handler(async ({ input, context, errors }) => {
	const [item] = await db
		.select({ id: contentItem.id })
		.from(contentItem)
		.where(eq(contentItem.id, input.contentId))
		.limit(1);

	if (!item)
		throw errors.NOT_FOUND({
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
			contentItemId: input.contentId,
			...updateData,
		})
		.onConflictDoUpdate({
			target: [userProgress.userId, userProgress.contentItemId],
			set: updateData,
		})
		.catch(() => {
			throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal menyimpan progres." });
		});

	return { message: "Progress berhasil disimpan" };
});

const stats = authed.subject.stats.handler(async ({ context }) => {
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
	list,
	listContent,
	findContent,
	trackView,
	trackSubjectView,
	listRecentViews,
	updateProgress,
	stats,
};
