import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { question } from "@bimbelbeta/db/schema/question";
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
		await db.delete(tryout).where(eq(tryout.id, closedTryoutId));
		await db.delete(tryout).where(eq(tryout.id, openTryoutId));
		await db.delete(tryout).where(eq(tryout.id, scoredTryoutId));
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
});
