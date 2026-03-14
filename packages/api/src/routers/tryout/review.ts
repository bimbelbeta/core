import { db } from "@bimbelbeta/db";
import { question, questionChoice } from "@bimbelbeta/db/schema/question";
import { tryoutSubtestQuestion, tryoutUserAnswer } from "@bimbelbeta/db/schema/tryout";
import { and, eq } from "drizzle-orm";
import { authed } from "../../index";
import { convertToTiptap } from "../../lib/convert-to-tiptap";

import type { ReviewQuestion } from "../../types/question";

export const review = authed.tryout.review.handler(async ({ input, context, errors }) => {
	const attempt = await db.query.tryoutAttempt.findFirst({
		where: {
			id: { eq: input.attemptId },
			userId: { eq: context.session.user.id },
		},
		columns: {
			id: true,
			usedCredit: true,
		},
		with: {
			subtestAttempts: true,
		},
	});

	if (!attempt) throw errors.NOT_FOUND({ message: "Gagal menemukan pengerjaan tryout." });

	const canSeeDiscussion = context.session.user.isPremium || attempt.usedCredit;

	const subtestAttempt = attempt.subtestAttempts.find((sa) => sa.subtestId === input.subtestId);

	if (!subtestAttempt || subtestAttempt.status !== "finished") {
		throw errors.BAD_REQUEST({ message: "Subtest belum selesai atau tidak ditemukan." });
	}

	const rows = await db
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
			and(eq(tryoutUserAnswer.questionId, question.id), eq(tryoutUserAnswer.attemptId, attempt.id)),
		)
		.where(eq(tryoutSubtestQuestion.subtestId, input.subtestId))
		.orderBy(tryoutSubtestQuestion.order);

	const questionsMap = new Map<number, ReviewQuestion>();
	for (const row of rows) {
		if (!questionsMap.has(row.questionId)) {
			questionsMap.set(row.questionId, {
				id: row.questionId,
				content: row.questionContentJson || convertToTiptap(row.questionContent),
				type: row.questionType,
				discussion: canSeeDiscussion ? row.discussionJson || convertToTiptap(row.discussion) : null,
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
			const q = questionsMap.get(row.questionId);
			if (q) {
				q.choices.push({
					id: row.choiceId,
					content: row.choiceContent!,
					code: row.choiceCode!,
					isCorrect: row.isCorrectChoice || false,
				});
			}
		}
	}

	const subtestData = await db.query.tryoutSubtest.findFirst({
		where: {
			id: { eq: input.subtestId },
		},
		columns: {
			name: true,
		},
	});

	if (!subtestData) {
		throw errors.NOT_FOUND({ message: "Subtest tidak ditemukan" });
	}

	return {
		subtest: subtestData,
		questions: Array.from(questionsMap.values()),
	};
});
