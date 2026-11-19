import { afterAll, beforeAll, describe, expect, test } from "bun:test";
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
const id = `tryout-break-it-${crypto.randomUUID()}`;
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
const createdQuestionIds: number[] = [];
const questionCorrectChoiceId = new Map<number, number>();

async function setupScoredTryout(suffix: string, durations: number[]) {
	const [createdTryout] = await db
		.insert(tryout)
		.values({ title: `${id}-${suffix}`, status: "published", category: "utbk" })
		.returning();
	createdTryoutIds.push(createdTryout!.id);

	const insertedSubtests = await db
		.insert(tryoutSubtest)
		.values(
			durations.map((duration, index) => ({
				tryoutId: createdTryout!.id,
				name: `Subtest ${index + 1}`,
				duration,
				order: index + 1,
			})),
		)
		.returning();

	const pairs = insertedSubtests.map((st, index) => ({
		subtestId: st.id,
		questionId: createdQuestionIds[index]!,
		order: 1,
	}));
	await db.insert(tryoutSubtestQuestion).values(pairs);

	return { tryoutId: createdTryout!.id, subtests: insertedSubtests };
}

function wholeSecondAgo(minutesAgo: number, secondsOffset = 0) {
	return new Date(Math.floor((Date.now() - minutesAgo * 60_000 - secondsOffset * 1000) / 1000) * 1000);
}

describe.skipIf(!enabled)("tryout inter-subtest break integration", () => {
	beforeAll(async () => {
		await db.insert(user).values({ id, name: id, email: session.user.email, role: "user", tryoutCredits: 0 });
		for (let i = 0; i < 4; i++) {
			const [q] = await db
				.insert(question)
				.values({ type: "multiple_choice", content: `${id} soal ${i + 1}`, discussion: "Pembahasan" })
				.returning();
			createdQuestionIds.push(q!.id);
			const [correct] = await db
				.insert(questionChoice)
				.values([
					{ questionId: q!.id, content: "Benar", code: "A", isCorrect: true },
					{ questionId: q!.id, content: "Salah", code: "B", isCorrect: false },
				])
				.returning();
			questionCorrectChoiceId.set(q!.id, correct!.id);
		}
	});

	afterAll(async () => {
		if (createdTryoutIds.length > 0) await db.delete(tryout).where(inArray(tryout.id, createdTryoutIds));
		if (createdQuestionIds.length > 0) await db.delete(question).where(inArray(question.id, createdQuestionIds));
		await db.delete(user).where(eq(user.id, id));
	});

	test("enters 60s break with no next subtest row, rejects answers, surfaces in active, and supports early skip", async () => {
		const { tryoutId, subtests } = await setupScoredTryout("break-skip", [30, 30]);
		const [s1, s2] = [subtests[0]!, subtests[1]!];
		const q2 = createdQuestionIds[1]!;

		const started = await call(appRouter.tryout.start, { id: tryoutId }, options);
		expect(started.deadline.getTime() - started.startedAt.getTime()).toBeGreaterThanOrEqual(60 * 60_000);
		expect(started.deadline.getTime() - started.startedAt.getTime()).toBeLessThanOrEqual(61 * 60_000 + 2000);

		const submitted = await call(appRouter.tryout.submitSubtest, { tryoutId, subtestId: s1.id }, options);
		expect(submitted).toEqual({
			success: true,
			tryoutCompleted: false,
			nextSubtestId: s2.id,
			breakDeadline: expect.any(Date),
			autoCompletedByTimer: false,
		});

		const breakRows = await db
			.select()
			.from(tryoutSubtestAttempt)
			.where(eq(tryoutSubtestAttempt.tryoutAttemptId, started.id));
		expect(breakRows).toHaveLength(1);
		expect(breakRows[0]?.subtestId).toBe(s1.id);

		const foundBreak = await call(appRouter.tryout.find, { id: tryoutId }, options);
		expect(foundBreak.currentSubtest).toMatchObject({
			id: s2.id,
			questions: [],
			deadline: null,
			status: "not_started",
		});
		expect(foundBreak.breakDeadline).toEqual(expect.any(Date));
		expect(foundBreak.autoSubmittedSubtestId).toBeNull();
		expect(foundBreak.completedSubtests).toBe(1);

		const activeList = await call(appRouter.tryout.active, undefined, options);
		expect(activeList).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: tryoutId,
					attemptId: started.id,
					totalSubtests: 2,
					completedSubtests: 1,
					activeSubtestName: s2.name,
					activeDeadline: null,
					breakDeadline: foundBreak.breakDeadline,
				}),
			]),
		);

		await expect(
			call(
				appRouter.tryout.saveAnswer,
				{ tryoutId, questionId: q2, answerType: "choice", selectedChoiceId: questionCorrectChoiceId.get(q2)! },
				options,
			),
		).rejects.toMatchObject({ code: "BAD_REQUEST", message: "Subtes belum dimulai" });
		await expect(call(appRouter.tryout.toggleRaguRagu, { tryoutId, questionId: q2 }, options)).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Subtes belum dimulai",
		});
		expect(await db.select().from(tryoutUserAnswer).where(eq(tryoutUserAnswer.attemptId, started.id))).toHaveLength(0);

		const skipped = await call(appRouter.tryout.startSubtest, { tryoutId, subtestId: s2.id }, options);
		expect(skipped.subtestId).toBe(s2.id);
		expect(skipped.status).toBe("ongoing");
		expect(skipped.deadline.getTime() - skipped.startedAt.getTime()).toBe(30 * 60_000);

		const [updatedAttempt] = await db.select().from(tryoutAttempt).where(eq(tryoutAttempt.id, started.id));
		expect(updatedAttempt?.breakEndsAt).toBeNull();
		expect(updatedAttempt?.deadline.getTime()).toBe(skipped.deadline.getTime());

		await expect(
			call(
				appRouter.tryout.saveAnswer,
				{ tryoutId, questionId: q2, answerType: "choice", selectedChoiceId: questionCorrectChoiceId.get(q2)! },
				options,
			),
		).resolves.toEqual({ success: true });

		const foundOngoing = await call(appRouter.tryout.find, { id: tryoutId }, options);
		expect(foundOngoing.breakDeadline).toBeNull();
		expect(foundOngoing.currentSubtest).toMatchObject({ id: s2.id, status: "ongoing" });
		expect(foundOngoing.currentSubtest?.questions).toHaveLength(1);
	});

	test("preserves autoSubmittedSubtestId during timeout break and clears it after startSubtest", async () => {
		const { tryoutId, subtests } = await setupScoredTryout("timeout-break", [30, 30]);
		const [s1, s2] = [subtests[0]!, subtests[1]!];
		const startedAt = wholeSecondAgo(30, 10);
		const s1Deadline = wholeSecondAgo(0, 10);
		const expectedBreakEnd = new Date(s1Deadline.getTime() + 60_000);

		const [attemptRow] = await db
			.insert(tryoutAttempt)
			.values({
				userId: id,
				tryoutId,
				startedAt,
				deadline: new Date(expectedBreakEnd.getTime() + 30 * 60_000),
			})
			.returning();
		await db
			.insert(tryoutSubtestAttempt)
			.values({ tryoutAttemptId: attemptRow!.id, subtestId: s1.id, startedAt, deadline: s1Deadline });

		const firstFind = await call(appRouter.tryout.find, { id: tryoutId }, options);
		expect(firstFind.autoSubmittedSubtestId).toBe(s1.id);
		expect(firstFind.breakDeadline?.getTime()).toBe(expectedBreakEnd.getTime());
		expect(firstFind.currentSubtest).toMatchObject({ id: s2.id, status: "not_started", deadline: null });

		const secondFind = await call(appRouter.tryout.find, { id: tryoutId }, options);
		expect(secondFind.autoSubmittedSubtestId).toBe(s1.id);

		await call(appRouter.tryout.startSubtest, { tryoutId, subtestId: s2.id }, options);
		const afterStartFind = await call(appRouter.tryout.find, { id: tryoutId }, options);
		expect(afterStartFind.autoSubmittedSubtestId).toBeNull();
		expect(afterStartFind.breakDeadline).toBeNull();
		expect(afterStartFind.currentSubtest).toMatchObject({ id: s2.id, status: "ongoing" });
	});

	test("chain-advances 45 minutes offline into subtest 4 with full duration", async () => {
		const { tryoutId, subtests } = await setupScoredTryout("offline-45m", [15, 15, 15, 15]);
		const [s1, s2, s3, s4] = [subtests[0]!, subtests[1]!, subtests[2]!, subtests[3]!];
		const baseTime = wholeSecondAgo(60);
		const s1Deadline = new Date(baseTime.getTime() + 15 * 60_000);
		const overallDeadline = new Date(baseTime.getTime() + 63 * 60_000);

		const [attemptRow] = await db
			.insert(tryoutAttempt)
			.values({ userId: id, tryoutId, startedAt: baseTime, deadline: overallDeadline })
			.returning();
		await db
			.insert(tryoutSubtestAttempt)
			.values({ tryoutAttemptId: attemptRow!.id, subtestId: s1.id, startedAt: baseTime, deadline: s1Deadline });

		const found = await call(appRouter.tryout.find, { id: tryoutId }, options);
		expect(found.breakDeadline).toBeNull();
		expect(found.autoSubmittedSubtestId).toBeNull();
		expect(found.completedSubtests).toBe(3);
		expect(found.currentSubtest).toMatchObject({
			id: s4.id,
			status: "ongoing",
			deadline: overallDeadline,
		});
		expect(found.currentSubtest?.questions).toHaveLength(1);

		const rows = await db
			.select()
			.from(tryoutSubtestAttempt)
			.where(eq(tryoutSubtestAttempt.tryoutAttemptId, attemptRow!.id));
		expect(rows).toHaveLength(4);
		expect(rows.find((r) => r.subtestId === s2.id)).toMatchObject({ status: "finished", autoSubmitted: true });
		expect(rows.find((r) => r.subtestId === s3.id)).toMatchObject({ status: "finished", autoSubmitted: true });
		const s4Row = rows.find((r) => r.subtestId === s4.id)!;
		expect(s4Row.status).toBe("ongoing");
		expect(s4Row.deadline.getTime() - s4Row.startedAt.getTime()).toBe(15 * 60_000);
	});

	test("chain-finishes 3 hours offline with full-subtest score averaging and clears autoSubmittedSubtestId on reopen", async () => {
		const { tryoutId, subtests } = await setupScoredTryout("offline-3h", [15, 15, 15, 15]);
		const [s1, s4] = [subtests[0]!, subtests[3]!];
		const q1 = createdQuestionIds[0]!;
		const baseTime = wholeSecondAgo(180);
		const s1Deadline = new Date(baseTime.getTime() + 15 * 60_000);
		const overallDeadline = new Date(baseTime.getTime() + 63 * 60_000);

		const [attemptRow] = await db
			.insert(tryoutAttempt)
			.values({ userId: id, tryoutId, startedAt: baseTime, deadline: overallDeadline })
			.returning();
		await db
			.insert(tryoutSubtestAttempt)
			.values({ tryoutAttemptId: attemptRow!.id, subtestId: s1.id, startedAt: baseTime, deadline: s1Deadline });
		await db
			.insert(tryoutUserAnswer)
			.values({ attemptId: attemptRow!.id, questionId: q1, selectedChoiceId: questionCorrectChoiceId.get(q1)! });

		const firstFind = await call(appRouter.tryout.find, { id: tryoutId }, options);
		expect(firstFind.attempt.status).toBe("finished");
		expect(firstFind.attempt.score).toBe(250);
		expect(firstFind.currentSubtest).toBeNull();
		expect(firstFind.breakDeadline).toBeNull();
		expect(firstFind.autoSubmittedSubtestId).toBe(s4.id);
		expect(firstFind.completedSubtests).toBe(4);

		const reopenFind = await call(appRouter.tryout.find, { id: tryoutId }, options);
		expect(reopenFind.attempt.status).toBe("finished");
		expect(reopenFind.attempt.score).toBe(250);
		expect(reopenFind.autoSubmittedSubtestId).toBeNull();
	});

	test("handles concurrent find and startSubtest cleanly when break ends", async () => {
		const { tryoutId, subtests } = await setupScoredTryout("concurrent-break-end", [30, 30]);
		const [s1, s2] = [subtests[0]!, subtests[1]!];
		const startedAt = wholeSecondAgo(31, 5);
		const s1Ended = wholeSecondAgo(1, 5);
		const breakEndsAt = wholeSecondAgo(0, 5);
		const s2Deadline = new Date(breakEndsAt.getTime() + 30 * 60_000);

		const [attemptRow] = await db
			.insert(tryoutAttempt)
			.values({ userId: id, tryoutId, startedAt, breakEndsAt, deadline: s2Deadline })
			.returning();
		await db.insert(tryoutSubtestAttempt).values({
			tryoutAttemptId: attemptRow!.id,
			subtestId: s1.id,
			startedAt,
			deadline: s1Ended,
			completedAt: s1Ended,
			status: "finished",
			autoSubmitted: false,
		});

		const [found, startedSubtest] = await Promise.all([
			call(appRouter.tryout.find, { id: tryoutId }, options),
			call(appRouter.tryout.startSubtest, { tryoutId, subtestId: s2.id }, options),
		]);

		expect(found.breakDeadline).toBeNull();
		expect(found.currentSubtest).toMatchObject({ id: s2.id, status: "ongoing", deadline: s2Deadline });
		expect(startedSubtest).toMatchObject({
			subtestId: s2.id,
			status: "ongoing",
			startedAt: breakEndsAt,
			deadline: s2Deadline,
		});

		const rows = await db
			.select()
			.from(tryoutSubtestAttempt)
			.where(eq(tryoutSubtestAttempt.tryoutAttemptId, attemptRow!.id));
		expect(rows).toHaveLength(2);
		const [savedAttempt] = await db.select().from(tryoutAttempt).where(eq(tryoutAttempt.id, attemptRow!.id));
		expect(savedAttempt?.breakEndsAt).toBeNull();
	});

	test("runScheduledJobs cron sweep inserts missing unstarted subtests before averaging scores", async () => {
		const { tryoutId, subtests } = await setupScoredTryout("cron-missing-subtest", [30, 30]);
		const [s1, s2] = [subtests[0]!, subtests[1]!];
		const q1 = createdQuestionIds[0]!;
		const expiredAt = wholeSecondAgo(5);

		const [attemptRow] = await db
			.insert(tryoutAttempt)
			.values({ userId: id, tryoutId, startedAt: wholeSecondAgo(66), deadline: expiredAt })
			.returning();
		await db.insert(tryoutSubtestAttempt).values({
			tryoutAttemptId: attemptRow!.id,
			subtestId: s1.id,
			startedAt: wholeSecondAgo(66),
			deadline: expiredAt,
		});
		await db
			.insert(tryoutUserAnswer)
			.values({ attemptId: attemptRow!.id, questionId: q1, selectedChoiceId: questionCorrectChoiceId.get(q1)! });

		const summary = await runScheduledJobs();
		expect(summary.finalizedAttempts).toBeGreaterThanOrEqual(1);

		const [savedAttempt] = await db.select().from(tryoutAttempt).where(eq(tryoutAttempt.id, attemptRow!.id));
		expect(savedAttempt?.status).toBe("finished");
		expect(savedAttempt?.breakEndsAt).toBeNull();
		expect(Number(savedAttempt?.score)).toBe(500);

		const subtestRows = await db
			.select()
			.from(tryoutSubtestAttempt)
			.where(eq(tryoutSubtestAttempt.tryoutAttemptId, attemptRow!.id));
		expect(subtestRows).toHaveLength(2);
		expect(subtestRows.find((r) => r.subtestId === s1.id)).toMatchObject({ status: "finished", autoSubmitted: true });
		expect(subtestRows.find((r) => r.subtestId === s2.id)).toMatchObject({ status: "finished", autoSubmitted: true });
	});
});
