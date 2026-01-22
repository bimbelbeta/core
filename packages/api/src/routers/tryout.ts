import { db } from "@bimbelbeta/db";
import { question, questionChoice } from "@bimbelbeta/db/schema/question";
import {
	tryout,
	tryoutAttempt,
	tryoutSubtestAttempt,
	tryoutSubtestQuestion,
	tryoutUserAnswer,
} from "@bimbelbeta/db/schema/tryout";
import { ORPCError } from "@orpc/client";
import { type } from "arktype";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { authed } from "../index";
import { convertToTiptap } from "../lib/convert-to-tiptap";
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
			where: and(eq(tryout.id, input.id), gte(tryout.startsAt, new Date()), lte(tryout.endsAt, new Date())),
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
	.input(type({ id: "number", imageUrl: "string.url?" }))
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

		const [attempt] = await db
			.insert(tryoutAttempt)
			.values({
				tryoutId: input.id,
				userId: context.session.user.id,
				submittedImageUrl: input.imageUrl,
				deadline: overallDeadline,
			})
			.returning();

		if (!attempt) throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create attempt" });

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
		await db
			.update(tryoutAttempt)
			.set({ status: "finished", completedAt: new Date() })
			.where(eq(tryoutAttempt.id, attempt.id));
		return { success: true, tryoutCompleted: true };
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

		await db
			.update(tryoutAttempt)
			.set({
				status: "finished",
				completedAt: new Date(),
			})
			.where(eq(tryoutAttempt.id, attempt.id));

		return { success: true };
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

export const tryoutRouter = {
	list,
	find,
	start,
	featured,
	startSubtest,
	saveAnswer,
	submitSubtest,
	submitTryout,
	history,
};
