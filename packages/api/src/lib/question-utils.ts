import { db } from "@bimbelbeta/db";
import { question, questionChoice } from "@bimbelbeta/db/schema/question";
import { tryoutSubtestQuestion, tryoutUserAnswer } from "@bimbelbeta/db/schema/tryout";
import { and, eq } from "drizzle-orm";
import { readTiptapContent } from "@/lib/content-utils";
import type { ReviewQuestion, TryoutQuestion } from "@/types/question";

export async function fetchSubtestQuestionRows(subtestId: number, attemptId: number) {
	return db
		.select({
			questionId: question.id,
			questionContent: question.content,
			questionContentJson: question.contentJson,
			questionType: question.type,
			discussion: question.discussion,
			discussionJson: question.discussionJson,
			choiceId: questionChoice.id,
			choiceContent: questionChoice.content,
			choiceCode: questionChoice.code,
			isCorrectChoice: questionChoice.isCorrect,
			userSelectedChoiceId: tryoutUserAnswer.selectedChoiceId,
			userSelectedChoiceIds: tryoutUserAnswer.selectedChoiceIds,
			userEssayAnswer: tryoutUserAnswer.essayAnswer,
			userIsDoubtful: tryoutUserAnswer.isDoubtful,
		})
		.from(tryoutSubtestQuestion)
		.innerJoin(question, eq(question.id, tryoutSubtestQuestion.questionId))
		.leftJoin(questionChoice, eq(questionChoice.questionId, question.id))
		.leftJoin(
			tryoutUserAnswer,
			and(eq(tryoutUserAnswer.questionId, question.id), eq(tryoutUserAnswer.attemptId, attemptId)),
		)
		.where(eq(tryoutSubtestQuestion.subtestId, subtestId))
		.orderBy(tryoutSubtestQuestion.order);
}

export function flattenTryoutQuestions(rows: Awaited<ReturnType<typeof fetchSubtestQuestionRows>>): TryoutQuestion[] {
	const map = new Map<number, TryoutQuestion>();
	for (const row of rows) {
		if (!map.has(row.questionId)) {
			map.set(row.questionId, {
				id: row.questionId,
				content: readTiptapContent(row.questionContentJson, row.questionContent ?? ""),
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

export function flattenReviewQuestions(
	rows: Awaited<ReturnType<typeof fetchSubtestQuestionRows>>,
	canSeeDiscussion: boolean,
): ReviewQuestion[] {
	const map = new Map<number, ReviewQuestion>();
	for (const row of rows) {
		if (!map.has(row.questionId)) {
			map.set(row.questionId, {
				id: row.questionId,
				content: readTiptapContent(row.questionContentJson, row.questionContent ?? ""),
				type: row.questionType,
				discussion: canSeeDiscussion ? readTiptapContent(row.discussionJson, row.discussion ?? "") : null,
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
