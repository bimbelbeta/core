import { describe, expect, test } from "bun:test";
import { validateQuestion } from "./question.service";

const choice = { content: "Pilihan", isCorrect: true };
const input = { type: "multiple_choice" as const, content: "Soal", discussion: "Pembahasan" };

describe("validateQuestion", () => {
	test("rejects a multiple choice without two choices", () => {
		expect(validateQuestion(input)).toEqual({ status: "too_few_choices" });
		expect(validateQuestion({ ...input, choices: [choice] })).toEqual({ status: "too_few_choices" });
	});

	test("rejects a multiple choice without exactly one correct answer", () => {
		expect(validateQuestion({ ...input, choices: [choice, choice] })).toEqual({ status: "incorrect_choice_count" });
		expect(
			validateQuestion({
				...input,
				choices: [
					{ ...choice, isCorrect: false },
					{ ...choice, isCorrect: false },
				],
			}),
		).toEqual({ status: "incorrect_choice_count" });
	});

	test("accepts a multiple choice with exactly one correct answer", () => {
		expect(validateQuestion({ ...input, choices: [choice, { ...choice, isCorrect: false }] })).toBeNull();
	});

	test("rejects a complex multiple choice without two choices", () => {
		expect(validateQuestion({ ...input, type: "multiple_choice_complex" })).toEqual({
			status: "too_few_complex_choices",
		});
	});

	test("accepts a complex multiple choice with no correct answer", () => {
		expect(
			validateQuestion({
				...input,
				type: "multiple_choice_complex",
				choices: [
					{ ...choice, isCorrect: false },
					{ ...choice, isCorrect: false },
				],
			}),
		).toBeNull();
	});

	test("accepts an essay without choices", () => {
		expect(validateQuestion({ ...input, type: "essay" })).toBeNull();
	});
});
