import { describe, expect, test } from "bun:test";
import {
	calcTotalScore,
	getScoreFromMap,
	scoreComplexChoice,
	scoreEssay,
	scoreMultipleChoice,
} from "./calculate-score";

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

	test("returns 0 when totalCount is 0 (prevents NaN)", () => {
		expect(getScoreFromMap(null, 0, 0)).toBe(0);
	});
});

// ─── multiple_choice scoring ───────────────────────────────────────────────────
describe("scoreMultipleChoice", () => {
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

// ─── multiple_choice_complex scoring ─────────────────────────────────────────
describe("scoreComplexChoice", () => {
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

// ─── essay scoring ─────────────────────────────────────────────────────────────
describe("scoreEssay", () => {
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
describe("calcTotalScore", () => {
	test("average of subtest scores", () => {
		expect(calcTotalScore([500, 750, 250])).toBe(500);
	});

	test("single subtest → that score", () => {
		expect(calcTotalScore([800])).toBe(800);
	});

	test("no subtests → 0", () => {
		expect(calcTotalScore([])).toBe(0);
	});

	test("rounds to nearest integer", () => {
		// (500 + 501) / 2 = 500.5 → 501
		expect(calcTotalScore([500, 501])).toBe(501);
	});
});
