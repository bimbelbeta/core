import { db } from "@bimbelbeta/db";
import { tryoutAttempt, tryoutSubtestAttempt, tryoutUserAnswer } from "@bimbelbeta/db/schema/tryout";
import { eq, sql } from "drizzle-orm";
import { calculateTryoutScores, saveScoresToDatabase } from "@/lib/calculate-score";
import { authedImplementer } from "@/lib/router-definition";
import { parseNullableInt } from "@/lib/utils";

const authed = authedImplementer;

type SessionErrors = {
	BAD_REQUEST: (opts: { message: string }) => Error;
	NOT_FOUND: (opts: { message: string }) => Error;
	INTERNAL_SERVER_ERROR: (opts: { message: string }) => Error;
};

type ActiveSubtestResult = {
	attempt: Awaited<ReturnType<typeof db.query.tryoutAttempt.findFirst>> & {
		subtestAttempts: { id: number; subtestId: number; status: string; deadline: Date | null; score: string | null }[];
	};
	currentSubtestAttempt: { id: number; subtestId: number; status: string; deadline: Date | null; score: string | null };
};

async function requireActiveSubtestAttempt(
	tryoutId: number,
	userId: string,
	errors: SessionErrors,
): Promise<ActiveSubtestResult> {
	const attempt = await db.query.tryoutAttempt.findFirst({
		where: {
			tryoutId: { eq: tryoutId },
			userId: { eq: userId },
			status: { eq: "ongoing" },
		},
		with: {
			subtestAttempts: true,
		},
	});

	if (!attempt) throw errors.BAD_REQUEST({ message: "Tidak ada pengerjaan yang aktif" });

	const currentSubtestAttempt = attempt.subtestAttempts.find((sa) => sa.status === "ongoing");
	if (!currentSubtestAttempt) throw errors.BAD_REQUEST({ message: "Tidak ada subtest yang aktif" });

	if (currentSubtestAttempt.deadline && currentSubtestAttempt.deadline < new Date()) {
		throw errors.BAD_REQUEST({ message: "Batas waktu subtest telah habis" });
	}

	const result: ActiveSubtestResult = { attempt, currentSubtestAttempt };
	return result;
}

function computeSubtestDeadline(durationMinutes: number, overallDeadline: Date, startFrom: Date = new Date()): Date {
	const proposed = new Date(startFrom.getTime() + durationMinutes * 60 * 1000);
	return new Date(Math.min(proposed.getTime(), overallDeadline.getTime()));
}

export const startSubtest = authed.tryout.startSubtest.handler(async ({ input, context, errors }) => {
	const attempt = await db.query.tryoutAttempt.findFirst({
		where: {
			tryoutId: { eq: input.tryoutId },
			userId: { eq: context.session.user.id },
		},
		with: {
			subtestAttempts: true,
			tryout: {
				with: {
					subtests: {
						orderBy: (subtests, { asc }) => [asc(subtests.order)],
					},
				},
			},
		},
	});

	if (!attempt) throw errors.BAD_REQUEST({ message: "Anda belum memulai tryout ini" });

	const existingSubtestAttempt = attempt.subtestAttempts.find((sa) => sa.subtestId === input.subtestId);
	if (existingSubtestAttempt) {
		return { ...existingSubtestAttempt, score: parseNullableInt(existingSubtestAttempt.score) };
	}

	const tryoutData = attempt.tryout;

	if (!tryoutData) throw errors.NOT_FOUND({ message: "Tryout tidak ditemukan" });

	const currentIndex = tryoutData.subtests.findIndex((s) => s.id === input.subtestId);
	if (currentIndex === -1) throw errors.NOT_FOUND({ message: "Subtest tidak ditemukan" });

	const currentSubtest = tryoutData.subtests[currentIndex]!;

	if (currentIndex > 0) {
		const prevSubtest = tryoutData.subtests[currentIndex - 1]!;
		const prevAttempt = attempt.subtestAttempts.find((sa) => sa.subtestId === prevSubtest.id);
		if (prevAttempt?.status !== "finished") {
			throw errors.BAD_REQUEST({
				message: "Selesaikan subtest sebelumnya terlebih dahulu",
			});
		}
	}

	const prevSubtestAttempt =
		currentIndex > 0
			? attempt.subtestAttempts.find((sa) => sa.subtestId === tryoutData.subtests[currentIndex - 1]!.id)
			: null;

	if (prevSubtestAttempt && !prevSubtestAttempt.deadline) {
		throw errors.BAD_REQUEST({ message: "Pengerjaan tidak memiliki batas waktu" });
	}

	const startFrom = prevSubtestAttempt?.deadline ?? new Date();
	const deadline = computeSubtestDeadline(currentSubtest.duration, attempt.deadline, startFrom);

	const [subAttempt] = await db
		.insert(tryoutSubtestAttempt)
		.values({
			tryoutAttemptId: attempt.id,
			subtestId: input.subtestId,
			deadline,
		})
		.returning();

	if (!subAttempt) {
		throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal memulai subtest" });
	}

	return { ...subAttempt, score: parseNullableInt(subAttempt.score) };
});

export const saveAnswer = authed.tryout.saveAnswer.handler(async ({ input, context, errors }) => {
	const { attempt } = await requireActiveSubtestAttempt(input.tryoutId, context.session.user.id, errors);

	const answerFields = {
		selectedChoiceId: input.answerType === "choice" ? input.selectedChoiceId : null,
		selectedChoiceIds: input.answerType === "complex" ? input.selectedChoiceIds : null,
		essayAnswer: input.answerType === "essay" ? input.essayAnswer : null,
	};

	await db
		.insert(tryoutUserAnswer)
		.values({
			attemptId: attempt.id,
			questionId: input.questionId,
			...answerFields,
		})
		.onConflictDoUpdate({
			target: [tryoutUserAnswer.attemptId, tryoutUserAnswer.questionId],
			set: answerFields,
		})
		.catch((e) => {
			console.error(e);
			throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal menyimpan jawaban." });
		});

	return { success: true };
});

/**
 * Toggles the "ragu-ragu" (uncertain/flagged for review) status of a question.
 * In Indonesian educational context, "ragu-ragu" means a student is unsure about
 * their answer and wants to flag it for review before final submission.
 */
export const toggleRaguRagu = authed.tryout.toggleRaguRagu.handler(async ({ input, context, errors }) => {
	const { attempt } = await requireActiveSubtestAttempt(input.tryoutId, context.session.user.id, errors);

	await db
		.insert(tryoutUserAnswer)
		.values({
			attemptId: attempt.id,
			questionId: input.questionId,
			isDoubtful: true,
		})
		.onConflictDoUpdate({
			target: [tryoutUserAnswer.attemptId, tryoutUserAnswer.questionId],
			set: { isDoubtful: sql`NOT ${tryoutUserAnswer.isDoubtful}` },
		})
		.catch((e) => {
			console.error(e);
			throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal menyimpan status ragu-ragu." });
		});

	return { success: true };
});

export const submitSubtest = authed.tryout.submitSubtest.handler(async ({ input, context, errors }) => {
	const attempt = await db.query.tryoutAttempt.findFirst({
		where: {
			tryoutId: { eq: input.tryoutId },
			userId: { eq: context.session.user.id },
			status: { eq: "ongoing" },
		},
		with: {
			subtestAttempts: true,
			tryout: {
				with: {
					subtests: {
						orderBy: (subtests, { asc }) => [asc(subtests.order)],
					},
				},
			},
		},
	});

	if (!attempt) throw errors.BAD_REQUEST({ message: "Gagal menemukan pengerjaan tryout." });

	const currentSubtestAttempt = attempt.subtestAttempts.find(
		(sa) => sa.subtestId === input.subtestId && sa.status === "ongoing",
	);

	if (!currentSubtestAttempt) throw errors.BAD_REQUEST({ message: "Subtest tidak aktif" });

	const tryoutData = attempt.tryout;

	if (!tryoutData) throw errors.NOT_FOUND({ message: "Tryout tidak ditemukan" });

	const currentIndex = tryoutData.subtests.findIndex((s) => s.id === input.subtestId);
	if (currentIndex === -1) throw errors.NOT_FOUND({ message: "Subtest tidak ditemukan" });

	const now = new Date();
	if (attempt.deadline && attempt.deadline < now) {
		throw errors.BAD_REQUEST({
			message: "Tryout telah berakhir",
		});
	}

	const nextSubtest = tryoutData.subtests[currentIndex + 1];
	if (nextSubtest) {
		const nextDeadline = computeSubtestDeadline(nextSubtest.duration, attempt.deadline);
		await db
			.transaction(async (tx) => {
				await tx
					.update(tryoutSubtestAttempt)
					.set({ status: "finished", completedAt: new Date() })
					.where(eq(tryoutSubtestAttempt.id, currentSubtestAttempt.id));
				await tx.insert(tryoutSubtestAttempt).values({
					tryoutAttemptId: attempt.id,
					subtestId: nextSubtest.id,
					deadline: nextDeadline,
				});
			})
			.catch((e) => {
				console.error(e);
				throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal menyimpan progres subtest." });
			});
		return { success: true as const, tryoutCompleted: false as const, nextSubtestId: nextSubtest.id };
	}

	const scores = await calculateTryoutScores(attempt.id);

	await db
		.transaction(async (tx) => {
			await tx
				.update(tryoutSubtestAttempt)
				.set({ status: "finished", completedAt: new Date() })
				.where(eq(tryoutSubtestAttempt.id, currentSubtestAttempt.id));

			await tx
				.update(tryoutAttempt)
				.set({ status: "finished", completedAt: new Date() })
				.where(eq(tryoutAttempt.id, attempt.id));

			await saveScoresToDatabase(attempt.id, scores, tx);
		})
		.catch((e) => {
			console.error(e);
			throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal menyimpan skor tryout." });
		});

	return { success: true, tryoutCompleted: true as const, score: scores.totalScore };
});

export const submitTryout = authed.tryout.submitTryout.handler(async ({ input, context, errors }) => {
	const attempt = await db.query.tryoutAttempt.findFirst({
		where: {
			tryoutId: { eq: input.tryoutId },
			userId: { eq: context.session.user.id },
			status: { eq: "ongoing" },
		},
	});

	if (!attempt) throw errors.BAD_REQUEST({ message: "Gagal menemukan pengerjaan tryout." });

	const scores = await calculateTryoutScores(attempt.id);

	await db
		.transaction(async (tx) => {
			await tx
				.update(tryoutAttempt)
				.set({
					status: "finished",
					completedAt: new Date(),
				})
				.where(eq(tryoutAttempt.id, attempt.id));

			await saveScoresToDatabase(attempt.id, scores, tx);
		})
		.catch((e) => {
			console.error(e);
			throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal menyimpan skor tryout." });
		});

	return { success: true as const, score: scores.totalScore };
});
