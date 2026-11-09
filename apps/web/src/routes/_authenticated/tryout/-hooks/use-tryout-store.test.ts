import { beforeEach, describe, expect, test } from "bun:test";
import { updateTryoutAnswerCache, useTryoutStore } from "./use-tryout-store";

describe("useTryoutStore answer management and rollback", () => {
	beforeEach(() => {
		useTryoutStore.getState().reset();
	});

	test("sets and updates single choice answers", () => {
		useTryoutStore.getState().setAnswer(1, 101);
		expect(useTryoutStore.getState().answers[1]).toBe(101);

		useTryoutStore.getState().setAnswer(1, 102);
		expect(useTryoutStore.getState().answers[1]).toBe(102);
	});

	test("rolls back single choice answer by restoring previous choice", () => {
		useTryoutStore.getState().setAnswer(1, 101);
		const previousChoice = useTryoutStore.getState().answers[1];

		useTryoutStore.getState().setAnswer(1, 102);
		expect(useTryoutStore.getState().answers[1]).toBe(102);

		if (previousChoice !== undefined) {
			useTryoutStore.getState().setAnswer(1, previousChoice);
		}
		expect(useTryoutStore.getState().answers[1]).toBe(101);
	});

	test("rolls back single choice answer by removing when previously unanswered", () => {
		const previousChoice = useTryoutStore.getState().answers[1];
		expect(previousChoice).toBeUndefined();

		useTryoutStore.getState().setAnswer(1, 101);
		expect(useTryoutStore.getState().answers[1]).toBe(101);

		if (previousChoice === undefined) {
			useTryoutStore.getState().removeAnswer(1);
		}
		expect(useTryoutStore.getState().answers[1]).toBeUndefined();
	});

	test("sets and updates complex choice answers", () => {
		useTryoutStore.getState().setComplexAnswer(2, [201, 202]);
		expect(useTryoutStore.getState().complexAnswers[2]).toEqual([201, 202]);

		useTryoutStore.getState().setComplexAnswer(2, [201]);
		expect(useTryoutStore.getState().complexAnswers[2]).toEqual([201]);
	});

	test("rolls back complex choice answer by restoring previous choices", () => {
		useTryoutStore.getState().setComplexAnswer(2, [201]);
		const previousChoices = useTryoutStore.getState().complexAnswers[2];

		useTryoutStore.getState().setComplexAnswer(2, [201, 202]);
		expect(useTryoutStore.getState().complexAnswers[2]).toEqual([201, 202]);

		if (previousChoices !== undefined) {
			useTryoutStore.getState().setComplexAnswer(2, previousChoices);
		}
		expect(useTryoutStore.getState().complexAnswers[2]).toEqual([201]);
	});

	test("rolls back complex choice answer by removing when previously unanswered", () => {
		const previousChoices = useTryoutStore.getState().complexAnswers[2];
		expect(previousChoices).toBeUndefined();

		useTryoutStore.getState().setComplexAnswer(2, [201, 202]);
		expect(useTryoutStore.getState().complexAnswers[2]).toEqual([201, 202]);

		if (previousChoices === undefined) {
			useTryoutStore.getState().removeComplexAnswer(2);
		}
		expect(useTryoutStore.getState().complexAnswers[2]).toBeUndefined();
	});

	test("sets and updates essay answers", () => {
		useTryoutStore.getState().setEssayAnswer(3, "jawaban awal");
		expect(useTryoutStore.getState().essayAnswers[3]).toBe("jawaban awal");

		useTryoutStore.getState().setEssayAnswer(3, "jawaban revisi");
		expect(useTryoutStore.getState().essayAnswers[3]).toBe("jawaban revisi");
	});

	test("resets store state to initial values", () => {
		useTryoutStore.getState().setAnswer(1, 101);
		useTryoutStore.getState().setComplexAnswer(2, [201]);
		useTryoutStore.getState().setEssayAnswer(3, "jawaban");
		useTryoutStore.getState().reset();

		expect(useTryoutStore.getState().answers).toEqual({});
		expect(useTryoutStore.getState().complexAnswers).toEqual({});
		expect(useTryoutStore.getState().essayAnswers).toEqual({});
	});
});

interface TestUserAnswer {
	selectedChoiceId: number | null;
	selectedChoiceIds: number[] | null;
	essayAnswer: string | null;
	isDoubtful: boolean;
}

interface TestQuestion {
	id: number;
	type: "multiple_choice" | "multiple_choice_complex" | "essay";
	content: { type: string; content: unknown[] };
	choices: Array<{ id: number; code?: string; content: string }>;
	userAnswer: TestUserAnswer | null;
}

interface TestData {
	id: number;
	title: string;
	currentSubtest: {
		id: number;
		title: string;
		questions: TestQuestion[];
	};
}

describe("updateTryoutAnswerCache", () => {
	const initialData: TestData = {
		id: 1,
		title: "Simulasi UTBK",
		currentSubtest: {
			id: 10,
			title: "Penalaran Umum",
			questions: [
				{
					id: 1,
					type: "multiple_choice" as const,
					content: { type: "doc", content: [] },
					choices: [
						{ id: 101, code: "A", content: "Pilihan A" },
						{ id: 102, code: "B", content: "Pilihan B" },
					],
					userAnswer: {
						selectedChoiceId: 101,
						selectedChoiceIds: null,
						essayAnswer: null,
						isDoubtful: false,
					},
				},
				{
					id: 2,
					type: "multiple_choice_complex" as const,
					content: { type: "doc", content: [] },
					choices: [
						{ id: 201, code: "A", content: "Pernyataan 1" },
						{ id: 202, code: "B", content: "Pernyataan 2" },
					],
					userAnswer: null,
				},
				{
					id: 3,
					type: "essay" as const,
					content: { type: "doc", content: [] },
					choices: [],
					userAnswer: {
						selectedChoiceId: null,
						selectedChoiceIds: null,
						essayAnswer: "jawaban awal",
						isDoubtful: true,
					},
				},
			],
		},
	};

	test("updates single choice answer immutably without mutating other questions", () => {
		const updated = updateTryoutAnswerCache(initialData, {
			questionId: 1,
			answerType: "choice",
			selectedChoiceId: 102,
		});

		expect(updated?.currentSubtest?.questions[0]?.userAnswer?.selectedChoiceId).toBe(102);
		expect(initialData.currentSubtest.questions[0].userAnswer?.selectedChoiceId).toBe(101);

		expect(updated?.currentSubtest?.questions[1]).toBe(initialData.currentSubtest.questions[1]);
		expect(updated?.currentSubtest?.questions[2]).toBe(initialData.currentSubtest.questions[2]);
	});

	test("creates userAnswer for question that had null userAnswer", () => {
		const updated = updateTryoutAnswerCache(initialData, {
			questionId: 2,
			answerType: "complex",
			selectedChoiceIds: [201, 202],
		});

		expect(updated?.currentSubtest?.questions[1]?.userAnswer).toEqual({
			selectedChoiceId: null,
			selectedChoiceIds: [201, 202],
			essayAnswer: null,
			isDoubtful: false,
		});
		expect(initialData.currentSubtest.questions[1].userAnswer).toBeNull();
	});

	test("updates essay answer while preserving other fields like isDoubtful", () => {
		const updated = updateTryoutAnswerCache(initialData, {
			questionId: 3,
			answerType: "essay",
			essayAnswer: "jawaban revisi",
		});

		expect(updated?.currentSubtest?.questions[2]?.userAnswer).toEqual({
			selectedChoiceId: null,
			selectedChoiceIds: null,
			essayAnswer: "jawaban revisi",
			isDoubtful: true,
		});
		expect(initialData.currentSubtest.questions[2].userAnswer?.essayAnswer).toBe("jawaban awal");
	});

	test("handles undefined or empty cache gracefully", () => {
		expect(updateTryoutAnswerCache(undefined, { questionId: 1, selectedChoiceId: 101 })).toBeUndefined();

		const withoutSubtest = { id: 1, currentSubtest: null };
		expect(updateTryoutAnswerCache(withoutSubtest, { questionId: 1, selectedChoiceId: 101 })).toEqual(withoutSubtest);
	});
});
