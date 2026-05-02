import { db } from "@bimbelbeta/db";
import { fetchSubtestQuestionRows, flattenReviewQuestions } from "@/lib/question-utils";
import { authedImplementer } from "@/lib/router-definition";

const authed = authedImplementer;

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
	const questions = flattenReviewQuestions(rows, canSeeDiscussion);

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
		questions,
	};
});
