import { describe, expect, test } from "bun:test";
import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { question } from "@bimbelbeta/db/schema/question";
import { call } from "@orpc/server";
import { count, eq } from "drizzle-orm";
import type { Session } from "@/context";
import { appRouter } from "@/routers";

const enabled = !!process.env.TEST_DATABASE_URL && process.env.DATABASE_URL === process.env.TEST_DATABASE_URL;
const id = `dashboard-it-${crypto.randomUUID()}`;
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

describe.skipIf(!enabled)("dashboard feature slice", () => {
	test("admin stats returns the dashboard measures without a server error", async () => {
		const stats = await call(appRouter.admin.dashboard.stats, undefined, options);

		expect(Object.keys(stats).sort()).toEqual([
			"essayQuestions",
			"monthlyRevenue",
			"premiumUsers",
			"recentTryouts",
			"revenueTrend",
			"totalQuestions",
			"totalUsers",
			"usersTrend",
		]);
		expect(stats.revenueTrend === null || Number.isFinite(stats.revenueTrend)).toBe(true);
		expect(stats.usersTrend === null || Number.isFinite(stats.usersTrend)).toBe(true);
		expect(stats.recentTryouts.every((tryout) => "subtestCount" in tryout)).toBe(true);
		expect(stats.totalUsers).toBeGreaterThanOrEqual(0);
		expect(stats.premiumUsers).toBeGreaterThanOrEqual(0);
		expect(stats.monthlyRevenue).toBeGreaterThanOrEqual(0);
		expect(stats.totalUsers).toBeGreaterThanOrEqual(stats.premiumUsers);

		const [premium] = await db.select({ count: count() }).from(user).where(eq(user.isPremium, true));
		const [essays] = await db.select({ count: count() }).from(question).where(eq(question.type, "essay"));
		expect(stats.premiumUsers).toBe(premium?.count ?? 0);
		expect(stats.essayQuestions).toBe(essays?.count ?? 0);
	});
});
