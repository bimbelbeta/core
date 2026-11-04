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

const creationFailed = new Error("Content creation failed");

async function saveContent(input: CreateContentInput) {
	try {
		return await db.transaction(async (tx) => {
			const [created] = await tx
				.insert(contentItem)
				.values({ subjectId: input.subjectId, title: input.title, order: input.order })
				.returning();
			if (!created) throw creationFailed;

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
	} catch (error) {
		if (error === creationFailed) return undefined;
		throw error;
	}
}

export const createContentService = (save: typeof saveContent) => ({
	async create(input: CreateContentInput) {
		if (!input.video && !input.note && !input.practiceQuestionIds?.length) return { status: "no_materials" } as const;
		const result = await save(input);
		if (!result) return { status: "creation_failed" } as const;
		return { status: "created", ...result } as const;
	},
});

export const contentService = createContentService(saveContent);
