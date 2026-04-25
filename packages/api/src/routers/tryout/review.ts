import { db } from "@bimbelbeta/db";
import { readTiptapContent } from "../../lib/content-utils";
import { baseImplementer } from "../../lib/router-definition";
import { rateLimit, requireAuth } from "../../lib/router-definition/middleware";
import type { ReviewQuestion } from "../../types/question";
import { fetchSubtestQuestionRows } from "./attempt";

const authed = baseImplementer.use(requireAuth).use(rateLimit);

export const review = authed.tryout.review.handler(async ({ input, context, errors }) => {
	const attempt = await db.query.tryoutAttempt.findFirst({
		where: {
			id: { eq: input.attemptId },
			userId: { eq: context.session.user.id },
		},
		columns: {
			id: true,
			usedCredit: true,
			usedAccessCode: true,
		},
		with: {
			subtestAttempts: true,
		},
	});

	if (!attempt) throw errors.NOT_FOUND({ message: "Gagal menemukan pengerjaan tryout." });

	const canSeeDiscussion = context.session.user.isPremium || attempt.usedCredit || attempt.usedAccessCode;

	const subtestAttempt = attempt.subtestAttempts.find((sa) => sa.subtestId === input.subtestId);

	if (!subtestAttempt || subtestAttempt.status !== "finished") {
		throw errors.BAD_REQUEST({ message: "Subtest belum selesai atau tidak ditemukan." });
	}

	const rows = await fetchSubtestQuestionRows(input.subtestId, attempt.id);

	const questionsMap = new Map<number, ReviewQuestion>();
	for (const row of rows) {
		if (!questionsMap.has(row.questionId)) {
			questionsMap.set(row.questionId, {
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
			const q = questionsMap.get(row.questionId);
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
