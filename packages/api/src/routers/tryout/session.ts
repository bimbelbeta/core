import { db } from "@bimbelbeta/db";
import { tryoutAttempt, tryoutSubtestAttempt, tryoutUserAnswer } from "@bimbelbeta/db/schema/tryout";
import { and, eq } from "drizzle-orm";
import { authed } from "../../index";
import { calculateTryoutScores, saveScoresToDatabase } from "../../lib/calculate-score";
import { numericToNumber } from "../../lib/utils";

export const startSubtest = authed.tryout.startSubtest.handler(async ({ input, context, errors }) => {
	const attempt = await db.query.tryoutAttempt.findFirst({
		where: {
			tryoutId: { eq: input.tryoutId },
			userId: { eq: context.session.user.id },
		},
		with: {
			subtestAttempts: true,
		},
	});

	if (!attempt) throw errors.BAD_REQUEST({ message: "Anda belum memulai tryout ini" });

	const existingSubtestAttempt = attempt.subtestAttempts.find((sa) => sa.subtestId === input.subtestId);
	if (existingSubtestAttempt) {
		return { ...existingSubtestAttempt, score: numericToNumber(existingSubtestAttempt.score) };
	}

	const tryoutData = await db.query.tryout.findFirst({
		where: {
			id: { eq: input.tryoutId },
		},
		with: {
			subtests: {
				orderBy: (subtests, { asc }) => [asc(subtests.order)],
			},
		},
	});

	if (!tryoutData) throw errors.NOT_FOUND({ message: "Tryout tidak ditemukan" });

	const currentIndex = tryoutData.subtests.findIndex((s) => s.id === input.subtestId);
	if (currentIndex === -1) throw errors.NOT_FOUND({ message: "Subtest tidak ditemukan" });

	const currentSubtest = tryoutData.subtests[currentIndex]!;

	if (currentIndex > 0) {
		const prevSubtest = tryoutData.subtests[currentIndex - 1]!;
		const prevAttempt = attempt.subtestAttempts.find((sa) => sa.subtestId === prevSubtest.id);
		if (!prevAttempt || prevAttempt.status !== "finished") {
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

	const proposedDeadline = prevSubtestAttempt
		? new Date(prevSubtestAttempt.deadline.getTime() + currentSubtest.duration * 60 * 1000)
		: new Date(Date.now() + currentSubtest.duration * 60 * 1000);

	const deadline = new Date(Math.min(proposedDeadline.getTime(), attempt.deadline.getTime()));

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

	return { ...subAttempt, score: numericToNumber(subAttempt.score) };
});

export const saveAnswer = authed.tryout.saveAnswer.handler(async ({ input, context, errors }) => {
	const attempt = await db.query.tryoutAttempt.findFirst({
		where: {
			tryoutId: { eq: input.tryoutId },
			userId: { eq: context.session.user.id },
			status: { eq: "ongoing" },
		},
		with: {
			subtestAttempts: true,
		},
	});

	if (!attempt)
		throw errors.BAD_REQUEST({
			message: "Tidak ada pengerjaan yang aktif",
		});

	const currentSubtestAttempt = attempt.subtestAttempts.find((sa) => sa.status === "ongoing");
	if (!currentSubtestAttempt)
		throw errors.BAD_REQUEST({
			message: "Tidak ada subtest yang aktif",
		});

	if (currentSubtestAttempt.deadline && currentSubtestAttempt.deadline < new Date()) {
		throw errors.BAD_REQUEST({
			message: "Batas waktu subtest telah habis",
		});
	}

	await db
		.insert(tryoutUserAnswer)
		.values({
			attemptId: attempt.id,
			questionId: input.questionId,
			selectedChoiceId: input.selectedChoiceId,
			selectedChoiceIds: input.selectedChoiceIds,
			essayAnswer: input.essayAnswer,
		})
		.onConflictDoUpdate({
			target: [tryoutUserAnswer.attemptId, tryoutUserAnswer.questionId],
			set: {
				selectedChoiceId: input.selectedChoiceId,
				selectedChoiceIds: input.selectedChoiceIds,
				essayAnswer: input.essayAnswer,
			},
		});

	return { success: true };
});

export const toggleRaguRagu = authed.tryout.toggleRaguRagu.handler(async ({ input, context, errors }) => {
	const attempt = await db.query.tryoutAttempt.findFirst({
		where: {
			tryoutId: { eq: input.tryoutId },
			userId: { eq: context.session.user.id },
			status: { eq: "ongoing" },
		},
		with: {
			subtestAttempts: true,
		},
	});

	if (!attempt)
		throw errors.BAD_REQUEST({
			message: "Tidak ada pengerjaan yang aktif",
		});

	const currentSubtestAttempt = attempt.subtestAttempts.find((sa) => sa.status === "ongoing");
	if (!currentSubtestAttempt)
		throw errors.BAD_REQUEST({
			message: "Tidak ada subtest yang aktif",
		});

	if (currentSubtestAttempt.deadline && currentSubtestAttempt.deadline < new Date()) {
		throw errors.BAD_REQUEST({
			message: "Batas waktu subtest telah habis",
		});
	}

	const existingAnswer = await db.query.tryoutUserAnswer.findFirst({
		where: {
			attemptId: { eq: attempt.id },
			questionId: { eq: input.questionId },
		},
	});

	if (existingAnswer) {
		await db
			.update(tryoutUserAnswer)
			.set({ isDoubtful: !existingAnswer.isDoubtful })
			.where(and(eq(tryoutUserAnswer.attemptId, attempt.id), eq(tryoutUserAnswer.questionId, input.questionId)));
	} else {
		await db.insert(tryoutUserAnswer).values({
			attemptId: attempt.id,
			questionId: input.questionId,
			isDoubtful: true,
		});
	}

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
		},
	});

	if (!attempt) throw errors.BAD_REQUEST({ message: "Gagal menemukan pengerjaan tryout." });

	const currentSubtestAttempt = attempt.subtestAttempts.find(
		(sa) => sa.subtestId === input.subtestId && sa.status === "ongoing",
	);

	if (!currentSubtestAttempt) throw errors.BAD_REQUEST({ message: "Subtest tidak aktif" });

	const tryoutData = await db.query.tryout.findFirst({
		where: {
			id: { eq: input.tryoutId },
		},
		with: {
			subtests: {
				orderBy: (subtests, { asc }) => [asc(subtests.order)],
			},
		},
	});

	if (!tryoutData) throw errors.NOT_FOUND({ message: "Tryout tidak ditemukan" });

	const currentIndex = tryoutData.subtests.findIndex((s) => s.id === input.subtestId);
	if (currentIndex === -1) throw errors.NOT_FOUND({ message: "Subtest tidak ditemukan" });

	const now = new Date();
	if (attempt.deadline && attempt.deadline < now) {
		throw errors.BAD_REQUEST({
			message: "Tryout telah berakhir",
		});
	}

	await db
		.update(tryoutSubtestAttempt)
		.set({ status: "finished", completedAt: new Date() })
		.where(eq(tryoutSubtestAttempt.id, currentSubtestAttempt.id));

	const nextSubtest = tryoutData.subtests[currentIndex + 1];
	if (nextSubtest) {
		const proposedNextDeadline = new Date(Date.now() + nextSubtest.duration * 60 * 1000);
		const nextDeadline = new Date(Math.min(proposedNextDeadline.getTime(), attempt.deadline.getTime()));
		await db.insert(tryoutSubtestAttempt).values({
			tryoutAttemptId: attempt.id,
			subtestId: nextSubtest.id,
			deadline: nextDeadline,
		});
		return { success: true, nextSubtestId: nextSubtest.id };
	}

	const scores = await calculateTryoutScores(attempt.id);

	await db
		.update(tryoutAttempt)
		.set({ status: "finished", completedAt: new Date() })
		.where(eq(tryoutAttempt.id, attempt.id));

	await saveScoresToDatabase(attempt.id, scores);

	return { success: true, tryoutCompleted: true, score: scores.totalScore };
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
		.update(tryoutAttempt)
		.set({
			status: "finished",
			completedAt: new Date(),
		})
		.where(eq(tryoutAttempt.id, attempt.id));

	await saveScoresToDatabase(attempt.id, scores);

	return { success: true, score: scores.totalScore };
});
