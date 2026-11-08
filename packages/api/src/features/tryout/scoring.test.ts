import { describe, expect, test } from "bun:test";
import {
	calcTotalScore,
	calcTryoutMaxScore,
	getScoreFromMap,
	scoreComplexChoice,
	scoreEssay,
	scoreMultipleChoice,
} from "./scoring";

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
		expect(getScoreFromMap(map, 3, 10)).toBe(300);
	});

	test("falls back to linear scale when map is null", () => {
		expect(getScoreFromMap(null, 2, 4)).toBe(500);
	});

	test("falls back to linear scale when map is undefined", () => {
		expect(getScoreFromMap(undefined, 1, 3)).toBe(333);
	});

	test("linear scale rounds correctly", () => {
		expect(getScoreFromMap(null, 1, 3)).toBe(333);
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

describe("calcTryoutMaxScore", () => {
	test("linear subtests max out at 1000", () => {
		expect(calcTryoutMaxScore([{ scoringMap: null, questionCount: 20 }])).toBe(1000);
	});

	test("uses the mapped score for a full-correct count", () => {
		expect(calcTryoutMaxScore([{ scoringMap: { "10": 850 }, questionCount: 10 }])).toBe(850);
	});

	test("averages the max of each subtest", () => {
		const subtests = [
			{ scoringMap: { "10": 800 }, questionCount: 10 },
			{ scoringMap: null, questionCount: 15 },
		];
		expect(calcTryoutMaxScore(subtests)).toBe(900);
	});

	test("ignores subtests without questions, like scoring does", () => {
		expect(calcTryoutMaxScore([{ scoringMap: { "0": 500 }, questionCount: 0 }])).toBe(0);
		expect(
			calcTryoutMaxScore([
				{ scoringMap: { "10": 600 }, questionCount: 10 },
				{ scoringMap: null, questionCount: 0 },
			]),
		).toBe(600);
	});

	test("no subtests → 0", () => {
		expect(calcTryoutMaxScore([])).toBe(0);
	});
});

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
		expect(calcTotalScore([500, 501])).toBe(501);
	});
});
