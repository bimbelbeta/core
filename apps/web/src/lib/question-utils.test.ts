import { describe, expect, test } from "bun:test";
import { getQuestionBadgeVariant, getQuestionTypeLabel, isQuestionType } from "./question-utils";

describe("getQuestionTypeLabel", () => {
	test("returns full label by default", () => {
		expect(getQuestionTypeLabel("multiple_choice")).toBe("Pilihan Ganda");
		expect(getQuestionTypeLabel("multiple_choice_complex")).toBe("Pilihan Ganda Kompleks");
		expect(getQuestionTypeLabel("essay")).toBe("Esai");
	});

	test("returns short label when format is short", () => {
		expect(getQuestionTypeLabel("multiple_choice", "short")).toBe("PG");
		expect(getQuestionTypeLabel("multiple_choice_complex", "short")).toBe("PGK");
		expect(getQuestionTypeLabel("essay", "short")).toBe("Esai");
	});
});

describe("getQuestionBadgeVariant", () => {
	test("returns correct badge variant for each question type", () => {
		expect(getQuestionBadgeVariant("multiple_choice")).toBe("default");
		expect(getQuestionBadgeVariant("multiple_choice_complex")).toBe("secondary");
		expect(getQuestionBadgeVariant("essay")).toBe("outline");
	});
});

describe("isQuestionType", () => {
	test("identifies valid question types", () => {
		expect(isQuestionType("multiple_choice")).toBe(true);
		expect(isQuestionType("multiple_choice_complex")).toBe(true);
		expect(isQuestionType("essay")).toBe(true);
	});

	test("rejects invalid question types", () => {
		expect(isQuestionType("single_choice")).toBe(false);
		expect(isQuestionType("")).toBe(false);
		expect(isQuestionType("unknown")).toBe(false);
	});
});
