import type { DbClient } from "@bimbelbeta/db";
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
import { escapeLikePattern } from "@/lib/utils";

export type SubjectRow = typeof subject.$inferSelect;
export type SubjectInsert = typeof subject.$inferInsert;
export type SubjectChanges = Partial<SubjectInsert>;

export type SubjectListRow = {
	id: number;
	name: string;
	shortName: string;
	description: string | null;
	order: number;
	category: SubjectRow["category"];
	gradeLevel: number | null;
	totalContent: number;
	hasViewed: boolean;
};

export type ListSubjectsQuery = {
	limit: number;
	cursorId: number | null;
	backward: boolean;
	category?: SubjectRow["category"];
	search?: string;
	userId: string;
};

export type SubjectSummaryRow = {
	id: number;
	name: string;
	shortName: string;
	description: string | null;
	order: number;
	category: SubjectRow["category"];
	gradeLevel: number | null;
};

export type ContentListRow = {
	id: number;
	title: string;
	order: number;
	hasVideo: boolean;
	hasNote: boolean;
	hasPracticeQuestions: boolean;
	videoCompleted: boolean | null;
	noteCompleted: boolean | null;
	practiceQuestionsCompleted: boolean | null;
	lastViewedAt: Date | null;
};

export type ListContentItemsQuery = {
	subjectId: number;
	limit: number;
	cursorId: number | null;
	backward: boolean;
	search?: string;
	userId: string;
};

export type ContentDetailRow = {
	id: number;
	title: string;
	order: number;
	subjectId: number;
	subtestOrder: number;
	videoId: number | null;
	videoUrl: string | null;
	videoContent: unknown;
	noteId: number | null;
	noteContent: unknown;
};

export type PracticeQuestionLinkRow = { questionId: number; order: number };

export type RecentViewRow = {
	viewedAt: Date;
	contentId: number;
	contentTitle: string;
	subjectId: number;
	subjectName: string;
	subjectShortName: string;
	hasVideo: boolean;
	hasNote: boolean;
	hasPracticeQuestions: boolean;
};

export type UpsertProgressInput = {
	userId: string;
	contentItemId: number;
	videoCompleted?: boolean;
	noteCompleted?: boolean;
	practiceQuestionsCompleted?: boolean;
};

export function createSubjectRepository(client: DbClient) {
	async function listSubjects(query: ListSubjectsQuery): Promise<SubjectListRow[]> {
		return client
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
					WHERE ${userSubjectView.userId} = ${query.userId}
					AND ${userSubjectView.subjectId} = ${subject.id}
				)`,
			})
			.from(subject)
			.leftJoin(contentItem, eq(contentItem.subjectId, subject.id))
			.where(
				and(
					query.category ? eq(subject.category, query.category) : undefined,
					query.search ? ilike(subject.name, `%${escapeLikePattern(query.search)}%`) : undefined,
					query.cursorId !== null
						? query.backward
							? lt(subject.id, query.cursorId)
							: gt(subject.id, query.cursorId)
						: undefined,
				),
			)
			.groupBy(
				subject.id,
				subject.name,
				subject.shortName,
				subject.description,
				subject.order,
				subject.category,
				subject.gradeLevel,
			)
			.orderBy(query.backward ? desc(subject.id) : subject.order)
			.limit(query.limit + 1);
	}

	async function findSubjectSummary(subjectId: number): Promise<SubjectSummaryRow | undefined> {
		const [row] = await client
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
			.where(eq(subject.id, subjectId))
			.limit(1);
		return row;
	}

	async function listContentItems(query: ListContentItemsQuery): Promise<ContentListRow[]> {
		return client
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
				and(eq(userProgress.contentItemId, contentItem.id), eq(userProgress.userId, query.userId)),
			)
			.where(
				and(
					eq(contentItem.subjectId, query.subjectId),
					query.search ? ilike(contentItem.title, `%${escapeLikePattern(query.search)}%`) : undefined,
					query.cursorId !== null
						? query.backward
							? lt(contentItem.id, query.cursorId)
							: gt(contentItem.id, query.cursorId)
						: undefined,
				),
			)
			.orderBy(query.backward ? desc(contentItem.id) : contentItem.id)
			.limit(query.limit + 1);
	}

	async function findContentDetail(contentId: number): Promise<ContentDetailRow | undefined> {
		const [row] = await client
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
			.where(eq(contentItem.id, contentId))
			.limit(1);
		return row;
	}

	async function listPracticeQuestionLinks(contentItemId: number): Promise<PracticeQuestionLinkRow[]> {
		return client
			.select({
				questionId: contentPracticeQuestions.questionId,
				order: contentPracticeQuestions.order,
			})
			.from(contentPracticeQuestions)
			.where(eq(contentPracticeQuestions.contentItemId, contentItemId))
			.orderBy(contentPracticeQuestions.order);
	}

	async function findContentRef(contentId: number): Promise<{ id: number } | undefined> {
		const [row] = await client
			.select({ id: contentItem.id })
			.from(contentItem)
			.where(eq(contentItem.id, contentId))
			.limit(1);
		return row;
	}

	async function findSubjectRef(subjectId: number): Promise<{ id: number } | undefined> {
		const [row] = await client.select({ id: subject.id }).from(subject).where(eq(subject.id, subjectId)).limit(1);
		return row;
	}

	async function listRecentViews(userId: string): Promise<RecentViewRow[]> {
		return client
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
			.where(eq(recentContentView.userId, userId))
			.orderBy(desc(recentContentView.viewedAt))
			.limit(5);
	}

	async function deleteRecentView(input: { userId: string; contentId: number }): Promise<void> {
		await client
			.delete(recentContentView)
			.where(and(eq(recentContentView.userId, input.userId), eq(recentContentView.contentItemId, input.contentId)));
	}

	async function insertRecentView(input: { userId: string; contentId: number }): Promise<void> {
		await client.insert(recentContentView).values({
			userId: input.userId,
			contentItemId: input.contentId,
		});
	}

	async function listRecentViewOverflow(userId: string): Promise<{ id: number }[]> {
		return client
			.select({ id: recentContentView.id })
			.from(recentContentView)
			.where(eq(recentContentView.userId, userId))
			.orderBy(desc(recentContentView.viewedAt))
			.offset(5);
	}

	async function deleteRecentViews(ids: number[]): Promise<void> {
		await client.delete(recentContentView).where(inArray(recentContentView.id, ids));
	}

	async function upsertSubjectView(input: { userId: string; subjectId: number }): Promise<void> {
		await client
			.insert(userSubjectView)
			.values({
				userId: input.userId,
				subjectId: input.subjectId,
			})
			.onConflictDoUpdate({
				target: [userSubjectView.userId, userSubjectView.subjectId],
				set: { viewedAt: new Date(), updatedAt: new Date() },
			});
	}

	async function upsertProgress(input: UpsertProgressInput): Promise<void> {
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

		await client
			.insert(userProgress)
			.values({
				userId: input.userId,
				contentItemId: input.contentItemId,
				...updateData,
			})
			.onConflictDoUpdate({
				target: [userProgress.userId, userProgress.contentItemId],
				set: updateData,
			});
	}

	async function countCompletedMaterials(userId: string): Promise<{ materialsCompleted: number } | undefined> {
		const [row] = await client
			.select({
				materialsCompleted: sql<number>`COUNT(DISTINCT CASE WHEN ${userProgress.videoCompleted} = true OR ${userProgress.noteCompleted} = true OR ${userProgress.practiceQuestionsCompleted} = true THEN ${userProgress.contentItemId} END)`,
			})
			.from(userProgress)
			.where(eq(userProgress.userId, userId));
		return row;
	}

	async function insertSubject(values: SubjectInsert): Promise<SubjectRow | undefined> {
		const [row] = await client.insert(subject).values(values).returning();
		return row;
	}

	async function updateSubject(subjectId: number, changes: SubjectChanges): Promise<SubjectRow | undefined> {
		const [row] = await client.update(subject).set(changes).where(eq(subject.id, subjectId)).returning();
		return row;
	}

	async function deleteSubject(subjectId: number): Promise<SubjectRow | undefined> {
		const [row] = await client.delete(subject).where(eq(subject.id, subjectId)).returning();
		return row;
	}

	async function reorderSubjects(items: { id: number; order: number }[]): Promise<void> {
		const ids = items.map((item) => item.id);
		const caseExpr = sql.join(
			items.map((item) => sql`WHEN ${subject.id} = ${item.id} THEN ${item.order}`),
			sql` `,
		);

		await client
			.update(subject)
			.set({ order: sql`CASE ${caseExpr} END`, updatedAt: new Date() })
			.where(inArray(subject.id, ids));
	}

	async function findSubjectCategory(subjectId: number): Promise<{ category: SubjectRow["category"] } | undefined> {
		const [row] = await client
			.select({ category: subject.category })
			.from(subject)
			.where(eq(subject.id, subjectId))
			.limit(1);
		return row;
	}

	async function transaction<T>(fn: (repository: SubjectRepository) => Promise<T>): Promise<T> {
		return await client.transaction((tx) => fn(createSubjectRepository(tx)));
	}

	return {
		listSubjects,
		findSubjectSummary,
		listContentItems,
		findContentDetail,
		listPracticeQuestionLinks,
		findContentRef,
		findSubjectRef,
		listRecentViews,
		deleteRecentView,
		insertRecentView,
		listRecentViewOverflow,
		deleteRecentViews,
		upsertSubjectView,
		upsertProgress,
		countCompletedMaterials,
		insertSubject,
		updateSubject,
		deleteSubject,
		reorderSubjects,
		findSubjectCategory,
		transaction,
	};
}

export type SubjectRepository = ReturnType<typeof createSubjectRepository>;
