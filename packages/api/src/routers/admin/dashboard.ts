import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { subject } from "@bimbelbeta/db/schema/subject";
import { transaction } from "@bimbelbeta/db/schema/transaction";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { baseImplementer } from "../../lib/router-definition";
import { rateLimit, requireAdmin, requireAuth } from "../../lib/router-definition/middleware";

const admin = baseImplementer.use(requireAuth).use(rateLimit).use(requireAdmin);

const stats = admin.admin.dashboard.stats.handler(async () => {
	const now = new Date();
	const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

	const currentUsers = await db.select({ count: count() }).from(user);

	const currentPremium = await db.select({ count: count() }).from(user).where(eq(user.isPremium, true));

	const currentSubjects = await db.select({ count: count() }).from(subject);

	const currentRevenue = await db
		.select({ total: sql<number>`COALESCE(CAST(SUM(${transaction.grossAmount}) AS FLOAT), 0)` })
		.from(transaction)
		.where(and(eq(transaction.status, "success"), gte(transaction.paidAt, currentMonthStart)));

	const lastMonthUsers = await db.select({ count: count() }).from(user).where(gte(user.createdAt, lastMonthStart));

	const lastMonthPremium = await db
		.select({ count: count() })
		.from(user)
		.where(and(eq(user.isPremium, true), gte(user.premiumExpiresAt, lastMonthStart)));

	const lastMonthSubjects = await db
		.select({ count: count() })
		.from(subject)
		.where(gte(subject.createdAt, lastMonthStart));

	const lastMonthRevenue = await db
		.select({ total: sql<number>`COALESCE(CAST(SUM(${transaction.grossAmount}) AS FLOAT), 0)` })
		.from(transaction)
		.where(and(eq(transaction.status, "success"), gte(transaction.paidAt, lastMonthStart)));

	return {
		totalUsers: currentUsers[0]?.count ?? 0,
		premiumUsers: currentPremium[0]?.count ?? 0,
		activeSubjects: currentSubjects[0]?.count ?? 0,
		monthlyRevenue: currentRevenue[0]?.total ?? 0,
		usersTrend:
			(lastMonthUsers[0]?.count ?? 0) > 0
				? (((currentUsers[0]?.count ?? 0) - (lastMonthUsers[0]?.count ?? 0)) / (lastMonthUsers[0]?.count ?? 1)) * 100
				: 0,
		premiumTrend:
			(lastMonthPremium[0]?.count ?? 0) > 0
				? (((currentPremium[0]?.count ?? 0) - (lastMonthPremium[0]?.count ?? 0)) / (lastMonthPremium[0]?.count ?? 1)) *
					100
				: 0,
		subjectsTrend:
			(lastMonthSubjects[0]?.count ?? 0) > 0
				? (((currentSubjects[0]?.count ?? 0) - (lastMonthSubjects[0]?.count ?? 0)) /
						(lastMonthSubjects[0]?.count ?? 1)) *
					100
				: 0,
		revenueTrend:
			(lastMonthRevenue[0]?.total ?? 0) > 0
				? (((currentRevenue[0]?.total ?? 0) - (lastMonthRevenue[0]?.total ?? 0)) / (lastMonthRevenue[0]?.total ?? 1)) *
					100
				: 0,
	};
});

export const adminDashboardRouter = {
	stats,
};
