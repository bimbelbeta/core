import type { DbClient } from "@bimbelbeta/db";
import { question, questionChoice } from "@bimbelbeta/db/schema/question";
import { contentItem, contentPracticeQuestions, noteMaterial, videoMaterial } from "@bimbelbeta/db/schema/subject";
import { and, asc, eq, inArray } from "drizzle-orm";
import { reorderRows } from "@/lib/reorder";

export type CreateContentInput = {
	subjectId: number;
	title: string;
	order: number;
	video?: { videoUrl: string; content: Record<string, unknown> };
	note?: { content: Record<string, unknown> };
	practiceQuestionIds?: number[];
};

export function createContentRepository(dbClient: DbClient) {
	return {
		async findContentById(id: number) {
			const [content] = await dbClient
				.select({ id: contentItem.id })
				.from(contentItem)
				.where(eq(contentItem.id, id))
				.limit(1);
			return content;
		},

		async insertContent(values: { subjectId: number; title: string; order: number }): Promise<{ id: number }> {
			const [created] = await dbClient.insert(contentItem).values(values).returning();
			return created!;
		},

		async createContentWithMaterials(input: CreateContentInput): Promise<{
			contentId: number;
			videoId: number | undefined;
			noteId: number | undefined;
		}> {
			return dbClient.transaction(async (tx) => {
				const repo = createContentRepository(tx);
				const content = await repo.insertContent({
					subjectId: input.subjectId,
					title: input.title,
					order: input.order,
				});
				const video = input.video
					? await repo.insertVideoMaterial({
							contentItemId: content.id,
							videoUrl: input.video.videoUrl,
							content: input.video.content,
						})
					: undefined;
				const note = input.note
					? await repo.insertNoteMaterial({ contentItemId: content.id, content: input.note.content })
					: undefined;
				if (input.practiceQuestionIds?.length) {
					await repo.insertPracticeQuestions(
						input.practiceQuestionIds.map((questionId, index) => ({
							contentItemId: content.id,
							questionId,
							order: index + 1,
						})),
					);
				}
				return { contentId: content.id, videoId: video?.id, noteId: note?.id };
			});
		},

		async updateContent(id: number, changes: { title?: string; order?: number }): Promise<{ id: number } | undefined> {
			const [updated] = await dbClient
				.update(contentItem)
				.set({ ...changes, updatedAt: new Date() })
				.where(eq(contentItem.id, id))
				.returning();
			return updated;
		},

		async deleteContent(id: number): Promise<{ id: number } | undefined> {
			const [removed] = await dbClient.delete(contentItem).where(eq(contentItem.id, id)).returning();
			return removed;
		},

		async reorderContents(subjectId: number, items: { id: number; order: number }[]) {
			await reorderRows(dbClient, {
				table: contentItem,
				idColumn: contentItem.id,
				where: and(
					eq(contentItem.subjectId, subjectId),
					inArray(
						contentItem.id,
						items.map((item) => item.id),
					),
				),
				items,
				touchUpdatedAt: true,
			});
		},

		async insertVideoMaterial(values: {
			contentItemId: number;
			videoUrl: string;
			content: Record<string, unknown>;
		}): Promise<{ id: number }> {
			const [video] = await dbClient.insert(videoMaterial).values(values).returning();
			return video!;
		},

		async upsertVideoMaterial(values: {
			contentItemId: number;
			videoUrl: string;
			content: Record<string, unknown>;
		}): Promise<{ id: number } | undefined> {
			const [video] = await dbClient
				.insert(videoMaterial)
				.values(values)
				.onConflictDoUpdate({
					target: videoMaterial.contentItemId,
					set: { videoUrl: values.videoUrl, content: values.content, updatedAt: new Date() },
				})
				.returning();
			return video;
		},

		async deleteVideoForContent(contentItemId: number): Promise<{ id: number } | undefined> {
			const [removed] = await dbClient
				.delete(videoMaterial)
				.where(eq(videoMaterial.contentItemId, contentItemId))
				.returning();
			return removed;
		},

		async insertNoteMaterial(values: {
			contentItemId: number;
			content: Record<string, unknown>;
		}): Promise<{ id: number }> {
			const [note] = await dbClient.insert(noteMaterial).values(values).returning();
			return note!;
		},

		async upsertNoteMaterial(values: {
			contentItemId: number;
			content: Record<string, unknown>;
		}): Promise<{ id: number } | undefined> {
			const [note] = await dbClient
				.insert(noteMaterial)
				.values(values)
				.onConflictDoUpdate({
					target: noteMaterial.contentItemId,
					set: { content: values.content, updatedAt: new Date() },
				})
				.returning();
			return note;
		},

		async deleteNoteForContent(contentItemId: number): Promise<{ id: number } | undefined> {
			const [removed] = await dbClient
				.delete(noteMaterial)
				.where(eq(noteMaterial.contentItemId, contentItemId))
				.returning();
			return removed;
		},

		async findPracticeQuestions(contentItemId: number) {
			return dbClient
				.select({
					questionId: contentPracticeQuestions.questionId,
					order: contentPracticeQuestions.order,
					type: question.type,
					content: question.content,
					contentJson: question.contentJson,
					discussion: question.discussion,
					discussionJson: question.discussionJson,
					tags: question.tags,
				})
				.from(contentPracticeQuestions)
				.innerJoin(question, eq(contentPracticeQuestions.questionId, question.id))
				.where(eq(contentPracticeQuestions.contentItemId, contentItemId))
				.orderBy(asc(contentPracticeQuestions.order));
		},

		async findChoicesByQuestionIds(questionIds: number[]) {
			return dbClient
				.select()
				.from(questionChoice)
				.where(inArray(questionChoice.questionId, questionIds))
				.orderBy(questionChoice.code);
		},

		async findPracticeQuestionLinks(contentItemId: number) {
			return dbClient
				.select({ questionId: contentPracticeQuestions.questionId, order: contentPracticeQuestions.order })
				.from(contentPracticeQuestions)
				.where(eq(contentPracticeQuestions.contentItemId, contentItemId))
				.orderBy(asc(contentPracticeQuestions.order));
		},

		async insertPracticeQuestions(links: { contentItemId: number; questionId: number; order: number }[]) {
			await dbClient.insert(contentPracticeQuestions).values(links);
		},

		async deletePracticeQuestions(contentItemId: number) {
			await dbClient.delete(contentPracticeQuestions).where(eq(contentPracticeQuestions.contentItemId, contentItemId));
		},

		async deletePracticeQuestion(contentItemId: number, questionId: number) {
			const [removed] = await dbClient
				.delete(contentPracticeQuestions)
				.where(
					and(
						eq(contentPracticeQuestions.contentItemId, contentItemId),
						eq(contentPracticeQuestions.questionId, questionId),
					),
				)
				.returning();
			return removed;
		},

		async updatePracticeQuestionOrders(contentItemId: number, links: { questionId: number; order: number }[]) {
			await reorderRows(dbClient, {
				table: contentPracticeQuestions,
				idColumn: contentPracticeQuestions.questionId,
				where: and(
					eq(contentPracticeQuestions.contentItemId, contentItemId),
					inArray(
						contentPracticeQuestions.questionId,
						links.map((link) => link.questionId),
					),
				),
				items: links.map((link) => ({ id: link.questionId, order: link.order })),
			});
		},

		async removePracticeQuestion(
			contentItemId: number,
			questionId: number,
		): Promise<{ questionId: number } | undefined> {
			return dbClient.transaction(async (tx) => {
				const repo = createContentRepository(tx);
				const removed = await repo.deletePracticeQuestion(contentItemId, questionId);
				if (!removed) return undefined;
				const remaining = await repo.findPracticeQuestionLinks(contentItemId);
				if (remaining.length > 0) {
					await repo.updatePracticeQuestionOrders(
						contentItemId,
						remaining.map((link, index) => ({ questionId: link.questionId, order: index + 1 })),
					);
				}
				return removed;
			});
		},
	};
}

export type ContentRepository = ReturnType<typeof createContentRepository>;
