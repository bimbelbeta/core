import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { creditTransaction } from "@bimbelbeta/db/schema/credit";
import { tryoutAccessCode, tryoutAttempt, tryoutSubtestAttempt } from "@bimbelbeta/db/schema/tryout";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { hashAccessCode } from "@/lib/access-code";
import { calculateTryoutScores, saveScoresToDatabase } from "@/lib/calculate-score";
import { fetchSubtestQuestionRows, flattenTryoutQuestions } from "@/lib/question-utils";
import { authedImplementer } from "@/lib/router-definition";
import { parseNullableInt } from "@/lib/utils";

const authed = authedImplementer;

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
				accessCodeId: validAccessCode?.id ?? null,
			})
			.returning();

		if (!newAttempt) throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal membuat pengerjaan" });

		if (validAccessCode) {
			const code = validAccessCode;
			const [updatedCode] = await trx
				.update(tryoutAccessCode)
				.set({
					usedCount: sql`${tryoutAccessCode.usedCount} + 1`,
				})
				.where(
					and(
						eq(tryoutAccessCode.id, code.id),
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
