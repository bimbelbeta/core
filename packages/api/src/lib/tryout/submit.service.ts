import { db } from "@bimbelbeta/db";
import { tryoutAttempt, tryoutSubtestAttempt } from "@bimbelbeta/db/schema/tryout";
import { eq } from "drizzle-orm";
import { calculateTryoutScores, saveScoresToDatabase } from "@/lib/calculate-score";
import { computeSubtestDeadline } from "@/lib/tryout/start-subtest.service";
import { tryoutErrors as errors } from "@/lib/tryout/tryout-error";

export async function finalizeExpiredAttempt(attemptId: number): Promise<void> {
	const scores = await calculateTryoutScores(attemptId);

	await db.transaction(async (tx) => {
		await tx
			.update(tryoutAttempt)
			.set({ completedAt: new Date(), status: "finished" })
			.where(eq(tryoutAttempt.id, attemptId));
		await saveScoresToDatabase(attemptId, scores, tx);
	});
}

export async function submitSubtest(input: { tryoutId: number; subtestId: number }, userId: string) {
	const attempt = await db.query.tryoutAttempt.findFirst({
		where: {
			tryoutId: { eq: input.tryoutId },
			userId: { eq: userId },
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

	return { success: true as const, tryoutCompleted: true as const, score: scores.totalScore };
}

export async function submitTryout(input: { tryoutId: number }, userId: string) {
	const attempt = await db.query.tryoutAttempt.findFirst({
		where: {
			tryoutId: { eq: input.tryoutId },
			userId: { eq: userId },
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
}
