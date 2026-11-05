import { db } from "@bimbelbeta/db";
import { fetchSubtestQuestionRows, flattenTryoutQuestions } from "@/lib/question-utils";
import { authedImplementer } from "@/lib/router-definition";
import { startTryoutService } from "@/lib/tryout/start-tryout.service";
import { submitService } from "@/lib/tryout/submit.service";
import { toProcedureError } from "@/lib/tryout/tryout-error";
import { parseNullableInt } from "@/lib/utils";

const authed = authedImplementer;

export const find = authed.tryout.find.handler(async ({ input, context, errors }) => {
	const tryoutData = await db.query.tryout.findFirst({
		where: {
			id: { eq: input.id },
			status: { eq: "published" },
		},
		with: {
			subtests: {
				orderBy: (subtests, { asc }) => [asc(subtests.order)],
			},
		},
	});

	if (!tryoutData) throw errors.NOT_FOUND({ message: "Tryout tidak ditemukan." });

	const attempt = await db.query.tryoutAttempt.findFirst({
		where: {
			tryoutId: { eq: input.id },
			userId: { eq: context.session.user.id },
		},
		with: {
			subtestAttempts: true,
		},
	});

	if (!attempt || attempt.isRevoked)
		throw errors.UNAUTHORIZED({
			message: "Gagal menemukan pengerjaan tryout.",
		});

	const normalizedAttempt = { ...attempt, score: parseNullableInt(attempt.score) };

	if (normalizedAttempt.status === "finished") {
		return {
			...tryoutData,
			attempt: normalizedAttempt,
			currentSubtest: null,
			overallDeadline: normalizedAttempt.deadline,
			totalSubtests: tryoutData.subtests.length,
			completedSubtests: tryoutData.subtests.length,
		};
	}

	const completedSubtestIds = new Set(
		normalizedAttempt.subtestAttempts.filter((sa) => sa.status === "finished").map((sa) => sa.subtestId),
	);

	const currentSubtest = tryoutData.subtests.find((s) => !completedSubtestIds.has(s.id));

	if (
		Date.now() > normalizedAttempt.deadline.getTime() &&
		!normalizedAttempt.completedAt &&
		normalizedAttempt.status === "ongoing"
	) {
		await submitService.finalizeExpiredAttempt(normalizedAttempt.id);

		return {
			...tryoutData,
			attempt: { ...normalizedAttempt, status: "finished" as const, completedAt: new Date() },
			currentSubtest: null,
			overallDeadline: normalizedAttempt.deadline,
			totalSubtests: tryoutData.subtests.length,
			completedSubtests: completedSubtestIds.size,
		};
	}

	if (!currentSubtest) {
		return {
			...tryoutData,
			attempt: normalizedAttempt,
			currentSubtest: null,
			overallDeadline: normalizedAttempt.deadline,
			totalSubtests: tryoutData.subtests.length,
			completedSubtests: completedSubtestIds.size,
		};
	}

	const currentSubtestAttempt = normalizedAttempt.subtestAttempts.find((sa) => sa.subtestId === currentSubtest.id);

	if (!currentSubtestAttempt) {
		return {
			...tryoutData,
			attempt: normalizedAttempt,
			currentSubtest: {
				...currentSubtest,
				questions: [],
				deadline: null,
				status: "ongoing",
			},
			overallDeadline: normalizedAttempt.deadline,
			totalSubtests: tryoutData.subtests.length,
			completedSubtests: completedSubtestIds.size,
		};
	}

	const rows = await fetchSubtestQuestionRows(currentSubtest.id, attempt.id);
	const questions = flattenTryoutQuestions(rows);

	return {
		...tryoutData,
		attempt: normalizedAttempt,
		currentSubtest: {
			...currentSubtest,
			questions,
			deadline: currentSubtestAttempt.deadline,
			status: currentSubtestAttempt.status,
		},
		overallDeadline: normalizedAttempt.deadline,
		totalSubtests: tryoutData.subtests.length,
		completedSubtests: completedSubtestIds.size,
	};
});

export const start = authed.tryout.start.handler(async ({ input, context, errors }) => {
	try {
		return await startTryoutService.start(input, context.session.user);
	} catch (error) {
		return toProcedureError(error, errors);
	}
});

export const history = authed.tryout.history.handler(async ({ context }) => {
	const attempts = await db.query.tryoutAttempt.findMany({
		where: {
			userId: { eq: context.session.user.id },
			status: { eq: "finished" },
		},
		columns: {
			id: true,
			score: true,
			status: true,
			startedAt: true,
			completedAt: true,
		},
		orderBy: { startedAt: "desc" },
		with: {
			tryout: {
				columns: {
					id: true,
					title: true,
				},
			},
		},
	});

	return attempts.map((attempt) => ({
		...attempt,
		score: parseNullableInt(attempt.score),
		tryout: attempt.tryout!,
	}));
});

export const result = authed.tryout.result.handler(async ({ input, context, errors }) => {
	const attempt = await db.query.tryoutAttempt.findFirst({
		where: {
			id: { eq: input.attemptId },
			userId: { eq: context.session.user.id },
			status: { eq: "finished" },
		},
		columns: {
			id: true,
			startedAt: true,
			score: true,
			deadline: true,
			completedAt: true,
			status: true,
			usedCredit: true,
			usedAccessCode: true,
		},
		with: {
			tryout: {
				columns: {
					id: true,
					title: true,
					category: true,
					passingGrade: true,
				},
				with: {
					subtests: {
						orderBy: (subtests, { asc }) => [asc(subtests.order)],
						columns: {
							id: true,
							name: true,
							duration: true,
						},
					},
				},
			},
			subtestAttempts: {
				columns: {
					id: true,
					subtestId: true,
					status: true,
					completedAt: true,
					score: true,
				},
			},
		},
	});

	if (!attempt) {
		throw errors.NOT_FOUND({ message: "Gagal menemukan pengerjaan tryout." });
	}

	return {
		...attempt,
		score: parseNullableInt(attempt.score),
		tryout: attempt.tryout!,
		subtestAttempts: attempt.subtestAttempts.map((sa) => ({
			...sa,
			score: parseNullableInt(sa.score),
		})),
	};
});
