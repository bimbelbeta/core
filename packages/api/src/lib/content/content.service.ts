import { db } from "@bimbelbeta/db";
import { contentItem, contentPracticeQuestions, noteMaterial, videoMaterial } from "@bimbelbeta/db/schema/subject";

type CreateContentInput = {
	subjectId: number;
	title: string;
	order: number;
	video?: { videoUrl: string; content: Record<string, unknown> };
	note?: { content: Record<string, unknown> };
	practiceQuestionIds?: number[];
};

async function saveContent(input: CreateContentInput) {
	return await db.transaction(async (tx) => {
		const created = (
			await tx
				.insert(contentItem)
				.values({ subjectId: input.subjectId, title: input.title, order: input.order })
				.returning()
		)[0]!;
		const createdMaterials: { video?: number; note?: number; practiceQuestions?: number } = {};
		if (input.video) {
			const [video] = await tx
				.insert(videoMaterial)
				.values({ contentItemId: created.id, videoUrl: input.video.videoUrl, content: input.video.content })
				.returning();
			if (video) createdMaterials.video = video.id;
		}
		if (input.note) {
			const [note] = await tx
				.insert(noteMaterial)
				.values({ contentItemId: created.id, content: input.note.content })
				.returning();
			if (note) createdMaterials.note = note.id;
		}
		if (input.practiceQuestionIds?.length) {
			await tx.insert(contentPracticeQuestions).values(
				input.practiceQuestionIds.map((questionId, index) => ({
					contentItemId: created.id,
					questionId,
					order: index + 1,
				})),
			);
			createdMaterials.practiceQuestions = input.practiceQuestionIds.length;
		}
		return { contentId: created.id, createdMaterials };
	});
}

/**
 * Creates a content item together with whichever materials it carries.
 *
 * A content item is only valid if it has at least one of video, note, or practice questions, so
 * the empty case is rejected before touching the database. The item row and all of its materials
 * are written in a single transaction; a later insert failing therefore leaves no half-built
 * content item behind.
 *
 * Never throws for expected outcomes.
 *
 * @returns `created` with the new content item id and the ids of the materials that were written,
 * `no_materials` when nothing was supplied.
 */
export function hasMaterials(input: CreateContentInput): boolean {
	return !!input.video || !!input.note || (input.practiceQuestionIds?.length ?? 0) > 0;
}

export const contentService = {
	async create(input: CreateContentInput) {
		if (!hasMaterials(input)) return { status: "no_materials" } as const;
		return { status: "created", ...(await saveContent(input)) } as const;
	},
};
