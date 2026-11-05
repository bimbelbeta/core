import { describe, expect, test } from "bun:test";
import {
	isSubscriptionVariant,
	productTypeSchema,
	productVariantSchema,
	QUESTION_TYPE_BADGE,
	QUESTION_TYPE_LABELS,
	SUBJECT_CATEGORY_LABELS,
	subjectCategorySchema,
	TRYOUT_STATUS_BADGE,
	tryoutStatusSchema,
	variantConfig,
} from "./schemas";

describe("product variants", () => {
	test("rejects a value the closed set does not contain", () => {
		expect(productVariantSchema.allows("annual")).toBe(false);
		expect(productTypeSchema.allows("annual")).toBe(false);
		expect(productTypeSchema.allows("subscription")).toBe(true);
		expect(productTypeSchema.allows("product")).toBe(true);
	});

	test("the admin filter offers every variant the map knows", () => {
		expect(Object.keys(variantConfig).sort()).toEqual(["credits", "fixed_date", "monthly"]);
		for (const value of Object.keys(variantConfig)) {
			expect(productVariantSchema.allows(value), value).toBe(true);
		}
	});

	test("only credits is not a subscription", () => {
		expect(productVariantSchema.allows("fixed_date")).toBe(true);
		expect(productVariantSchema.allows("credits")).toBe(true);
		expect(productVariantSchema.allows("monthly")).toBe(true);
		expect(isSubscriptionVariant("fixed_date")).toBe(true);
		expect(isSubscriptionVariant("monthly")).toBe(true);
		expect(isSubscriptionVariant("credits")).toBe(false);
	});
});

describe("question types", () => {
	test("every type has an Indonesian label", () => {
		expect(QUESTION_TYPE_LABELS).toEqual({
			multiple_choice: "Pilihan Ganda",
			multiple_choice_complex: "Pilihan Ganda Kompleks",
			essay: "Esai",
		});
	});
});

describe("question type appearance", () => {
	test("every question type has a badge variant", () => {
		expect(QUESTION_TYPE_BADGE).toEqual({
			multiple_choice: "default",
			multiple_choice_complex: "secondary",
			essay: "outline",
		});
		for (const type of Object.keys(QUESTION_TYPE_LABELS)) {
			expect(QUESTION_TYPE_BADGE[type as keyof typeof QUESTION_TYPE_BADGE]).toBeDefined();
		}
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
