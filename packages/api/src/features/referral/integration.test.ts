import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { referralCode } from "@bimbelbeta/db/schema/referral";
import { call } from "@orpc/server";
import { eq } from "drizzle-orm";
import type { Session } from "@/context";
import { appRouter } from "@/routers";

const enabled = !!process.env.TEST_DATABASE_URL && process.env.DATABASE_URL === process.env.TEST_DATABASE_URL;
const id = `referral-int-${crypto.randomUUID()}`;
const code = `PREM${Date.now().toString(36).toUpperCase()}`;
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

const superadminSession = { ...session, user: { ...session.user, role: "superadmin" } } satisfies Session;
const memberOptions = { context: { session } };
const superadminOptions = { context: { session: superadminSession } };
const DAY_MS = 24 * 60 * 60 * 1000;

describe.skipIf(!enabled)("referral persistence", () => {
	beforeAll(async () => {
		await db.insert(user).values({ id, name: id, email: session.user.email, role: "user", tryoutCredits: 0 });
	});

	afterAll(async () => {
		await db.delete(referralCode).where(eq(referralCode.code, code));
		await db.delete(user).where(eq(user.id, id));
	});

	test("still returns NOT_FOUND for a bad referral id", async () => {
		await expect(
			call(appRouter.admin.referral.updateStatus, { codeId: `${id}-missing`, status: true }, superadminOptions),
		).rejects.toMatchObject({ code: "NOT_FOUND", message: "Kode referal tidak ditemukan." });

		await expect(
			call(appRouter.admin.referral.getUsages, { codeId: `${id}-missing` }, superadminOptions),
		).rejects.toMatchObject({ code: "NOT_FOUND", message: "Kode referal tidak ditemukan." });
	});

	test("creates a code as superadmin and redeems it once for premium", async () => {
		const before = Date.now();
		const created = await call(appRouter.admin.referral.create, { code, premiumDays: 7 }, superadminOptions);

		expect(created.code).toBe(code);
		expect(created.premiumDays).toBe(7);
		expect(created.createdBy).toBe(superadminSession.user.id);

		const redeemed = await call(appRouter.referral.redeem, { code }, memberOptions);

		expect(redeemed.message).toBe(
			`Selamat! Akun Premium Anda aktif hingga ${redeemed.premiumExpiresAt.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}.`,
		);
		expect(redeemed.premiumExpiresAt.getTime()).toBeGreaterThan(before + 7 * DAY_MS - 60_000);
		expect(redeemed.premiumExpiresAt.getTime()).toBeLessThan(before + 7 * DAY_MS + 60_000);

		const usages = await call(appRouter.admin.referral.getUsages, { codeId: created.id }, superadminOptions);

		expect(usages.items).toHaveLength(1);
		expect(usages.items[0]).toMatchObject({ userId: id, usageId: usages.items[0]?.usageId });
		expect(usages.referralCode.usageCount).toBe(1);

		const [row] = await db.select().from(referralCode).where(eq(referralCode.id, created.id)).limit(1);
		expect(row?.usageCount).toBe(1);
		expect(row?.status).toBe(true);

		await expect(call(appRouter.referral.redeem, { code }, memberOptions)).rejects.toMatchObject({
			code: "UNPROCESSABLE_CONTENT",
			message: "Anda sudah pernah menggunakan kode ini.",
		});
	});
});
