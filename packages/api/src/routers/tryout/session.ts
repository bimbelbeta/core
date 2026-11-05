import { db } from "@bimbelbeta/db";
import { tryoutUserAnswer } from "@bimbelbeta/db/schema/tryout";
import { sql } from "drizzle-orm";
import { authedImplementer } from "@/lib/router-definition";
import { activeSubtestService } from "@/lib/tryout/active-subtest.service";
import { startSubtestService } from "@/lib/tryout/start-subtest.service";
import { submitService } from "@/lib/tryout/submit.service";
import { toProcedureError } from "@/lib/tryout/tryout-error";

const authed = authedImplementer;

export const startSubtest = authed.tryout.startSubtest.handler(async ({ input, context, errors }) => {
	try {
		return await startSubtestService.start(input.tryoutId, input.subtestId, context.session.user.id);
	} catch (error) {
		return toProcedureError(error, errors);
	}
});

export const saveAnswer = authed.tryout.saveAnswer.handler(async ({ input, context, errors }) => {
	const attemptId = await activeSubtestService
		.require(input.tryoutId, context.session.user.id)
		.catch((error) => toProcedureError(error, errors));

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
	const attemptId = await activeSubtestService
		.require(input.tryoutId, context.session.user.id)
		.catch((error) => toProcedureError(error, errors));

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
		return await submitService.submitSubtest(input, context.session.user.id);
	} catch (error) {
		return toProcedureError(error, errors);
	}
});

export const submitTryout = authed.tryout.submitTryout.handler(async ({ input, context, errors }) => {
	try {
		return await submitService.submitTryout(input, context.session.user.id);
	} catch (error) {
		return toProcedureError(error, errors);
	}
});
