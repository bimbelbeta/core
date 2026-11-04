import { describe, expect, mock, test } from "bun:test";
import { createContentService } from "./content.service";

const input = { subjectId: 1, title: "Konten", order: 1 };

describe("content creation", () => {
	test("rejects content without material, including an empty practice question list", async () => {
		const save = mock(async () => ({ contentId: 1, createdMaterials: {} }));
		const service = createContentService(save);
		expect(await service.create(input)).toEqual({ status: "no_materials" });
		expect(await service.create({ ...input, practiceQuestionIds: [] })).toEqual({ status: "no_materials" });
		expect(save).not.toHaveBeenCalled();
	});

	test("accepts each kind of material and preserves the saved result", async () => {
		const save = mock(async () => ({ contentId: 1, createdMaterials: { video: 2, note: 3, practiceQuestions: 1 } }));
		const service = createContentService(save);
		for (const material of [
			{ video: { videoUrl: "video", content: {} } },
			{ note: { content: {} } },
			{ practiceQuestionIds: [10] },
		]) {
			expect(await service.create({ ...input, ...material })).toEqual({
				status: "created",
				contentId: 1,
				createdMaterials: { video: 2, note: 3, practiceQuestions: 1 },
			});
		}
	});

	test("reports a failed content insert", async () => {
		const service = createContentService(async () => undefined);
		expect(await service.create({ ...input, note: { content: {} } })).toEqual({ status: "creation_failed" });
	});
});
