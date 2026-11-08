import { readTiptapContent } from "@/lib/content-utils";
import type { ReviewQuestion, TryoutQuestion } from "@/types/question";

export type SubtestQuestionRow = {
	questionId: number;
	questionContent: string;
	questionContentJson: unknown;
	questionType: "multiple_choice" | "multiple_choice_complex" | "essay";
	discussion: string;
	discussionJson: unknown;
	choiceId: number | null;
	choiceContent: string | null;
	choiceCode: string | null;
	isCorrectChoice: boolean | null;
	userSelectedChoiceId: number | null;
	userSelectedChoiceIds: number[] | null;
	userEssayAnswer: string | null;
	userIsDoubtful: boolean | null;
};

export function flattenTryoutQuestions(rows: SubtestQuestionRow[]): TryoutQuestion[] {
	const map = new Map<number, TryoutQuestion>();
	for (const row of rows) {
		if (!map.has(row.questionId)) {
			map.set(row.questionId, {
				id: row.questionId,
				content: readTiptapContent(row.questionContentJson, row.questionContent),
				type: row.questionType,
				choices: [],
				userAnswer: {
					selectedChoiceId: row.userSelectedChoiceId,
					selectedChoiceIds: row.userSelectedChoiceIds,
					essayAnswer: row.userEssayAnswer,
					isDoubtful: row.userIsDoubtful ?? false,
				},
			});
		}
		if (row.choiceId) {
			const q = map.get(row.questionId);
			if (q) {
				q.choices.push({
					id: row.choiceId,
					content: row.choiceContent!,
					code: row.choiceCode!,
				});
			}
		}
	}
	return Array.from(map.values());
}

export function flattenReviewQuestions(rows: SubtestQuestionRow[], canSeeDiscussion: boolean): ReviewQuestion[] {
	const map = new Map<number, ReviewQuestion>();
	for (const row of rows) {
		if (!map.has(row.questionId)) {
			map.set(row.questionId, {
				id: row.questionId,
				content: readTiptapContent(row.questionContentJson, row.questionContent),
				type: row.questionType,
				discussion: canSeeDiscussion ? readTiptapContent(row.discussionJson, row.discussion) : null,
				choices: [],
				userAnswer: {
					selectedChoiceId: row.userSelectedChoiceId,
					selectedChoiceIds: row.userSelectedChoiceIds,
					essayAnswer: row.userEssayAnswer,
					isDoubtful: row.userIsDoubtful ?? false,
				},
			});
		}
		if (row.choiceId) {
			const q = map.get(row.questionId);
			if (q) {
				q.choices.push({
					id: row.choiceId,
					content: row.choiceContent!,
					code: row.choiceCode!,
					isCorrect: row.isCorrectChoice ?? false,
				});
			}
		}
	}
	return Array.from(map.values());
}
