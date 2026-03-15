import { describe, expect, test } from "bun:test";
import { getScoreFromMap } from "./calculate-score";

// ─── scoring map lookup ────────────────────────────────────────────────────────
describe("getScoreFromMap", () => {
	test("returns mapped score when key exists", () => {
		const map = { "0": 100, "3": 450, "5": 700 };
		expect(getScoreFromMap(map, 3, 5)).toBe(450);
	});

	test("returns mapped score for 0 correct", () => {
		const map = { "0": 100 };
		expect(getScoreFromMap(map, 0, 10)).toBe(100);
	});

	test("falls back to linear scale when key missing from map", () => {
		const map = { "5": 700 };
		// 3/10 * 1000 = 300
		expect(getScoreFromMap(map, 3, 10)).toBe(300);
	});

	test("falls back to linear scale when map is null", () => {
		// 2/4 * 1000 = 500
		expect(getScoreFromMap(null, 2, 4)).toBe(500);
	});

	test("falls back to linear scale when map is undefined", () => {
		// 1/3 * 1000 = 333
		expect(getScoreFromMap(undefined, 1, 3)).toBe(333);
	});

	test("linear scale rounds correctly", () => {
		// 1/3 * 1000 = 333.33... → 333
		expect(getScoreFromMap(null, 1, 3)).toBe(333);
		// 2/3 * 1000 = 666.66... → 667
		expect(getScoreFromMap(null, 2, 3)).toBe(667);
	});

	test("returns 1000 for perfect score via linear fallback", () => {
		expect(getScoreFromMap(null, 10, 10)).toBe(1000);
	});

	test("returns 0 for zero correct via linear fallback", () => {
		expect(getScoreFromMap(null, 0, 10)).toBe(0);
	});
});

// ─── multiple_choice scoring logic ────────────────────────────────────────────
describe("multiple_choice scoring", () => {
	function scoreMultipleChoice(isCorrect: boolean | null | undefined): boolean {
		return !!isCorrect;
	}

	test("correct answer scores a point", () => {
		expect(scoreMultipleChoice(true)).toBe(true);
	});

	test("incorrect answer does not score", () => {
		expect(scoreMultipleChoice(false)).toBe(false);
	});

	test("no selected choice does not score", () => {
		expect(scoreMultipleChoice(null)).toBe(false);
		expect(scoreMultipleChoice(undefined)).toBe(false);
	});
});

// ─── multiple_choice_complex scoring logic ────────────────────────────────────
describe("multiple_choice_complex scoring", () => {
	function scoreComplexChoice(selectedIds: number[], choices: Array<{ id: number; isCorrect: boolean }>): boolean {
		const correctChoiceIds = choices.filter((c) => c.isCorrect).map((c) => c.id);
		const selectedIncorrectChoices = selectedIds.filter((id) => !correctChoiceIds.includes(id));
		const allCorrectSelected = correctChoiceIds.every((id) => selectedIds.includes(id));
		const noIncorrectSelected = selectedIncorrectChoices.length === 0;
		return allCorrectSelected && noIncorrectSelected;
	}

	const choices = [
		{ id: 1, isCorrect: true },
		{ id: 2, isCorrect: true },
		{ id: 3, isCorrect: false },
		{ id: 4, isCorrect: false },
	];

	test("selects all correct and no incorrect → correct", () => {
		expect(scoreComplexChoice([1, 2], choices)).toBe(true);
	});

	test("selects all correct plus an incorrect → wrong", () => {
		expect(scoreComplexChoice([1, 2, 3], choices)).toBe(false);
	});

	test("selects only one of two correct → wrong", () => {
		expect(scoreComplexChoice([1], choices)).toBe(false);
	});

	test("selects nothing → wrong", () => {
		expect(scoreComplexChoice([], choices)).toBe(false);
	});

	test("selects only incorrect choices → wrong", () => {
		expect(scoreComplexChoice([3, 4], choices)).toBe(false);
	});

	test("single correct choice: exact match → correct", () => {
		const single = [
			{ id: 1, isCorrect: true },
			{ id: 2, isCorrect: false },
		];
		expect(scoreComplexChoice([1], single)).toBe(true);
	});
});

// ─── essay scoring logic ───────────────────────────────────────────────────────
describe("essay scoring", () => {
	function scoreEssay(userAnswer: string | null | undefined, correctAnswer: string | null | undefined): boolean {
		const userEssay = userAnswer?.trim().toLowerCase() ?? "";
		const correctEssay = correctAnswer?.trim().toLowerCase() ?? "";
		return !!(userEssay && correctEssay && userEssay === correctEssay);
	}

	test("exact match → correct", () => {
		expect(scoreEssay("photosynthesis", "photosynthesis")).toBe(true);
	});

	test("case-insensitive match → correct", () => {
		expect(scoreEssay("Photosynthesis", "photosynthesis")).toBe(true);
		expect(scoreEssay("PHOTOSYNTHESIS", "PHOTOSYNTHESIS")).toBe(true);
	});

	test("leading/trailing whitespace trimmed → correct", () => {
		expect(scoreEssay("  photosynthesis  ", "photosynthesis")).toBe(true);
	});

	test("different answer → wrong", () => {
		expect(scoreEssay("respiration", "photosynthesis")).toBe(false);
	});

	test("empty user answer → wrong", () => {
		expect(scoreEssay("", "photosynthesis")).toBe(false);
		expect(scoreEssay(null, "photosynthesis")).toBe(false);
		expect(scoreEssay(undefined, "photosynthesis")).toBe(false);
	});

	test("empty correct answer → wrong (no essay to compare against)", () => {
		expect(scoreEssay("photosynthesis", "")).toBe(false);
		expect(scoreEssay("photosynthesis", null)).toBe(false);
	});
});

// ─── total score averaging ─────────────────────────────────────────────────────
describe("total score calculation", () => {
	function calcTotal(scores: number[]): number {
		if (scores.length === 0) return 0;
		return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
	}

	test("average of subtest scores", () => {
		expect(calcTotal([500, 750, 250])).toBe(500);
	});

	test("single subtest → that score", () => {
		expect(calcTotal([800])).toBe(800);
	});

	test("no subtests → 0", () => {
		expect(calcTotal([])).toBe(0);
	});

	test("rounds to nearest integer", () => {
		// (500 + 501) / 2 = 500.5 → 501
		expect(calcTotal([500, 501])).toBe(501);
	});
});
