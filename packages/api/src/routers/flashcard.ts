import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { userFlashcardAttempt, userFlashcardQuestionAnswer } from "@bimbelbeta/db/schema/flashcard";
import { questionAnswerOption } from "@bimbelbeta/db/schema/practice-pack";
import { type } from "arktype";
import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { authed, premium } from "..";
import { convertToTiptap } from "./subtest";

const FLASHCARD_SESSION_DURATION_MINUTES = 10;
// Grace period to allow submitting after deadline
const GRACE_PERIOD_SECONDS = 5;

const start = authed
	.route({
		path: "/flashcard/start",
		method: "POST",
		tags: ["Flashcard"],
	})
	.handler(async ({ context, errors }) => {
		const deadline = new Date(Date.now() + FLASHCARD_SESSION_DURATION_MINUTES * 60_000);
		const today = new Date();
		const isPremium = context.session.user.isPremium;
		today.setHours(0, 0, 0, 0);

		return await db.transaction(async (tx) => {
			const [latestAttempt] = await tx
				.select()
				.from(userFlashcardAttempt)
				.where(eq(userFlashcardAttempt.userId, context.session.user.id))
				.orderBy(desc(userFlashcardAttempt.startedAt))
				.limit(1);

			if (latestAttempt && !isPremium && latestAttempt.startedAt.getTime() >= today.getTime())
				throw errors.UNPROCESSABLE_CONTENT({
					message: "Kamu sudah memulai sesi flashcard hari ini.",
				});

			if (
				latestAttempt &&
				isPremium &&
				!latestAttempt.submittedAt &&
				latestAttempt.startedAt.getTime() >= today.getTime()
			)
				throw errors.UNPROCESSABLE_CONTENT({
					message: "Mohon selesaikan sesi flashcard yang ada terlebih dahulu.",
				});

			const [attempt] = await tx
				.insert(userFlashcardAttempt)
				.values({
					userId: context.session.user.id,
					startedAt: new Date(),
					deadline: deadline,
				})
				.returning();

			const availableQuestions = await tx.query.question.findMany({
				with: {
					answerOptions: true,
				},
				orderBy: sql`RANDOM()`,
				limit: 5,
			});

			if (availableQuestions.length < 5)
				throw errors.NOT_FOUND({
					message: "Kamu sudah mengerjakan semua flashcard yang tersedia untuk sekarang. Silahkan coba lagi nanti.",
				});

			await tx.insert(userFlashcardQuestionAnswer).values(
				availableQuestions.map((q) => ({
					attemptId: attempt?.id,
					assignedDate: today,
					questionId: q.id,
				})),
			);

			return "Sukses memulai sesi flashcard!";
		});
	});

const get = authed
	.route({
		path: "/flashcard",
		method: "GET",
		tags: ["Flashcard"],
	})
	.handler(async ({ context }) => {
		let status: "not_started" | "ongoing" | "submitted" = "not_started";

		const [attempt] = await db
			.select()
			.from(userFlashcardAttempt)
			.where(eq(userFlashcardAttempt.userId, context.session.user.id))
			.orderBy(desc(userFlashcardAttempt.startedAt))
			.limit(1);

		if (!attempt) return { status };

		const assignedQuestions = await db.query.userFlashcardQuestionAnswer.findMany({
			where: and(
				eq(userFlashcardQuestionAnswer.attemptId, attempt.id),
				isNull(userFlashcardQuestionAnswer.selectedAnswerId),
			),
			with: {
				question: {
					columns: {
						id: true,
						content: true,
					},
					with: {
						answerOptions: {
							columns: {
								id: true,
								content: true,
								code: true,
							},
							orderBy: (answers, { asc }) => [asc(answers.code)],
						},
					},
				},
			},
		});

		status = attempt.submittedAt ? "submitted" : "ongoing";

		return {
			...attempt,
			assignedQuestions,
			status,
		};
	});

const submit = authed
	.route({
		path: "/flashcard/submit",
		method: "POST",
		tags: ["Flashcard"],
	})
	.handler(async ({ context, errors }) => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const hasDoneToday =
			context.session.user.lastCompletedFlashcardAt &&
			context.session.user.lastCompletedFlashcardAt.getTime() >= today.getTime();

		const [latestAttempt] = await db
			.select()
			.from(userFlashcardAttempt)
			.where(and(eq(userFlashcardAttempt.userId, context.session.user.id), gte(userFlashcardAttempt.startedAt, today)))
			.orderBy(desc(userFlashcardAttempt.startedAt))
			.limit(1);

		if (!latestAttempt) {
			throw errors.NOT_FOUND({
				message: "Kamu belum memulai sesi flashcard hari ini.",
			});
		}

		if (latestAttempt.submittedAt) {
			throw errors.UNPROCESSABLE_CONTENT({
				message: "Kamu sudah mengerjakan flashcard terbaru yang tersedia.",
			});
		}

		// Grace period for submitting
		if (Date.now() > latestAttempt.deadline.getTime() + GRACE_PERIOD_SECONDS * 1000) {
			throw errors.UNPROCESSABLE_CONTENT({
				message: "Waktu sesi flashcard telah berakhir.",
			});
		}

		await db.transaction(async (tx) => {
			await tx
				.update(userFlashcardAttempt)
				.set({ submittedAt: new Date() })
				.where(eq(userFlashcardAttempt.id, latestAttempt.id));
			if (!hasDoneToday)
				await tx
					.update(user)
					.set({ flashcardStreak: sql`${user.flashcardStreak} + 1`, lastCompletedFlashcardAt: new Date() })
					.where(eq(user.id, context.session.user.id));
		});

		return { message: "Berhasil mengerjakan flashcard hari ini!" };
	});

const save = authed
	.route({
		path: "/flashcard",
		method: "POST",
		tags: ["Flashcard"],
	})
	.input(
		type({
			questionId: "number",
			answerId: "number",
		}),
	)
	.output(
		type({
			isCorrect: "boolean",
			correctAnswerId: "number",
			userAnswerId: "number",
		}),
	)
	.handler(async ({ input, context, errors }) => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		return await db.transaction(async (tx) => {
			const [attempt] = await tx
				.select({
					id: userFlashcardAttempt.id,
					deadline: userFlashcardAttempt.deadline,
				})
				.from(userFlashcardQuestionAnswer)
				.innerJoin(userFlashcardAttempt, eq(userFlashcardQuestionAnswer.attemptId, userFlashcardAttempt.id))
				.where(
					and(
						eq(userFlashcardQuestionAnswer.questionId, input.questionId),
						eq(userFlashcardQuestionAnswer.assignedDate, today),
						eq(userFlashcardAttempt.userId, context.session.user.id),
					),
				)
				.orderBy(desc(userFlashcardAttempt.startedAt))
				.limit(1);

			if (!attempt) throw errors.NOT_FOUND();

			if (Date.now() > attempt.deadline.getTime() + GRACE_PERIOD_SECONDS * 1000) {
				throw errors.UNPROCESSABLE_CONTENT({
					message: "Waktu sesi flashcard telah berakhir.",
				});
			}

			const answers = await tx
				.select({
					id: questionAnswerOption.id,
					isCorrect: questionAnswerOption.isCorrect,
				})
				.from(questionAnswerOption)
				.where(eq(questionAnswerOption.questionId, input.questionId));

			if (!answers || answers.length === 0) {
				throw errors.NOT_FOUND();
			}
			const correctAnswer = answers.find((answer) => answer.isCorrect);
			const userAnswer = answers.find((answer) => answer.id === input.answerId);
			if (!correctAnswer || !userAnswer) throw errors.NOT_FOUND();

			await tx
				.update(userFlashcardQuestionAnswer)
				.set({
					selectedAnswerId: input.answerId,
				})
				.where(
					and(
						eq(userFlashcardQuestionAnswer.questionId, input.questionId),
						eq(userFlashcardQuestionAnswer.assignedDate, today),
						eq(userFlashcardQuestionAnswer.attemptId, attempt.id),
					),
				);

			return {
				isCorrect: userAnswer.isCorrect,
				correctAnswerId: correctAnswer.id,
				userAnswerId: userAnswer.id,
			};
		});
	});

const result = authed
	.route({
		path: "/flashcard/result",
		method: "GET",
		tags: ["Flashcard"],
	})
	.input(
		type({
			"id?": "number",
		}),
	)
	.handler(async ({ context, errors, input }) => {
		const [attempt] = await db
			.select()
			.from(userFlashcardAttempt)
			.where(
				and(
					eq(userFlashcardAttempt.userId, context.session.user.id),
					input.id ? eq(userFlashcardAttempt.id, input.id) : undefined,
				),
			)
			.orderBy(desc(userFlashcardAttempt.startedAt))
			.limit(1);

		if (!attempt)
			throw errors.NOT_FOUND({
				message: "Anda belom mengerjakan flashcard hari ini.",
			});

		const assignedQuestions = await db.query.userFlashcardQuestionAnswer.findMany({
			where: eq(userFlashcardQuestionAnswer.attemptId, attempt.id),
			columns: {
				selectedAnswerId: true,
			},
			with: {
				question: {
					columns: {
						id: true,
						content: true,
						contentJson: true,
						discussion: true,
						discussionJson: true,
					},
					with: {
						answerOptions: {
							columns: {
								id: true,
								content: true,
								contentJson: true,
								code: true,
								isCorrect: true,
							},
							orderBy: (answers, { asc }) => [asc(answers.code)],
						},
					},
				},
			},
		});

		const formattedQuestions = assignedQuestions.map((aq) => ({
			...aq,
			question: {
				...aq.question,
				content: aq.question.contentJson || convertToTiptap(aq.question.content),
				discussion: aq.question.discussionJson || convertToTiptap(aq.question.discussion),
				answerOptions: aq.question.answerOptions.map((ao) => ({
					...ao,
					content: ao.contentJson || convertToTiptap(ao.content),
				})),
			},
		}));

		let correct = 0;
		for (const assignedQuestion of formattedQuestions) {
			const answerMap = new Map<number, boolean>();
			for (const answerOption of assignedQuestion.question.answerOptions) {
				answerMap.set(answerOption.id, answerOption.isCorrect);
			}

			// 0 as fallback ID if user didn't fill in their answer
			if (answerMap.get(assignedQuestion.selectedAnswerId || 0)) correct++;
		}

		return {
			...attempt,
			assignedQuestions: formattedQuestions,
			correctAnswersCount: correct,
			questionsCount: formattedQuestions.length,
		};
	});

const history = premium
	.route({
		path: "/flashcard/history",
		method: "GET",
		tags: ["Flashcard"],
	})
	.handler(async ({ context }) => {
		const attempts = await db
			.select()
			.from(userFlashcardAttempt)
			.where(eq(userFlashcardAttempt.userId, context.session.user.id))
			.orderBy(desc(userFlashcardAttempt.startedAt))
			.limit(50);

		return attempts.map((attempt) => ({
			id: attempt.id,
			startedAt: attempt.startedAt,
			submittedAt: attempt.submittedAt,
		}));
	});

export const flashcardRouter = {
	start,
	get,
	submit,
	save,
	result,
	history,
};
