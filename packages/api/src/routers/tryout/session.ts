import { db } from "@bimbelbeta/db";
import { tryoutUserAnswer } from "@bimbelbeta/db/schema/tryout";
import { sql } from "drizzle-orm";
import { authedImplementer } from "@/lib/router-definition";
import { activeSubtestService } from "@/lib/tryout/active-subtest.service";
import { startSubtestService } from "@/lib/tryout/start-subtest.service";
import {
	submitSubtest as submitSubtestService,
	submitTryout as submitTryoutService,
} from "@/lib/tryout/submit.service";
import { toProcedureError } from "@/lib/tryout/tryout-error";

const authed = authedImplementer;

type SessionErrors = {
	BAD_REQUEST: (opts: { message: string }) => Error;
};

async function requireActiveSubtestAttempt(tryoutId: number, userId: string, errors: SessionErrors) {
	const result = await activeSubtestService.find(tryoutId, userId);
	if (result.status === "no_attempt") throw errors.BAD_REQUEST({ message: "Tidak ada pengerjaan yang aktif" });
	if (result.status === "no_subtest") throw errors.BAD_REQUEST({ message: "Tidak ada subtest yang aktif" });
	if (result.status === "expired") throw errors.BAD_REQUEST({ message: "Batas waktu subtest telah habis" });
	return result.attemptId;
}

export const startSubtest = authed.tryout.startSubtest.handler(async ({ input, context, errors }) => {
	const result = await startSubtestService.start(input.tryoutId, input.subtestId, context.session.user.id);
	if (result.status === "no_attempt") throw errors.BAD_REQUEST({ message: "Anda belum memulai tryout ini" });
	if (result.status === "no_tryout") throw errors.NOT_FOUND({ message: "Tryout tidak ditemukan" });
	if (result.status === "no_subtest") throw errors.NOT_FOUND({ message: "Subtest tidak ditemukan" });
	if (result.status === "previous_unfinished")
		throw errors.BAD_REQUEST({ message: "Selesaikan subtest sebelumnya terlebih dahulu" });
	if (result.status === "no_deadline") throw errors.BAD_REQUEST({ message: "Pengerjaan tidak memiliki batas waktu" });
	if (result.status === "creation_failed") throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal memulai subtest" });
	return result.attempt;
});

export const saveAnswer = authed.tryout.saveAnswer.handler(async ({ input, context, errors }) => {
	const attemptId = await requireActiveSubtestAttempt(input.tryoutId, context.session.user.id, errors);

	const answerFields = {
		selectedChoiceId: input.answerType === "choice" ? input.selectedChoiceId : null,
		selectedChoiceIds: input.answerType === "complex" ? input.selectedChoiceIds : null,
		essayAnswer: input.answerType === "essay" ? input.essayAnswer : null,
	};

	await db
		.insert(tryoutUserAnswer)
		.values({
			attemptId,
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
	const attemptId = await requireActiveSubtestAttempt(input.tryoutId, context.session.user.id, errors);

	await db
		.insert(tryoutUserAnswer)
		.values({
			attemptId,
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
	try {
		return await submitSubtestService(input, context.session.user.id);
	} catch (error) {
		return toProcedureError(error, errors);
	}
});

export const submitTryout = authed.tryout.submitTryout.handler(async ({ input, context, errors }) => {
	try {
		return await submitTryoutService(input, context.session.user.id);
	} catch (error) {
		return toProcedureError(error, errors);
	}
});
