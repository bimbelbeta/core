import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { creditTransaction } from "@bimbelbeta/db/schema/credit";
import { question, questionChoice } from "@bimbelbeta/db/schema/question";
import {
	tryoutAccessCode,
	tryoutAttempt,
	tryoutSubtestAttempt,
	tryoutSubtestQuestion,
	tryoutUserAnswer,
} from "@bimbelbeta/db/schema/tryout";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { calculateTryoutScores, saveScoresToDatabase } from "@/lib/calculate-score";
import { readTiptapContent } from "@/lib/content-utils";
import { baseImplementer } from "@/lib/router-definition";
import { rateLimit, requireAuth } from "@/lib/router-definition/middleware";
import { parseNullableInt } from "@/lib/utils";
import { hashAccessCode } from "@/routers/admin/tryout/access-code-utils";

import type { TryoutQuestion } from "@/types/question";

const authed = baseImplementer.use(requireAuth).use(rateLimit);

/**
 * Fetches the raw joined rows for all questions in a subtest attempt.
 * Includes all fields needed by both attempt (questions) and review handlers.
 */
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

/**
 * Lazily finalizes an attempt whose overall deadline has passed.
 * This is called during the `find` read handler as a deliberate design choice:
 * the attempt is finalized on the next read after expiry rather than via a
 * background job, keeping infrastructure simple at the cost of a write-on-read.
 *
 * Calculates scores and persists everything atomically so a finalized attempt
 * always has a score — no partial-write window.
 */
async function finalizeExpiredAttempt(attemptId: number): Promise<void> {
	const scores = await calculateTryoutScores(attemptId);

	await db.transaction(async (tx) => {
		await tx
			.update(tryoutAttempt)
			.set({
				completedAt: new Date(),
				status: "finished",
			})
			.where(eq(tryoutAttempt.id, attemptId));

		await saveScoresToDatabase(attemptId, scores, tx);
	});
}

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
		await finalizeExpiredAttempt(normalizedAttempt.id);

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

	const questionsMap = new Map<number, TryoutQuestion>();
	for (const row of rows) {
		if (!questionsMap.has(row.questionId)) {
			questionsMap.set(row.questionId, {
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
			const q = questionsMap.get(row.questionId);
			if (q) {
				q.choices.push({
					id: row.choiceId,
					content: row.choiceContent!,
					code: row.choiceCode!,
				});
			}
		}
	}

	return {
		...tryoutData,
		attempt: normalizedAttempt,
		currentSubtest: {
			...currentSubtest,
			questions: Array.from(questionsMap.values()),
			deadline: currentSubtestAttempt.deadline,
			status: currentSubtestAttempt.status,
		},
		overallDeadline: normalizedAttempt.deadline,
		totalSubtests: tryoutData.subtests.length,
		completedSubtests: completedSubtestIds.size,
	};
});

export const start = authed.tryout.start.handler(async ({ input, context, errors }) => {
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

	if (!tryoutData) throw errors.NOT_FOUND({ message: "Tryout tidak ditemukan" });

	// Access control: Premium users OR users with image OR users with credits
	const isPremiumUser = context.session.user.isPremium;
	const hasImageProof = !!input.imageUrl;
	const wantsToUseCredit = !!input.useCredit;
	const userCredits = context.session.user.tryoutCredits ?? 0;

	const accessCodeInput = input.accessCode?.trim();
	const now = new Date();

	let validAccessCode: {
		id: number;
		isActive: boolean;
		expiresAt: Date | null;
		maxUses: number | null;
		usedCount: number;
	} | null = null;

	if (accessCodeInput) {
		const codeHash = hashAccessCode(accessCodeInput);
		validAccessCode =
			(await db.query.tryoutAccessCode.findFirst({
				where: {
					tryoutId: { eq: input.id },
					codeHash: { eq: codeHash },
				},
				columns: {
					id: true,
					isActive: true,
					expiresAt: true,
					maxUses: true,
					usedCount: true,
				},
			})) ?? null;

		if (!validAccessCode) {
			throw errors.FORBIDDEN({ message: "Kode akses tidak valid" });
		}

		if (!validAccessCode.isActive) {
			throw errors.FORBIDDEN({ message: "Kode akses tidak aktif" });
		}

		if (validAccessCode.expiresAt && validAccessCode.expiresAt < now) {
			throw errors.FORBIDDEN({ message: "Kode akses sudah kedaluwarsa" });
		}

		if (validAccessCode.maxUses !== null && validAccessCode.usedCount >= validAccessCode.maxUses) {
			throw errors.FORBIDDEN({ message: "Kuota kode akses sudah habis" });
		}
	}

	const usesAccessCode = !!validAccessCode && !wantsToUseCredit;

	if (!isPremiumUser && !hasImageProof && !wantsToUseCredit && !usesAccessCode) {
		throw errors.FORBIDDEN({
			message: "Upload bukti pembayaran, gunakan kredit tryout, atau masukkan kode akses",
		});
	}

	if (wantsToUseCredit && userCredits <= 0) {
		throw errors.FORBIDDEN({
			message: "Kredit tryout tidak cukup",
		});
	}

	const usesCredit = wantsToUseCredit && !isPremiumUser;
	if (tryoutData.startsAt && tryoutData.startsAt > now) {
		throw errors.BAD_REQUEST({
			message: "Tryout belum dimulai",
		});
	}
	if (tryoutData.endsAt && tryoutData.endsAt < now) {
		throw errors.BAD_REQUEST({
			message: "Tryout sudah selesai",
		});
	}

	const existingAttempt = await db.query.tryoutAttempt.findFirst({
		where: {
			tryoutId: { eq: input.id },
			userId: { eq: context.session.user.id },
		},
	});

	if (existingAttempt) {
		if (existingAttempt.isRevoked) {
			throw errors.FORBIDDEN({ message: "Pengerjaan telah dibatalkan" });
		}
		return {
			...existingAttempt,
			score: parseNullableInt(existingAttempt.score),
		};
	}

	if (tryoutData.subtests.length === 0) {
		throw errors.BAD_REQUEST({ message: "Tryout tidak memiliki subtest" });
	}

	let cumulativeMinutes = 0;
	const deadlineMap = new Map<number, Date>();

	for (const subtest of tryoutData.subtests) {
		cumulativeMinutes += subtest.duration;
		const deadline = new Date(now.getTime() + cumulativeMinutes * 60 * 1000);
		deadlineMap.set(subtest.id, deadline);
	}

	const overallDeadline = deadlineMap.get(tryoutData.subtests[tryoutData.subtests.length - 1]!.id)!;

	// Use a transaction to atomically create attempt and deduct credits if needed
	const attempt = await db.transaction(async (trx) => {
		const [newAttempt] = await trx
			.insert(tryoutAttempt)
			.values({
				tryoutId: input.id,
				userId: context.session.user.id,
				submittedImageUrl: usesCredit ? null : input.imageUrl,
				deadline: overallDeadline,
				usedCredit: usesCredit,
				usedAccessCode: usesAccessCode,
				accessCodeId: usesAccessCode ? validAccessCode?.id : null,
			})
			.returning();

		if (!newAttempt) throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal membuat pengerjaan" });

		if (usesAccessCode && validAccessCode) {
			const [updatedCode] = await trx
				.update(tryoutAccessCode)
				.set({
					usedCount: sql`${tryoutAccessCode.usedCount} + 1`,
				})
				.where(
					and(
						eq(tryoutAccessCode.id, validAccessCode.id),
						or(isNull(tryoutAccessCode.maxUses), sql`${tryoutAccessCode.usedCount} < ${tryoutAccessCode.maxUses}`),
					),
				)
				.returning({ id: tryoutAccessCode.id });

			if (!updatedCode) {
				throw errors.FORBIDDEN({
					message: "Kuota kode akses sudah habis",
				});
			}
		}

		if (usesCredit) {
			const [updatedUser] = await trx
				.update(user)
				.set({
					tryoutCredits: sql`${user.tryoutCredits} - 1`,
				})
				.where(eq(user.id, context.session.user.id))
				.returning({ tryoutCredits: user.tryoutCredits });

			await trx.insert(creditTransaction).values({
				userId: context.session.user.id,
				tryoutAttemptId: newAttempt.id,
				amount: -1,
				balanceAfter: updatedUser?.tryoutCredits ?? 0,
				note: `Used for tryout: ${tryoutData.title}`,
			});
		}

		const firstSubtest = tryoutData.subtests[0]!;
		await trx.insert(tryoutSubtestAttempt).values({
			tryoutAttemptId: newAttempt.id,
			subtestId: firstSubtest.id,
			deadline: deadlineMap.get(firstSubtest.id)!,
		});

		return newAttempt;
	});

	return {
		...attempt,
		score: parseNullableInt(attempt.score),
		overallDeadline,
	};
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

export const attemptResult = authed.tryout.attemptResult.handler(async ({ input, context, errors }) => {
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
