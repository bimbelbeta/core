import { describe, expect, mock, test } from "bun:test";
import { createQuestionService } from "./question.service";

const choice = { content: "Pilihan", isCorrect: true };
const input = { type: "multiple_choice" as const, content: "Soal", discussion: "Pembahasan" };

describe("question creation", () => {
	test("rejects multiple-choice questions without two choices and exactly one correct answer", async () => {
		const save = mock(async () => 1);
		const service = createQuestionService(save);
		expect(await service.create(input)).toEqual({ status: "too_few_choices" });
		expect(await service.create({ ...input, choices: [choice, choice] })).toEqual({ status: "incorrect_choice_count" });
		expect(save).not.toHaveBeenCalled();
	});

	test("allows complex choices with no correct answer and normalizes content", async () => {
		const save = mock(async () => 7);
		const service = createQuestionService(save);
		const complex = {
			...input,
			type: "multiple_choice_complex" as const,
			content: { type: "doc", content: [] },
			choices: [
				{ ...choice, isCorrect: false },
				{ ...choice, isCorrect: false },
			],
		};
		expect(await service.create({ ...complex, choices: [] })).toEqual({ status: "too_few_complex_choices" });
		expect(await service.create(complex)).toEqual({ status: "created", id: 7 });
		expect(save).toHaveBeenCalledWith(complex, {
			contentJson: complex.content,
			discussionJson: null,
			contentText: JSON.stringify(complex.content),
			discussionText: "Pembahasan",
		});
	});

	test("reports a failed insert", async () => {
		const service = createQuestionService(async () => undefined);
		expect(await service.create({ ...input, type: "essay" })).toEqual({ status: "creation_failed" });
	});
});
