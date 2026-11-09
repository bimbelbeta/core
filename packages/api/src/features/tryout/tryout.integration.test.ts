import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { question } from "@bimbelbeta/db/schema/question";
import { transaction } from "@bimbelbeta/db/schema/transaction";
import {
	tryout,
	tryoutAttempt,
	tryoutSubtest,
	tryoutSubtestAttempt,
	tryoutSubtestQuestion,
} from "@bimbelbeta/db/schema/tryout";
import { call } from "@orpc/server";
import { eq, inArray } from "drizzle-orm";
import type { Session } from "@/context";
import { runScheduledJobs } from "@/cron";
import { createDateIdCursor, encodeCursor } from "@/lib/pagination/cursor";
import { appRouter } from "@/routers";

const enabled = !!process.env.TEST_DATABASE_URL && process.env.DATABASE_URL === process.env.TEST_DATABASE_URL;
const id = `tryout-it-${crypto.randomUUID()}`;
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
		role: "admin",
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
const MISSING_ID = 2147483647;
let openTryoutId = 0;
let closedTryoutId = 0;
let scoredTryoutId = 0;
let scoredAttemptId = 0;
let sweepTryoutId = 0;
const sweepTransactionId = `tryout-it-tx-${crypto.randomUUID()}`;
const createdQuestionIds: number[] = [];

describe.skipIf(!enabled)("tryout feature slice", () => {
	beforeAll(async () => {
		await db.insert(user).values({ id, name: id, email: session.user.email, role: "admin", tryoutCredits: 0 });
		const [open] = await db
			.insert(tryout)
			.values({ title: `${id} open`, status: "published", category: "utbk" })
			.returning();
		const [closed] = await db
			.insert(tryout)
			.values({
				title: `${id} closed`,
				status: "published",
				category: "utbk",
				endsAt: new Date(Date.now() - 86_400_000),
			})
			.returning();
		openTryoutId = open!.id;
		closedTryoutId = closed!.id;

		const [scored] = await db
			.insert(tryout)
			.values({ title: `${id} scored`, status: "published", category: "utbk" })
			.returning();
		scoredTryoutId = scored!.id;

		const [mappedSubtest, linearSubtest] = await db
			.insert(tryoutSubtest)
			.values([
				{ tryoutId: scoredTryoutId, name: "Mapped", duration: 30, order: 1, scoringMap: { "2": 400 } },
				{ tryoutId: scoredTryoutId, name: "Linear", duration: 30, order: 2, scoringMap: null },
			])
			.returning();

		const createdQuestions = await db
			.insert(question)
			.values(
				Array.from({ length: 5 }, (_, index) => ({
					type: "multiple_choice" as const,
					content: `${id} soal ${index + 1}`,
					discussion: "Pembahasan",
				})),
			)
			.returning();
		createdQuestionIds.push(...createdQuestions.map((row) => row.id));

		await db.insert(tryoutSubtestQuestion).values([
			{ subtestId: mappedSubtest!.id, questionId: createdQuestions[0]!.id, order: 1 },
			{ subtestId: mappedSubtest!.id, questionId: createdQuestions[1]!.id, order: 2 },
			{ subtestId: linearSubtest!.id, questionId: createdQuestions[2]!.id, order: 1 },
			{ subtestId: linearSubtest!.id, questionId: createdQuestions[3]!.id, order: 2 },
			{ subtestId: linearSubtest!.id, questionId: createdQuestions[4]!.id, order: 3 },
		]);

		const [scoredAttempt] = await db
			.insert(tryoutAttempt)
			.values({
				userId: id,
				tryoutId: scoredTryoutId,
				deadline: new Date("2100-01-01"),
				completedAt: new Date(),
				status: "finished",
				score: "450",
			})
			.returning();
		scoredAttemptId = scoredAttempt!.id;

		await db.insert(tryoutSubtestAttempt).values([
			{
				tryoutAttemptId: scoredAttemptId,
				subtestId: mappedSubtest!.id,
				deadline: new Date("2100-01-01"),
				completedAt: new Date(),
				status: "finished",
				score: "400",
			},
			{
				tryoutAttemptId: scoredAttemptId,
				subtestId: linearSubtest!.id,
				deadline: new Date("2100-01-01"),
				completedAt: new Date(),
				status: "finished",
				score: "500",
			},
		]);
	});

	afterAll(async () => {
		await db.delete(transaction).where(eq(transaction.id, sweepTransactionId));
		await db.delete(tryout).where(eq(tryout.id, closedTryoutId));
		await db.delete(tryout).where(eq(tryout.id, openTryoutId));
		await db.delete(tryout).where(eq(tryout.id, scoredTryoutId));
		if (sweepTryoutId) await db.delete(tryout).where(eq(tryout.id, sweepTryoutId));
		await db.delete(question).where(inArray(question.id, createdQuestionIds));
		await db.delete(user).where(eq(user.id, id));
	});

	test("reports the score against the tryout's real max, not a hardcoded 1000", async () => {
		const history = await call(appRouter.tryout.history, undefined, options);
		expect(history).toEqual([expect.objectContaining({ id: scoredAttemptId, score: 450, maxScore: 700 })]);

		const result = await call(appRouter.tryout.result, { attemptId: scoredAttemptId }, options);
		expect(result.maxScore).toBe(700);
	});

	test("still returns NOT_FOUND for a bad tryout or subtest id", async () => {
		await expect(call(appRouter.tryout.find, { id: MISSING_ID }, options)).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Tryout tidak ditemukan.",
		});
		await expect(call(appRouter.tryout.start, { id: MISSING_ID }, options)).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Tryout tidak ditemukan",
		});
		await expect(call(appRouter.admin.tryout.find, { id: MISSING_ID }, options)).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Tryout tidak ditemukan",
		});
		await expect(call(appRouter.admin.tryout.subtest.find, { id: MISSING_ID }, options)).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Subtest tidak ditemukan",
		});
		await expect(call(appRouter.admin.tryout.attempts.list, { id: MISSING_ID }, options)).resolves.toMatchObject({
			items: [],
			pageInfo: { hasNextPage: false, hasPreviousPage: false },
		});
	});

	test("pages the member list by (startsAt, id) across tied and null startsAt values", async () => {
		const startsAt = new Date("2100-01-02");
		const created = [];
		const createdIds: number[] = [];
		try {
			for (let i = 0; i < 4; i++) {
				const [row] = await db
					.insert(tryout)
					.values({ title: `${id} paged ${i}`, status: "published", category: "utbk", startsAt })
					.returning();
				created.push(row!);
				createdIds.push(row!.id);
			}
			const [unscheduled] = await db
				.insert(tryout)
				.values({ title: `${id} paged unscheduled`, status: "published", category: "utbk" })
				.returning();
			created.push(unscheduled!);
			createdIds.push(unscheduled!.id);
			const [first, second, third, fourth] = created;

			const page1 = await call(
				appRouter.tryout.list,
				{ limit: 2, after: createDateIdCursor(startsAt, MISSING_ID) },
				options,
			);
			expect(page1.items.map((t) => t.id)).toEqual([fourth!.id, third!.id]);
			expect(page1.pageInfo.hasNextPage).toBe(true);

			const page2 = await call(
				appRouter.tryout.list,
				{ limit: 2, after: page1.pageInfo.endCursor ?? undefined },
				options,
			);
			expect(page2.items.map((t) => t.id)).toEqual([second!.id, first!.id]);

			const back = await call(
				appRouter.tryout.list,
				{ limit: 2, before: page2.pageInfo.startCursor ?? undefined },
				options,
			);
			expect(back.items.map((t) => t.id)).toEqual([fourth!.id, third!.id]);
			expect(back.pageInfo.hasPreviousPage).toBe(true);

			const listPage = (input: { limit: number; after?: string; before?: string }) =>
				call(appRouter.tryout.list, input, options);

			const walked: number[] = [];
			let cursor: string | null | undefined = createDateIdCursor(null, 0);
			for (let i = 0; i < 100; i++) {
				if (!cursor) break;
				const page = await listPage({ limit: 2, after: cursor });
				expect(page.items.every((t) => t.startsAt !== null)).toBe(true);
				walked.push(...page.items.map((t) => t.id));
				if (!page.pageInfo.hasNextPage) break;
				cursor = page.pageInfo.endCursor;
			}
			expect(walked.filter((wid) => createdIds.includes(wid))).toEqual([fourth!.id, third!.id, second!.id, first!.id]);

			const backWalk: number[] = [];
			cursor = createDateIdCursor(null, 0);
			for (let i = 0; i < 100; i++) {
				if (!cursor) break;
				const page = await listPage({ limit: 2, before: cursor });
				expect(page.items.every((t) => t.startsAt === null)).toBe(true);
				backWalk.push(...page.items.map((t) => t.id));
				if (!page.pageInfo.hasPreviousPage) break;
				cursor = page.pageInfo.startCursor;
			}
			const knownNulls = backWalk.filter(
				(wid) => wid === unscheduled!.id || wid === closedTryoutId || wid === openTryoutId,
			);
			expect(knownNulls.sort((a, b) => a - b)).toEqual(
				[openTryoutId, closedTryoutId, unscheduled!.id].sort((a, b) => a - b),
			);
		} finally {
			if (created.length > 0) {
				await db.delete(tryout).where(inArray(tryout.id, createdIds));
			}
		}
	});

	test("a malformed cursor returns BAD_REQUEST", async () => {
		await expect(call(appRouter.tryout.list, { after: "bogus" }, options)).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Kursor tidak valid",
		});
		await expect(
			call(appRouter.tryout.list, { after: encodeCursor("99999999999999999999:1") }, options),
		).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Kursor tidak valid",
		});
	});

	test("still returns FORBIDDEN for a rejected access path", async () => {
		await expect(call(appRouter.tryout.start, { id: openTryoutId }, options)).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: "Upload bukti pembayaran, gunakan kredit tryout, atau masukkan kode akses",
		});
		await expect(
			call(appRouter.tryout.start, { id: openTryoutId, accessCode: "TIDAK-ADA" }, options),
		).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: "Kode akses tidak valid",
		});
	});

	test("still returns BAD_REQUEST for an expired window", async () => {
		await expect(
			call(appRouter.tryout.start, { id: closedTryoutId, imageUrl: "bukti.png" }, options),
		).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Tryout sudah selesai",
		});
		await expect(
			call(
				appRouter.admin.tryout.questionsBulk.bulkAddQuestionsToSubtest,
				{ subtestId: MISSING_ID, questionIds: [] },
				options,
			),
		).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Question IDs tidak boleh kosong",
		});
	});

	test("sweeps expired attempts, lapsed premium, and stale pending payments", async () => {
		const [sweepTryout] = await db
			.insert(tryout)
			.values({ title: `${id} sweep`, status: "published", category: "utbk" })
			.returning();
		sweepTryoutId = sweepTryout!.id;

		const [sweepSubtest] = await db
			.insert(tryoutSubtest)
			.values({ tryoutId: sweepTryoutId, name: "Sweep", duration: 30, order: 1 })
			.returning();
		await db
			.insert(tryoutSubtestQuestion)
			.values({ subtestId: sweepSubtest!.id, questionId: createdQuestionIds[0]!, order: 1 });

		const expiredAt = new Date(Date.now() - 60_000);
		const [expiredAttempt] = await db
			.insert(tryoutAttempt)
			.values({ userId: id, tryoutId: sweepTryoutId, deadline: expiredAt })
			.returning();
		await db
			.insert(tryoutSubtestAttempt)
			.values({ tryoutAttemptId: expiredAttempt!.id, subtestId: sweepSubtest!.id, deadline: expiredAt });

		await db.update(user).set({ isPremium: true, premiumExpiresAt: expiredAt }).where(eq(user.id, id));
		await db
			.insert(transaction)
			.values({ id: sweepTransactionId, userId: id, status: "pending", expiresAt: expiredAt });

		const summary = await runScheduledJobs();

		expect(summary.finalizedAttempts).toBeGreaterThanOrEqual(1);
		expect(summary.failedAttemptIds).toEqual([]);
		expect(summary.revokedPremium).toBeGreaterThanOrEqual(1);
		expect(summary.failedTransactions).toBeGreaterThanOrEqual(1);

		const [attempt] = await db.select().from(tryoutAttempt).where(eq(tryoutAttempt.id, expiredAttempt!.id));
		expect(attempt).toMatchObject({ status: "finished", completedAt: expect.any(Date) });

		const [subtestAttempt] = await db
			.select()
			.from(tryoutSubtestAttempt)
			.where(eq(tryoutSubtestAttempt.tryoutAttemptId, expiredAttempt!.id));
		expect(subtestAttempt).toMatchObject({ status: "finished", completedAt: expect.any(Date) });

		const [lapsedUser] = await db.select().from(user).where(eq(user.id, id));
		expect(lapsedUser?.isPremium).toBe(false);

		const [payment] = await db.select().from(transaction).where(eq(transaction.id, sweepTransactionId));
		expect(payment).toMatchObject({ status: "failed", failureCode: "payment_expired" });
	});
});
