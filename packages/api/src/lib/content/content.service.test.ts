import { describe, expect, test } from "bun:test";
import { hasMaterials } from "./content.service";

const input = { subjectId: 1, title: "Konten", order: 1 };

describe("hasMaterials", () => {
	test("rejects content without any material", () => {
		expect(hasMaterials(input)).toBe(false);
		expect(hasMaterials({ ...input, practiceQuestionIds: [] })).toBe(false);
	});

	test("accepts each kind of material", () => {
		expect(hasMaterials({ ...input, video: { videoUrl: "video", content: {} } })).toBe(true);
		expect(hasMaterials({ ...input, note: { content: {} } })).toBe(true);
		expect(hasMaterials({ ...input, practiceQuestionIds: [10] })).toBe(true);
	});
});
