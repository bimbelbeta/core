import { db } from "@bimbelbeta/db";
import {
	tryout,
	tryoutAttempt,
	tryoutQuestion,
	tryoutQuestionChoice,
	tryoutSubtest,
	tryoutSubtestAttempt,
	tryoutSubtestQuestion,
	tryoutUserAnswer,
} from "@bimbelbeta/db/schema/tryout";
import { ORPCError } from "@orpc/client";
import { type } from "arktype";
import { and, desc, eq } from "drizzle-orm";
import { authed } from "../index";
import type { TryoutQuestion } from "../types/tryout";

const list = authed
	.route({
		path: "/tryouts",
		method: "GET",
		tags: ["Tryouts"],
	})
	.handler(async ({ context }) => {
		const now = new Date();
		const tryouts = await db
			.select({
				id: tryout.id,
				title: tryout.title,
				startsAt: tryout.startsAt,
				endsAt: tryout.endsAt,
				attemptId: tryoutAttempt.id,
				attemptStatus: tryoutAttempt.status,
			})
			.from(tryout)
			.leftJoin(
				tryoutAttempt,
				and(eq(tryoutAttempt.tryoutId, tryout.id), eq(tryoutAttempt.userId, context.session.user.id)),
			)
			.where(
				and(
					// Show if started or starts in future (user can see upcoming)
					// And hasn't ended or ended recently? Usually just show all available.
					// Maybe filter by premium if needed, but UI can handle "locked" state.
				),
			)
			.orderBy(desc(tryout.startsAt));

		return tryouts.map((t) => ({
			...t,
			isOpen: (!t.startsAt || t.startsAt <= now) && (!t.endsAt || t.endsAt >= now),
		}));
	});

const find = authed
	.route({
		path: "/tryouts/{id}",
		method: "GET",
		tags: ["Tryouts"],
	})
	.input(type({ id: "number" }))
	.handler(async ({ input, context }) => {
		const tryoutData = await db.query.tryout.findFirst({
			where: eq(tryout.id, input.id),
			with: {
				subtests: {
					orderBy: (subtests, { asc }) => [asc(subtests.order)],
				},
			},
		});

		if (!tryoutData) throw new ORPCError("NOT_FOUND", { message: "Tryout not found" });

		const attempt = await db.query.tryoutAttempt.findFirst({
			where: and(eq(tryoutAttempt.tryoutId, input.id), eq(tryoutAttempt.userId, context.session.user.id)),
			with: {
				subtestAttempts: true,
			},
		});

		return {
			...tryoutData,
			userAttempt: attempt?.isRevoked ? null : attempt,
		};
	});

const start = authed
	.route({
		path: "/tryouts/{id}/start",
		method: "POST",
		tags: ["Tryouts"],
	})
	.input(type({ id: "number", imageUrl: "string.url?" }))
	.handler(async ({ input, context }) => {
		const tryoutData = await db.query.tryout.findFirst({
			where: eq(tryout.id, input.id),
		});

		if (!tryoutData) throw new ORPCError("NOT_FOUND", { message: "Tryout not found" });

		if (!context.session.user.isPremium && !input.imageUrl) {
			throw new ORPCError("FORBIDDEN", {
				message: "Upload bukti pembayaran untuk memulai tryout",
			});
		}

		const now = new Date();
		if (tryoutData.startsAt && tryoutData.startsAt > now) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Tryout belum dimulai",
			});
		}
		if (tryoutData.endsAt && tryoutData.endsAt < now) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Tryout sudah selesai",
			});
		}

		const [attempt] = await db
			.insert(tryoutAttempt)
			.values({
				tryoutId: input.id,
				userId: context.session.user.id,
				submittedImageUrl: input.imageUrl,
			})
			.onConflictDoNothing()
			.returning();

		if (!attempt) {
			// Already exists, fetch it
			const existing = await db.query.tryoutAttempt.findFirst({
				where: and(eq(tryoutAttempt.tryoutId, input.id), eq(tryoutAttempt.userId, context.session.user.id)),
			});
			if (!existing) throw new ORPCError("NOT_FOUND", { message: "Attempt not found" });
			return existing;
		}

		return attempt;
	});

const startSubtest = authed
	.route({
		path: "/tryouts/{tryoutId}/subtests/{subtestId}/start",
		method: "POST",
		tags: ["Tryouts"],
	})
	.input(type({ tryoutId: "number", subtestId: "number" }))
	.handler(async ({ input, context }) => {
		const attempt = await db.query.tryoutAttempt.findFirst({
			where: and(eq(tryoutAttempt.tryoutId, input.tryoutId), eq(tryoutAttempt.userId, context.session.user.id)),
		});

		if (!attempt)
			throw new ORPCError("BAD_REQUEST", {
				message: "Anda belum memulai tryout ini",
			});

		// Check sequence? usually previous subtest must be finished.
		// For simplicity, let's allow starting if previous are finished or not started (but usually strict order).
		// Let's enforce strict order if "continuous".
		// Assuming subtest.order defines the sequence.

		const subtests = await db.query.tryoutSubtest.findMany({
			where: eq(tryoutSubtest.tryoutId, input.tryoutId),
			orderBy: (t, { asc }) => [asc(t.order)],
		});

		const currentSubtestIndex = subtests.findIndex((s) => s.id === input.subtestId);
		if (currentSubtestIndex === -1) throw new ORPCError("NOT_FOUND", { message: "Subtest not found" });

		if (currentSubtestIndex > 0) {
			const prevSubtest = subtests[currentSubtestIndex - 1];
			if (!prevSubtest) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Gagal menemukan subtest sebelumnya",
				});
			}
			const prevAttempt = await db.query.tryoutSubtestAttempt.findFirst({
				where: and(
					eq(tryoutSubtestAttempt.tryoutAttemptId, attempt.id),
					eq(tryoutSubtestAttempt.subtestId, prevSubtest.id),
				),
			});
			if (!prevAttempt || prevAttempt.status !== "finished") {
				throw new ORPCError("BAD_REQUEST", {
					message: "Selesaikan subtest sebelumnya terlebih dahulu",
				});
			}
		}

		const [subAttempt] = await db
			.insert(tryoutSubtestAttempt)
			.values({
				tryoutAttemptId: attempt.id,
				subtestId: input.subtestId,
			})
			.onConflictDoNothing()
			.returning();

		if (!subAttempt) {
			const existing = await db.query.tryoutSubtestAttempt.findFirst({
				where: and(
					eq(tryoutSubtestAttempt.tryoutAttemptId, attempt.id),
					eq(tryoutSubtestAttempt.subtestId, input.subtestId),
				),
			});
			if (!existing) throw new ORPCError("NOT_FOUND", { message: "Subtest attempt not found" });
			return existing;
		}

		return subAttempt;
	});

const getSubtestQuestions = authed
	.route({
		path: "/tryouts/{tryoutId}/subtests/{subtestId}",
		method: "GET",
		tags: ["Tryouts"],
	})
	.input(type({ tryoutId: "number", subtestId: "number" }))
	.handler(async ({ input, context }) => {
		const attempt = await db.query.tryoutAttempt.findFirst({
			where: and(eq(tryoutAttempt.tryoutId, input.tryoutId), eq(tryoutAttempt.userId, context.session.user.id)),
		});

		if (!attempt) throw new ORPCError("FORBIDDEN", { message: "Access denied" });

		// Fetch questions and choices
		const rows = await db
			.select({
				questionId: tryoutQuestion.id,
				questionContent: tryoutQuestion.content,
				questionContentJson: tryoutQuestion.contentJson,
				questionType: tryoutQuestion.type,
				choiceId: tryoutQuestionChoice.id,
				choiceContent: tryoutQuestionChoice.content,
				choiceCode: tryoutQuestionChoice.code,
				choiceContentJson: tryoutQuestionChoice.contentJson,
				userSelectedChoiceId: tryoutUserAnswer.selectedChoiceId,
				userEssayAnswer: tryoutUserAnswer.essayAnswer,
				userEssayAnswerJson: tryoutUserAnswer.essayAnswerJson,
			})
			.from(tryoutSubtestQuestion)
			.innerJoin(tryoutQuestion, eq(tryoutQuestion.id, tryoutSubtestQuestion.questionId))
			.leftJoin(tryoutQuestionChoice, eq(tryoutQuestionChoice.questionId, tryoutQuestion.id))
			.leftJoin(
				tryoutUserAnswer,
				and(eq(tryoutUserAnswer.questionId, tryoutQuestion.id), eq(tryoutUserAnswer.attemptId, attempt.id)),
			)
			.where(eq(tryoutSubtestQuestion.subtestId, input.subtestId))
			.orderBy(tryoutSubtestQuestion.order);

		// Group by question
		const questionsMap = new Map<number, TryoutQuestion>();
		for (const row of rows) {
			if (!questionsMap.has(row.questionId)) {
				questionsMap.set(row.questionId, {
					id: row.questionId,
					content: row.questionContent,
					contentJson: row.questionContentJson,
					type: row.questionType,
					choices: [],
					userAnswer: {
						selectedChoiceId: row.userSelectedChoiceId,
						essayAnswer: row.userEssayAnswer,
						essayAnswerJson: row.userEssayAnswerJson,
					},
				});
			}
			if (row.choiceId) {
				const question = questionsMap.get(row.questionId);
				if (question) {
					question.choices.push({
						id: row.choiceId,
						content: row.choiceContent!,
						code: row.choiceCode!,
						contentJson: row.choiceContentJson,
					});
				}
			}
		}

		return Array.from(questionsMap.values());
	});

const saveAnswer = authed
	.route({
		path: "/tryouts/{tryoutId}/questions/{questionId}/answer",
		method: "POST",
		tags: ["Tryouts"],
	})
	.input(
		type({
			tryoutId: "number",
			questionId: "number",
			selectedChoiceId: "number?",
			essayAnswer: "string?",
			essayAnswerJson: "unknown?", // using unknown for jsonb
		}),
	)
	.handler(async ({ input, context }) => {
		const attempt = await db.query.tryoutAttempt.findFirst({
			where: and(
				eq(tryoutAttempt.tryoutId, input.tryoutId),
				eq(tryoutAttempt.userId, context.session.user.id),
				eq(tryoutAttempt.status, "ongoing"),
			),
		});

		if (!attempt)
			throw new ORPCError("BAD_REQUEST", {
				message: "No active attempt found",
			});

		await db
			.insert(tryoutUserAnswer)
			.values({
				attemptId: attempt.id,
				questionId: input.questionId,
				selectedChoiceId: input.selectedChoiceId,
				essayAnswer: input.essayAnswer,
				essayAnswerJson: input.essayAnswerJson as unknown,
			})
			.onConflictDoUpdate({
				target: [tryoutUserAnswer.attemptId, tryoutUserAnswer.questionId],
				set: {
					selectedChoiceId: input.selectedChoiceId,
					essayAnswer: input.essayAnswer,
					essayAnswerJson: input.essayAnswerJson as unknown,
				},
			});

		return { success: true };
	});

const submitSubtest = authed
	.route({
		path: "/tryouts/{tryoutId}/subtests/{subtestId}/submit",
		method: "POST",
		tags: ["Tryouts"],
	})
	.input(type({ tryoutId: "number", subtestId: "number" }))
	.handler(async ({ input, context }) => {
		const attempt = await db.query.tryoutAttempt.findFirst({
			where: and(eq(tryoutAttempt.tryoutId, input.tryoutId), eq(tryoutAttempt.userId, context.session.user.id)),
		});

		if (!attempt) throw new ORPCError("BAD_REQUEST", { message: "Attempt not found" });

		await db
			.update(tryoutSubtestAttempt)
			.set({
				status: "finished",
				completedAt: new Date(),
			})
			.where(
				and(eq(tryoutSubtestAttempt.tryoutAttemptId, attempt.id), eq(tryoutSubtestAttempt.subtestId, input.subtestId)),
			);

		return { success: true };
	});

const submitTryout = authed
	.route({
		path: "/tryouts/{tryoutId}/submit",
		method: "POST",
		tags: ["Tryouts"],
	})
	.input(type({ tryoutId: "number" }))
	.handler(async ({ input, context }) => {
		const attempt = await db.query.tryoutAttempt.findFirst({
			where: and(
				eq(tryoutAttempt.tryoutId, input.tryoutId),
				eq(tryoutAttempt.userId, context.session.user.id),
				eq(tryoutAttempt.status, "ongoing"),
			),
		});

		if (!attempt) throw new ORPCError("BAD_REQUEST", { message: "Attempt not found" });

		// Check if all subtests are finished?
		// Or force finish.

		await db
			.update(tryoutAttempt)
			.set({
				status: "finished",
				completedAt: new Date(),
			})
			.where(eq(tryoutAttempt.id, attempt.id));

		return { success: true };
	});

export const tryoutRouter = {
	list,
	find,
	start,
	startSubtest,
	getSubtestQuestions,
	saveAnswer,
	submitSubtest,
	submitTryout,
};
