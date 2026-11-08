import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { creditTransaction } from "@bimbelbeta/db/schema/credit";
import { call } from "@orpc/server";
import { eq } from "drizzle-orm";
import type { Session } from "@/context";
import { appRouter } from "@/routers";

const enabled = !!process.env.TEST_DATABASE_URL && process.env.DATABASE_URL === process.env.TEST_DATABASE_URL;
const adminId = `credit-admin-${crypto.randomUUID()}`;
const memberId = `credit-member-${crypto.randomUUID()}`;
const now = new Date();

const session = {
	user: {
		id: adminId,
		name: adminId,
		email: `${adminId}@example.com`,
		emailVerified: false,
		image: null,
		createdAt: now,
		updatedAt: now,
		role: "superadmin",
		isPremium: false,
		premiumExpiresAt: null,
		tryoutCredits: 0,
		targetUniversityId: null,
		targetStudyProgramId: null,
	},
	session: {
		id: adminId,
		userId: adminId,
		token: adminId,
		expiresAt: new Date("2100-01-01"),
		createdAt: now,
		updatedAt: now,
		ipAddress: null,
		userAgent: null,
	},
} satisfies Session;

const options = { context: { session } };

describe.skipIf(!enabled)("credit feature workflows", () => {
	beforeAll(async () => {
		await db.insert(user).values({ id: adminId, name: adminId, email: `${adminId}@example.com`, role: "superadmin" });
		await db
			.insert(user)
			.values({ id: memberId, name: memberId, email: `${memberId}@example.com`, role: "user", tryoutCredits: 5 });
	});

	beforeEach(async () => {
		await db.delete(creditTransaction).where(eq(creditTransaction.userId, memberId));
		await db.update(user).set({ tryoutCredits: 5 }).where(eq(user.id, memberId));
	});

	afterAll(async () => {
		await db.delete(creditTransaction).where(eq(creditTransaction.userId, memberId));
		await db.delete(user).where(eq(user.id, adminId));
		await db.delete(user).where(eq(user.id, memberId));
	});

	test("adjusts a member's balance and exposes the ledger entry through find", async () => {
		const adjusted = await call(appRouter.admin.credit.adjust, { userId: memberId, amount: 2 }, options);

		expect(adjusted).toEqual({
			userId: memberId,
			previousBalance: 5,
			newBalance: 7,
			adjustment: 2,
		});

		const credits = await call(appRouter.admin.credit.find, { userId: memberId }, options);

		expect(credits.user).toMatchObject({ id: memberId, tryoutCredits: 7 });
		expect(credits.history).toHaveLength(1);
		expect(credits.history[0]).toMatchObject({
			userId: memberId,
			amount: 2,
			balanceAfter: 7,
			note: "Admin grant",
		});
	});

	test("refuses an adjustment that would make the balance negative", async () => {
		await expect(call(appRouter.admin.credit.adjust, { userId: memberId, amount: -10 }, options)).rejects.toMatchObject(
			{
				code: "BAD_REQUEST",
				message: "Kredit tidak boleh negatif",
			},
		);
	});

	test("still reports an unknown credit user as NOT_FOUND", async () => {
		await expect(
			call(appRouter.admin.credit.adjust, { userId: "unknown-credit-user", amount: 1 }, options),
		).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "User tidak ditemukan",
		});
		await expect(call(appRouter.admin.credit.find, { userId: "unknown-credit-user" }, options)).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "User tidak ditemukan",
		});
	});
});
