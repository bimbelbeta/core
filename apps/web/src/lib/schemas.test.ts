import { describe, expect, test } from "bun:test";
import {
	QUESTION_TYPE_LABELS,
	SUBJECT_CATEGORY_LABELS,
	subjectCategorySchema,
	TRYOUT_STATUS_BADGE,
	tryoutStatusSchema,
} from "./schemas";

describe("question types", () => {
	test("every type has an Indonesian label", () => {
		expect(QUESTION_TYPE_LABELS).toEqual({
			multiple_choice: "Pilihan Ganda",
			multiple_choice_complex: "Pilihan Ganda Kompleks",
			essay: "Esai",
		});
	});
});

describe("subject categories", () => {
	test("the schema and the label map describe the same set", () => {
		for (const [category, label] of Object.entries(SUBJECT_CATEGORY_LABELS)) {
			expect(subjectCategorySchema.allows(category), category).toBe(true);
			expect(label.length).toBeGreaterThan(0);
		}
		expect(Object.keys(SUBJECT_CATEGORY_LABELS)).toHaveLength(4);
	});
});

describe("tryout statuses", () => {
	test("the map covers the schema and each entry carries a full appearance", () => {
		for (const status of Object.keys(TRYOUT_STATUS_BADGE)) {
			expect(tryoutStatusSchema.allows(status), status).toBe(true);
		}
		expect(Object.keys(TRYOUT_STATUS_BADGE)).toHaveLength(3);
		for (const entry of Object.values(TRYOUT_STATUS_BADGE)) {
			expect(entry.label.length).toBeGreaterThan(0);
			expect(entry.dotClassName).toMatch(/^bg-/);
			expect(entry.iconClassName).toMatch(/^text-/);
			expect(entry.icon).toBeDefined();
		}
	});
});
