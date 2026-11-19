import { afterAll, beforeAll, describe, expect, setSystemTime, test } from "bun:test";
import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { question, questionChoice } from "@bimbelbeta/db/schema/question";
import {
	tryout,
	tryoutAttempt,
	tryoutSubtest,
	tryoutSubtestAttempt,
	tryoutSubtestQuestion,
	tryoutUserAnswer,
} from "@bimbelbeta/db/schema/tryout";
import { call } from "@orpc/server";
import { eq, inArray } from "drizzle-orm";
import type { Session } from "@/context";
import { runScheduledJobs } from "@/cron";
import { appRouter } from "@/routers";

const enabled = !!process.env.TEST_DATABASE_URL && process.env.DATABASE_URL === process.env.TEST_DATABASE_URL;
const id = `tryout-timer-it-${crypto.randomUUID()}`;
const now = new Date();
const session = {
	user: {
		id,
		name: id,
		email: `${id}@example.com`,
		emailVerified: false,
		image: null,
		createdAt: now,
		updatedAt: now,
		role: "user",
		isPremium: false,
		premiumExpiresAt: null,
		tryoutCredits: 0,
		targetUniversityId: null,
		targetStudyProgramId: null,
	},
	session: {
		id,
		userId: id,
		token: id,
		expiresAt: new Date("2100-01-01"),
		createdAt: now,
		updatedAt: now,
		ipAddress: null,
		userAgent: null,
	},
} satisfies Session;
const options = { context: { session } };
const createdTryoutIds: number[] = [];
let questionId = 0;
let correctChoiceId = 0;

async function setupTwoSubtestTryout(suffix: string, attachQuestionToSecond = false) {
	const [createdTryout] = await db
		.insert(tryout)
		.values({ title: `${id}-${suffix}`, status: "published", category: "utbk" })
		.returning();
	createdTryoutIds.push(createdTryout!.id);

	const [s1, s2] = await db
		.insert(tryoutSubtest)
		.values([
			{ tryoutId: createdTryout!.id, name: "Subtest 1", duration: 30, order: 1 },
			{ tryoutId: createdTryout!.id, name: "Subtest 2", duration: 30, order: 2 },
		])
		.returning();

	await db
		.insert(tryoutSubtestQuestion)
		.values({ subtestId: attachQuestionToSecond ? s2!.id : s1!.id, questionId, order: 1 });

	return { tryoutId: createdTryout!.id, s1: s1!, s2: s2! };
}

describe.skipIf(!enabled)("tryout timer and auto-finish integration", () => {
	beforeAll(async () => {
		await db.insert(user).values({ id, name: id, email: session.user.email, role: "user", tryoutCredits: 0 });
		const [createdQuestion] = await db
			.insert(question)
			.values({ type: "multiple_choice", content: `${id} soal`, discussion: "Pembahasan" })
			.returning();
		questionId = createdQuestion!.id;
		const [correct] = await db
			.insert(questionChoice)
			.values([
				{ questionId, content: "Benar", code: "A", isCorrect: true },
				{ questionId, content: "Salah", code: "B", isCorrect: false },
			])
			.returning();
		correctChoiceId = correct!.id;
	});

	afterAll(async () => {
		if (createdTryoutIds.length > 0) await db.delete(tryout).where(inArray(tryout.id, createdTryoutIds));
		if (questionId) await db.delete(question).where(eq(question.id, questionId));
		await db.delete(user).where(eq(user.id, id));
	});

	test("marks late submitSubtest auto_submitted=true, pins completed_at to deadline, and retries idempotently", async () => {
		const { tryoutId, s1, s2 } = await setupTwoSubtestTryout("late-nonfinal");
		const startedAt = new Date(Date.now() - 35 * 60_000);
		const s1Deadline = new Date(Date.now() - 5 * 60_000);
		const attemptDeadline = new Date(Date.now() + 25 * 60_000);

		const [attemptRow] = await db
			.insert(tryoutAttempt)
			.values({ userId: id, tryoutId, startedAt, deadline: attemptDeadline })
			.returning();
		await db
			.insert(tryoutSubtestAttempt)
			.values({ tryoutAttemptId: attemptRow!.id, subtestId: s1.id, startedAt, deadline: s1Deadline });

		const first = await call(appRouter.tryout.submitSubtest, { tryoutId, subtestId: s1.id }, options);
		expect(first).toEqual({
			success: true,
			tryoutCompleted: false,
			nextSubtestId: s2.id,
			breakDeadline: null,
			autoCompletedByTimer: true,
		});

		const rows = await db
			.select()
			.from(tryoutSubtestAttempt)
			.where(eq(tryoutSubtestAttempt.tryoutAttemptId, attemptRow!.id));
		const firstRow = rows.find((r) => r.subtestId === s1.id)!;
		const secondRow = rows.find((r) => r.subtestId === s2.id)!;
		expect(firstRow.status).toBe("finished");
		expect(firstRow.autoSubmitted).toBe(true);
		expect(firstRow.completedAt?.getTime()).toBe(s1Deadline.getTime());
		expect(secondRow.status).toBe("ongoing");
		expect(secondRow.autoSubmitted).toBe(false);
		expect(secondRow.startedAt.getTime()).toBe(s1Deadline.getTime());
		expect(secondRow.deadline.getTime()).toBe(attemptDeadline.getTime());

		const retry = await call(appRouter.tryout.submitSubtest, { tryoutId, subtestId: s1.id }, options);
		expect(retry).toEqual(first);
	});

	test("completes final subtest expiry past attempt.deadline, scores, and retries idempotently", async () => {
		const { tryoutId, s1, s2 } = await setupTwoSubtestTryout("late-final", true);
		const startedAt = new Date(Date.now() - 65 * 60_000);
		const s1Deadline = new Date(Date.now() - 35 * 60_000);
		const s2Deadline = new Date(Date.now() - 5 * 60_000);

		const [attemptRow] = await db
			.insert(tryoutAttempt)
			.values({ userId: id, tryoutId, startedAt, deadline: s2Deadline })
			.returning();
		await db.insert(tryoutSubtestAttempt).values([
			{
				tryoutAttemptId: attemptRow!.id,
				subtestId: s1.id,
				startedAt,
				deadline: s1Deadline,
				completedAt: s1Deadline,
				status: "finished",
				autoSubmitted: false,
			},
			{
				tryoutAttemptId: attemptRow!.id,
				subtestId: s2.id,
				startedAt: s1Deadline,
				deadline: s2Deadline,
			},
		]);
		await db
			.insert(tryoutUserAnswer)
			.values({ attemptId: attemptRow!.id, questionId, selectedChoiceId: correctChoiceId });

		const first = await call(appRouter.tryout.submitSubtest, { tryoutId, subtestId: s2.id }, options);
		expect(first).toEqual({ success: true, tryoutCompleted: true, score: 1000, autoCompletedByTimer: true });

		const [savedAttempt] = await db.select().from(tryoutAttempt).where(eq(tryoutAttempt.id, attemptRow!.id));
		expect(savedAttempt?.status).toBe("finished");
		expect(Number(savedAttempt?.score)).toBe(1000);
		expect(savedAttempt?.completedAt?.getTime()).toBe(s2Deadline.getTime());

		const [savedS2] = await db
			.select()
			.from(tryoutSubtestAttempt)
			.where(eq(tryoutSubtestAttempt.tryoutAttemptId, attemptRow!.id))
			.then((rows) => rows.filter((r) => r.subtestId === s2.id));
		expect(savedS2?.status).toBe("finished");
		expect(savedS2?.autoSubmitted).toBe(true);
		expect(savedS2?.completedAt?.getTime()).toBe(s2Deadline.getTime());

		const retry = await call(appRouter.tryout.submitSubtest, { tryoutId, subtestId: s2.id }, options);
		expect(retry).toEqual(first);
	});

	test("supports idempotent retries for manual non-final and final subtest submissions", async () => {
		const { tryoutId, s1, s2 } = await setupTwoSubtestTryout("manual-idempotent");
		const started = await call(appRouter.tryout.start, { id: tryoutId }, options);
		await call(
			appRouter.tryout.saveAnswer,
			{ tryoutId, questionId, answerType: "choice", selectedChoiceId: correctChoiceId },
			options,
		);

		const submit1 = await call(appRouter.tryout.submitSubtest, { tryoutId, subtestId: s1.id }, options);
		expect(submit1).toEqual({
			success: true,
			tryoutCompleted: false,
			nextSubtestId: s2.id,
			breakDeadline: null,
			autoCompletedByTimer: false,
		});
		const retry1 = await call(appRouter.tryout.submitSubtest, { tryoutId, subtestId: s1.id }, options);
		expect(retry1).toEqual(submit1);

		const submit2 = await call(appRouter.tryout.submitSubtest, { tryoutId, subtestId: s2.id }, options);
		expect(submit2).toEqual({ success: true, tryoutCompleted: true, score: 1000, autoCompletedByTimer: false });
		const retry2 = await call(appRouter.tryout.submitSubtest, { tryoutId, subtestId: s2.id }, options);
		expect(retry2).toEqual(submit2);

		const rows = await db
			.select()
			.from(tryoutSubtestAttempt)
			.where(eq(tryoutSubtestAttempt.tryoutAttemptId, started.id));
		expect(rows.every((r) => r.autoSubmitted === false)).toBe(true);
	});

	test("handles find expiry, find+submit race, and concurrent submitSubtest calls cleanly", async () => {
		const { tryoutId: raceTryoutId, s1, s2 } = await setupTwoSubtestTryout("race");
		const startedAt = new Date(Date.now() - 35 * 60_000);
		const s1Deadline = new Date(Date.now() - 5 * 60_000);
		const attemptDeadline = new Date(Date.now() + 25 * 60_000);

		const [raceAttempt] = await db
			.insert(tryoutAttempt)
			.values({ userId: id, tryoutId: raceTryoutId, startedAt, deadline: attemptDeadline })
			.returning();
		await db
			.insert(tryoutSubtestAttempt)
			.values({ tryoutAttemptId: raceAttempt!.id, subtestId: s1.id, startedAt, deadline: s1Deadline });

		const [foundRace, submitRace] = await Promise.all([
			call(appRouter.tryout.find, { id: raceTryoutId }, options),
			call(appRouter.tryout.submitSubtest, { tryoutId: raceTryoutId, subtestId: s1.id }, options),
		]);
		expect(submitRace).toEqual({
			success: true,
			tryoutCompleted: false,
			nextSubtestId: s2.id,
			breakDeadline: null,
			autoCompletedByTimer: true,
		});
		expect(foundRace.currentSubtest?.id).toBe(s2.id);

		const afterFind = await call(appRouter.tryout.find, { id: raceTryoutId }, options);
		expect(afterFind.autoSubmittedSubtestId).toBeNull();
		expect(afterFind.currentSubtest?.id).toBe(s2.id);

		await db
			.update(tryoutSubtestAttempt)
			.set({ deadline: new Date(Date.now() - 1000) })
			.where(eq(tryoutSubtestAttempt.tryoutAttemptId, raceAttempt!.id));

		const [concurrentA, concurrentB] = await Promise.all([
			call(appRouter.tryout.submitSubtest, { tryoutId: raceTryoutId, subtestId: s2.id }, options),
			call(appRouter.tryout.submitSubtest, { tryoutId: raceTryoutId, subtestId: s2.id }, options),
		]);
		expect(concurrentA).toEqual({ success: true, tryoutCompleted: true, score: 0, autoCompletedByTimer: true });
		expect(concurrentB).toEqual(concurrentA);

		const finishedFind = await call(appRouter.tryout.find, { id: raceTryoutId }, options);
		expect(finishedFind.attempt.status).toBe("finished");
		expect(finishedFind.currentSubtest).toBeNull();
		expect(finishedFind.autoSubmittedSubtestId).toBeNull();

		const { tryoutId: findOnlyId, s1: fs1, s2: fs2 } = await setupTwoSubtestTryout("find-expiry");
		const [findAttempt] = await db
			.insert(tryoutAttempt)
			.values({ userId: id, tryoutId: findOnlyId, startedAt, deadline: attemptDeadline })
			.returning();
		await db
			.insert(tryoutSubtestAttempt)
			.values({ tryoutAttemptId: findAttempt!.id, subtestId: fs1.id, startedAt, deadline: s1Deadline });

		const firstFind = await call(appRouter.tryout.find, { id: findOnlyId }, options);
		expect(firstFind.autoSubmittedSubtestId).toBe(fs1.id);
		expect(firstFind.currentSubtest?.id).toBe(fs2.id);
		const secondFind = await call(appRouter.tryout.find, { id: findOnlyId }, options);
		expect(secondFind.autoSubmittedSubtestId).toBeNull();
	});

	test("enforces strict 0-second saveAnswer and toggleRaguRagu cutoff with zero mutations", async () => {
		const { tryoutId, s1 } = await setupTwoSubtestTryout("cutoff");
		const exactDeadline = new Date(Date.now() + 60_000);
		const [attemptRow] = await db
			.insert(tryoutAttempt)
			.values({ userId: id, tryoutId, deadline: new Date(exactDeadline.getTime() + 60_000) })
			.returning();
		await db
			.insert(tryoutSubtestAttempt)
			.values({ tryoutAttemptId: attemptRow!.id, subtestId: s1.id, deadline: exactDeadline });

		setSystemTime(exactDeadline);
		try {
			await expect(
				call(
					appRouter.tryout.saveAnswer,
					{ tryoutId, questionId, answerType: "choice", selectedChoiceId: correctChoiceId },
					options,
				),
			).rejects.toMatchObject({ code: "BAD_REQUEST", message: "Batas waktu subtest telah habis" });
			await expect(call(appRouter.tryout.toggleRaguRagu, { tryoutId, questionId }, options)).rejects.toMatchObject({
				code: "BAD_REQUEST",
				message: "Batas waktu subtest telah habis",
			});
		} finally {
			setSystemTime();
		}

		expect(await db.select().from(tryoutUserAnswer).where(eq(tryoutUserAnswer.attemptId, attemptRow!.id))).toHaveLength(
			0,
		);
	});

	test("runScheduledJobs cron sweep marks expired ongoing subtests auto_submitted=true", async () => {
		const { tryoutId, s1 } = await setupTwoSubtestTryout("cron-sweep");
		const expiredAt = new Date(Date.now() - 60_000);
		const [attemptRow] = await db
			.insert(tryoutAttempt)
			.values({ userId: id, tryoutId, deadline: expiredAt })
			.returning();
		await db
			.insert(tryoutSubtestAttempt)
			.values({ tryoutAttemptId: attemptRow!.id, subtestId: s1.id, deadline: expiredAt });
		await db
			.insert(tryoutUserAnswer)
			.values({ attemptId: attemptRow!.id, questionId, selectedChoiceId: correctChoiceId });

		const summary = await runScheduledJobs();
		expect(summary.finalizedAttempts).toBeGreaterThanOrEqual(1);

		const [savedAttempt] = await db.select().from(tryoutAttempt).where(eq(tryoutAttempt.id, attemptRow!.id));
		expect(savedAttempt?.status).toBe("finished");
		expect(Number(savedAttempt?.score)).toBe(1000);

		const [savedSubtest] = await db
			.select()
			.from(tryoutSubtestAttempt)
			.where(eq(tryoutSubtestAttempt.tryoutAttemptId, attemptRow!.id));
		expect(savedSubtest).toMatchObject({ status: "finished", autoSubmitted: true });
	});
});
