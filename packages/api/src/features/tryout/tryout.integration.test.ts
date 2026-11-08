import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { tryout } from "@bimbelbeta/db/schema/tryout";
import { call } from "@orpc/server";
import { eq } from "drizzle-orm";
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
	});

	afterAll(async () => {
		await db.delete(tryout).where(eq(tryout.id, closedTryoutId));
		await db.delete(tryout).where(eq(tryout.id, openTryoutId));
		await db.delete(user).where(eq(user.id, id));
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
