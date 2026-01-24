import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { creditTransaction } from "@bimbelbeta/db/schema/credit";
import { question, questionChoice } from "@bimbelbeta/db/schema/question";
import {
	tryout,
	tryoutAttempt,
	tryoutSubtest,
	tryoutSubtestAttempt,
	tryoutSubtestQuestion,
	tryoutUserAnswer,
} from "@bimbelbeta/db/schema/tryout";
import { ORPCError } from "@orpc/client";
import { type } from "arktype";
import { and, desc, eq, sql } from "drizzle-orm";
import { authed } from "../index";
import { calculateTryoutScores, saveScoresToDatabase } from "../lib/calculate-score";
import { convertToTiptap } from "../lib/convert-to-tiptap";
import type { ReviewQuestion, TryoutQuestion } from "../types/question";

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
				passingGrade: tryout.passingGrade,
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
			.where(eq(tryout.status, "published"))
			.orderBy(desc(tryout.startsAt));

		return tryouts.map((t) => ({
			...t,
			isOpen: (!t.startsAt || t.startsAt <= now) && (!t.endsAt || t.endsAt >= now),
		}));
	});

const featured = authed
	.route({
		path: "/tryouts/featured",
		method: "GET",
		tags: ["Tryouts"],
	})
	.handler(async ({ errors, context }) => {
		let status: "finished" | "not_started" | "ongoing" = "not_started";
		const [data] = await db
			.select({
				id: tryout.id,
				title: tryout.title,
				passingGrade: tryout.passingGrade,
				startsAt: tryout.startsAt,
				endsAt: tryout.endsAt,
				startedAt: tryoutAttempt.startedAt,
				completedAt: tryoutAttempt.completedAt,
				attemptId: tryoutAttempt.id,
				attemptStatus: tryoutAttempt.status,
			})
			.from(tryout)
			.leftJoin(
				tryoutAttempt,
				and(eq(tryoutAttempt.tryoutId, tryout.id), eq(tryoutAttempt.userId, context.session.user.id)),
			)
			.where(eq(tryout.status, "published"))
			.orderBy(desc(tryout.startsAt));

		if (!data)
			throw errors.NOT_FOUND({
				message: "Gagal menemukan paket Tryout!",
			});

		if (data.startedAt) status = "ongoing";
		if (data.completedAt) status = "finished";

		return {
			...data,
			status,
		};
	});

const find = authed
	.route({
		path: "/tryouts/{id}",
		method: "GET",
		tags: ["Tryouts"],
	})
	.input(type({ id: "number" }))
	.handler(async ({ input, context, errors }) => {
		const tryoutData = await db.query.tryout.findFirst({
			where: and(eq(tryout.id, input.id), eq(tryout.status, "published")),
			with: {
				subtests: {
					orderBy: (subtests, { asc }) => [asc(subtests.order)],
				},
			},
		});

		if (!tryoutData) throw new ORPCError("NOT_FOUND", { message: "Tryout tidak ditemukan." });

		const attempt = await db.query.tryoutAttempt.findFirst({
			where: and(eq(tryoutAttempt.tryoutId, input.id), eq(tryoutAttempt.userId, context.session.user.id)),
			with: {
				subtestAttempts: true,
			},
		});

		if (!attempt || attempt.isRevoked)
			throw errors.UNAUTHORIZED({
				message: "Gagal menemukan pengerjaan tryout.",
			});

		if (attempt.status === "finished") {
			return {
				...tryoutData,
				attempt,
				currentSubtest: null,
				overallDeadline: attempt.deadline,
				totalSubtests: tryoutData.subtests.length,
				completedSubtests: tryoutData.subtests.length,
			};
		}

		const completedSubtestIds = new Set(
			attempt.subtestAttempts.filter((sa) => sa.status === "finished").map((sa) => sa.subtestId),
		);

		const currentSubtest = tryoutData.subtests.find((s) => !completedSubtestIds.has(s.id));

		if (Date.now() > attempt.deadline.getTime() && !attempt.completedAt && attempt.status === "ongoing")
			await db
				.update(tryoutAttempt)
				.set({
					completedAt: new Date(),
					status: "finished",
				})
				.where(eq(tryoutAttempt.id, attempt.id));

		if (!currentSubtest) {
			return {
				...tryoutData,
				attempt,
				currentSubtest: null,
				overallDeadline: attempt.deadline,
				totalSubtests: tryoutData.subtests.length,
				completedSubtests: completedSubtestIds.size,
			};
		}

		const currentSubtestAttempt = attempt.subtestAttempts.find((sa) => sa.subtestId === currentSubtest.id);

		if (!currentSubtestAttempt) {
			return {
				...tryoutData,
				attempt,
				currentSubtest: {
					...currentSubtest,
					questions: [],
					deadline: null,
					status: "ongoing",
				},
				overallDeadline: attempt.deadline,
				totalSubtests: tryoutData.subtests.length,
				completedSubtests: completedSubtestIds.size,
			};
		}

		const rows = await db
			.select({
				questionId: question.id,
				questionContent: question.content,
				questionContentJson: question.contentJson,
				questionType: question.type,
				choiceId: questionChoice.id,
				choiceContent: questionChoice.content,
				choiceCode: questionChoice.code,
				userSelectedChoiceId: tryoutUserAnswer.selectedChoiceId,
				userEssayAnswer: tryoutUserAnswer.essayAnswer,
				userIsDoubtful: tryoutUserAnswer.isDoubtful,
			})
			.from(tryoutSubtestQuestion)
			.innerJoin(question, eq(question.id, tryoutSubtestQuestion.questionId))
			.leftJoin(questionChoice, eq(questionChoice.questionId, question.id))
			.leftJoin(
				tryoutUserAnswer,
				and(eq(tryoutUserAnswer.questionId, question.id), eq(tryoutUserAnswer.attemptId, attempt.id)),
			)
			.where(eq(tryoutSubtestQuestion.subtestId, currentSubtest.id))
			.orderBy(tryoutSubtestQuestion.order);

		const questionsMap = new Map<number, TryoutQuestion>();
		for (const row of rows) {
			if (!questionsMap.has(row.questionId)) {
				questionsMap.set(row.questionId, {
					id: row.questionId,
					content: row.questionContentJson || convertToTiptap(row.questionContent),
					type: row.questionType,
					choices: [],
					userAnswer: {
						selectedChoiceId: row.userSelectedChoiceId,
						essayAnswer: row.userEssayAnswer,
						isDoubtful: row.userIsDoubtful ?? false,
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
					});
				}
			}
		}

		return {
			...tryoutData,
			attempt,
			currentSubtest: {
				...currentSubtest,
				questions: Array.from(questionsMap.values()),
				deadline: currentSubtestAttempt.deadline,
				status: currentSubtestAttempt.status,
			},
			overallDeadline: attempt.deadline,
			totalSubtests: tryoutData.subtests.length,
			completedSubtests: completedSubtestIds.size,
		};
	});

const start = authed
	.route({
		path: "/tryouts/{id}/start",
		method: "POST",
		tags: ["Tryouts"],
	})
	.input(type({ id: "number", imageUrl: "string.url?", useCredit: "boolean?" }))
	.handler(async ({ input, context }) => {
		const tryoutData = await db.query.tryout.findFirst({
			where: and(eq(tryout.id, input.id), eq(tryout.status, "published")),
			with: {
				subtests: {
					orderBy: (subtests, { asc }) => [asc(subtests.order)],
				},
			},
		});

		if (!tryoutData) throw new ORPCError("NOT_FOUND", { message: "Tryout not found" });

		// Access control: Premium users OR users with image OR users with credits
		const isPremiumUser = context.session.user.isPremium;
		const hasImageProof = !!input.imageUrl;
		const wantsToUseCredit = !!input.useCredit;
		const userCredits = context.session.user.tryoutCredits ?? 0;

		if (!isPremiumUser && !hasImageProof && !wantsToUseCredit) {
			throw new ORPCError("FORBIDDEN", {
				message: "Upload bukti pembayaran atau gunakan kredit tryout",
			});
		}

		if (wantsToUseCredit && userCredits <= 0) {
			throw new ORPCError("FORBIDDEN", {
				message: "Kredit tryout tidak cukup",
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

		const existingAttempt = await db.query.tryoutAttempt.findFirst({
			where: and(eq(tryoutAttempt.tryoutId, input.id), eq(tryoutAttempt.userId, context.session.user.id)),
		});

		if (existingAttempt) {
			if (existingAttempt.isRevoked) {
				throw new ORPCError("FORBIDDEN", { message: "Attempt telah dibatalkan" });
			}
			return existingAttempt;
		}

		if (tryoutData.subtests.length === 0) {
			throw new ORPCError("BAD_REQUEST", { message: "Tryout tidak memiliki subtest" });
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
			// Deduct credit if using credit
			if (wantsToUseCredit && !isPremiumUser) {
				const [updatedUser] = await trx
					.update(user)
					.set({
						tryoutCredits: sql`${user.tryoutCredits} - 1`,
					})
					.where(eq(user.id, context.session.user.id))
					.returning({ tryoutCredits: user.tryoutCredits });

				// Create attempt first to get the ID
				const [newAttempt] = await trx
					.insert(tryoutAttempt)
					.values({
						tryoutId: input.id,
						userId: context.session.user.id,
						submittedImageUrl: null,
						deadline: overallDeadline,
					})
					.returning();

				if (!newAttempt) throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create attempt" });

				// Record credit consumption
				await trx.insert(creditTransaction).values({
					userId: context.session.user.id,
					tryoutAttemptId: newAttempt.id,
					amount: -1,
					balanceAfter: updatedUser?.tryoutCredits ?? 0,
					note: `Used for tryout: ${tryoutData.title}`,
				});

				return newAttempt;
			}

			// Regular flow (premium user or image proof)
			const [newAttempt] = await trx
				.insert(tryoutAttempt)
				.values({
					tryoutId: input.id,
					userId: context.session.user.id,
					submittedImageUrl: input.imageUrl,
					deadline: overallDeadline,
				})
				.returning();

			if (!newAttempt) throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create attempt" });

			return newAttempt;
		});

		const firstSubtest = tryoutData.subtests[0]!;
		await db.insert(tryoutSubtestAttempt).values({
			tryoutAttemptId: attempt.id,
			subtestId: firstSubtest.id,
			deadline: deadlineMap.get(firstSubtest.id)!,
		});

		return { ...attempt, overallDeadline };
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
			with: {
				subtestAttempts: true,
			},
		});

		if (!attempt) throw new ORPCError("BAD_REQUEST", { message: "Anda belum memulai tryout ini" });

		const existingSubtestAttempt = attempt.subtestAttempts.find((sa) => sa.subtestId === input.subtestId);
		if (existingSubtestAttempt) {
			return existingSubtestAttempt;
		}

		const tryoutData = await db.query.tryout.findFirst({
			where: eq(tryout.id, input.tryoutId),
			with: {
				subtests: {
					orderBy: (subtests, { asc }) => [asc(subtests.order)],
				},
			},
		});

		if (!tryoutData) throw new ORPCError("NOT_FOUND", { message: "Tryout not found" });

		const currentIndex = tryoutData.subtests.findIndex((s) => s.id === input.subtestId);
		if (currentIndex === -1) throw new ORPCError("NOT_FOUND", { message: "Subtest not found" });

		const currentSubtest = tryoutData.subtests[currentIndex]!;

		if (currentIndex > 0) {
			const prevSubtest = tryoutData.subtests[currentIndex - 1]!;
			const prevAttempt = attempt.subtestAttempts.find((sa) => sa.subtestId === prevSubtest.id);
			if (!prevAttempt || prevAttempt.status !== "finished") {
				throw new ORPCError("BAD_REQUEST", {
					message: "Selesaikan subtest sebelumnya terlebih dahulu",
				});
			}
		}

		const prevSubtestAttempt =
			currentIndex > 0
				? attempt.subtestAttempts.find((sa) => sa.subtestId === tryoutData.subtests[currentIndex - 1]!.id)
				: null;

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

		return subAttempt;
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
		}),
	)
	.handler(async ({ input, context }) => {
		const attempt = await db.query.tryoutAttempt.findFirst({
			where: and(
				eq(tryoutAttempt.tryoutId, input.tryoutId),
				eq(tryoutAttempt.userId, context.session.user.id),
				eq(tryoutAttempt.status, "ongoing"),
			),
			with: {
				subtestAttempts: true,
			},
		});

		if (!attempt)
			throw new ORPCError("BAD_REQUEST", {
				message: "No active attempt found",
			});

		const currentSubtestAttempt = attempt.subtestAttempts.find((sa) => sa.status === "ongoing");
		if (!currentSubtestAttempt)
			throw new ORPCError("BAD_REQUEST", {
				message: "No active subtest found",
			});

		if (currentSubtestAttempt.deadline && currentSubtestAttempt.deadline < new Date()) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Subtest deadline has passed",
			});
		}

		await db
			.insert(tryoutUserAnswer)
			.values({
				attemptId: attempt.id,
				questionId: input.questionId,
				selectedChoiceId: input.selectedChoiceId,
				essayAnswer: input.essayAnswer,
			})
			.onConflictDoUpdate({
				target: [tryoutUserAnswer.attemptId, tryoutUserAnswer.questionId],
				set: {
					selectedChoiceId: input.selectedChoiceId,
					essayAnswer: input.essayAnswer,
				},
			});

		return { success: true };
	});

const toggleRaguRagu = authed
	.route({
		path: "/tryouts/{tryoutId}/questions/{questionId}/ragu-ragu",
		method: "POST",
		tags: ["Tryouts"],
	})
	.input(type({ tryoutId: "number", questionId: "number" }))
	.handler(async ({ input, context }) => {
		const attempt = await db.query.tryoutAttempt.findFirst({
			where: and(
				eq(tryoutAttempt.tryoutId, input.tryoutId),
				eq(tryoutAttempt.userId, context.session.user.id),
				eq(tryoutAttempt.status, "ongoing"),
			),
			with: {
				subtestAttempts: true,
			},
		});

		if (!attempt)
			throw new ORPCError("BAD_REQUEST", {
				message: "No active attempt found",
			});

		const currentSubtestAttempt = attempt.subtestAttempts.find((sa) => sa.status === "ongoing");
		if (!currentSubtestAttempt)
			throw new ORPCError("BAD_REQUEST", {
				message: "No active subtest found",
			});

		if (currentSubtestAttempt.deadline && currentSubtestAttempt.deadline < new Date()) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Subtest deadline has passed",
			});
		}

		const existingAnswer = await db.query.tryoutUserAnswer.findFirst({
			where: and(eq(tryoutUserAnswer.attemptId, attempt.id), eq(tryoutUserAnswer.questionId, input.questionId)),
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

const submitSubtest = authed
	.route({
		path: "/tryouts/{tryoutId}/subtests/{subtestId}/submit",
		method: "POST",
		tags: ["Tryouts"],
	})
	.input(type({ tryoutId: "number", subtestId: "number" }))
	.handler(async ({ input, context }) => {
		const attempt = await db.query.tryoutAttempt.findFirst({
			where: and(
				eq(tryoutAttempt.tryoutId, input.tryoutId),
				eq(tryoutAttempt.userId, context.session.user.id),
				eq(tryoutAttempt.status, "ongoing"),
			),
			with: {
				subtestAttempts: true,
			},
		});

		if (!attempt) throw new ORPCError("BAD_REQUEST", { message: "Attempt not found" });

		const currentSubtestAttempt = attempt.subtestAttempts.find(
			(sa) => sa.subtestId === input.subtestId && sa.status === "ongoing",
		);

		if (!currentSubtestAttempt) throw new ORPCError("BAD_REQUEST", { message: "Subtest not active" });

		const tryoutData = await db.query.tryout.findFirst({
			where: eq(tryout.id, input.tryoutId),
			with: {
				subtests: {
					orderBy: (subtests, { asc }) => [asc(subtests.order)],
				},
			},
		});

		if (!tryoutData) throw new ORPCError("NOT_FOUND", { message: "Tryout not found" });

		const currentIndex = tryoutData.subtests.findIndex((s) => s.id === input.subtestId);
		if (currentIndex === -1) throw new ORPCError("NOT_FOUND", { message: "Subtest not found" });

		const now = new Date();
		if (attempt.deadline && attempt.deadline < now) {
			throw new ORPCError("BAD_REQUEST", {
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

		// This is the last subtest - calculate scores and finish tryout
		const scores = await calculateTryoutScores(attempt.id);

		await db
			.update(tryoutAttempt)
			.set({ status: "finished", completedAt: new Date() })
			.where(eq(tryoutAttempt.id, attempt.id));

		// Save scores to database
		await saveScoresToDatabase(attempt.id, scores);

		return { success: true, tryoutCompleted: true, score: scores.totalScore };
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

		// Calculate scores before marking as finished
		const scores = await calculateTryoutScores(attempt.id);

		await db
			.update(tryoutAttempt)
			.set({
				status: "finished",
				completedAt: new Date(),
			})
			.where(eq(tryoutAttempt.id, attempt.id));

		// Save scores to database
		await saveScoresToDatabase(attempt.id, scores);

		return { success: true, score: scores.totalScore };
	});

const history = authed
	.route({
		path: "/tryouts/history",
		method: "GET",
		tags: ["Tryouts"],
	})
	.handler(async ({ context }) => {
		const attempts = await db.query.tryoutAttempt.findMany({
			where: eq(tryoutAttempt.userId, context.session.user.id),
			columns: {
				id: true,
				score: true,
				status: true,
				startedAt: true,
				completedAt: true,
			},
			orderBy: desc(tryoutAttempt.startedAt),
			with: {
				tryout: {
					columns: {
						id: true,
						title: true,
					},
				},
			},
		});

		return attempts;
	});

const attemptResult = authed
	.route({
		path: "/tryouts/attempts/{attemptId}",
		method: "GET",
		tags: ["Tryouts"],
	})
	.input(type({ attemptId: "number" }))
	.handler(async ({ input, context, errors }) => {
		const attempt = await db.query.tryoutAttempt.findFirst({
			where: and(eq(tryoutAttempt.id, input.attemptId), eq(tryoutAttempt.userId, context.session.user.id)),
			columns: {
				startedAt: true,
				score: true,
				deadline: true,
				completedAt: true,
				status: true,
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
			throw errors.NOT_FOUND({ message: "Attempt not found" });
		}
		return attempt;
	});

const review = authed
	.route({
		path: "/tryouts/attempts/{attemptId}/subtests/{subtestId}/review",
		method: "GET",
		tags: ["Tryouts"],
	})
	.input(type({ attemptId: "number", subtestId: "number" }))
	.output(
		type({
			subtest: {
				name: "string",
			},
			questions: type(
				{
					id: "number",
					content: "unknown",
					type: "'multiple_choice' | 'essay'",
					discussion: "unknown",
					choices: type(
						{
							id: "number",
							content: "string",
							code: "string",
							isCorrect: "boolean",
						},
						"[]",
					),
					userAnswer: {
						selectedChoiceId: "number | null",
						essayAnswer: "string | null",
						isDoubtful: "boolean",
					},
				},
				"[]",
			),
		}),
	)
	.handler(async ({ input, context, errors }) => {
		const attempt = await db.query.tryoutAttempt.findFirst({
			where: and(eq(tryoutAttempt.id, input.attemptId), eq(tryoutAttempt.userId, context.session.user.id)),
			with: {
				subtestAttempts: true,
			},
		});

		if (!attempt) throw errors.NOT_FOUND({ message: "Attempt not found" });

		const subtestAttempt = attempt.subtestAttempts.find((sa) => sa.subtestId === input.subtestId);

		if (!subtestAttempt || subtestAttempt.status !== "finished") {
			throw errors.BAD_REQUEST({ message: "Subtest belum selesai atau tidak ditemukan." });
		}

		// Fetch questions with full details including discussion and correct answer
		const rows = await db
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
				userEssayAnswer: tryoutUserAnswer.essayAnswer,
				userIsDoubtful: tryoutUserAnswer.isDoubtful,
			})
			.from(tryoutSubtestQuestion)
			.innerJoin(question, eq(question.id, tryoutSubtestQuestion.questionId))
			.leftJoin(questionChoice, eq(questionChoice.questionId, question.id))
			.leftJoin(
				tryoutUserAnswer,
				and(eq(tryoutUserAnswer.questionId, question.id), eq(tryoutUserAnswer.attemptId, attempt.id)),
			)
			.where(eq(tryoutSubtestQuestion.subtestId, input.subtestId))
			.orderBy(tryoutSubtestQuestion.order);

		const questionsMap = new Map<number, ReviewQuestion>();
		for (const row of rows) {
			if (!questionsMap.has(row.questionId)) {
				questionsMap.set(row.questionId, {
					id: row.questionId,
					content: row.questionContentJson || convertToTiptap(row.questionContent),
					type: row.questionType,
					discussion: row.discussionJson || convertToTiptap(row.discussion),
					choices: [],
					userAnswer: {
						selectedChoiceId: row.userSelectedChoiceId,
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
						isCorrect: row.isCorrectChoice || false,
					});
				}
			}
		}

		// Verify we also need to return the subtest name for the header
		const subtestData = await db.query.tryoutSubtest.findFirst({
			where: eq(tryoutSubtest.id, input.subtestId),
			columns: {
				name: true,
			},
		});

		if (!subtestData) {
			throw errors.NOT_FOUND({ message: "Subtest not found" });
		}

		return {
			subtest: subtestData,
			questions: Array.from(questionsMap.values()),
		};
	});

export const tryoutRouter = {
	list,
	find,
	start,
	featured,
	startSubtest,
	saveAnswer,
	toggleRaguRagu,
	submitSubtest,
	submitTryout,
	history,
	attemptResult,
	review,
};
