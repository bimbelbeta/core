import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { subject } from "@bimbelbeta/db/schema/subject";
import { transaction } from "@bimbelbeta/db/schema/transaction";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { baseImplementer } from "@/lib/router-definition";
import { rateLimit, requireAdmin, requireAuth } from "@/lib/router-definition/middleware";

const admin = baseImplementer.use(requireAuth).use(rateLimit).use(requireAdmin);

const stats = admin.admin.dashboard.stats.handler(async () => {
	const now = new Date();
	const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

	const [result] = await db
		.select({
			totalUsers: count(),
			premiumUsers: count(eq(user.isPremium, true)),
			lastMonthUsers: count(gte(user.createdAt, lastMonthStart)),
			lastMonthPremium: count(and(eq(user.isPremium, true), gte(user.premiumExpiresAt, lastMonthStart))),
		})
		.from(user);

	const [currentSubjects] = await db.select({ count: count() }).from(subject);

	const [currentRevenue] = await db
		.select({
			total: sql<number>`COALESCE(CAST(SUM(${transaction.grossAmount}) AS FLOAT), 0)`,
		})
		.from(transaction)
		.where(and(eq(transaction.status, "success"), gte(transaction.paidAt, currentMonthStart)));

	const [lastMonthRevenue] = await db
		.select({
			total: sql<number>`COALESCE(CAST(SUM(${transaction.grossAmount}) AS FLOAT), 0)`,
		})
		.from(transaction)
		.where(and(eq(transaction.status, "success"), gte(transaction.paidAt, lastMonthStart)));

	const totalUsers = result?.totalUsers ?? 0;
	const premiumUsers = result?.premiumUsers ?? 0;
	const lastMonthUsers = result?.lastMonthUsers ?? 0;
	const lastMonthPremium = result?.lastMonthPremium ?? 0;

	return {
		totalUsers,
		premiumUsers,
		activeSubjects: currentSubjects?.count ?? 0,
		monthlyRevenue: currentRevenue?.total ?? 0,
		usersTrend: lastMonthUsers > 0 ? ((totalUsers - lastMonthUsers) / lastMonthUsers) * 100 : 0,
		premiumTrend: lastMonthPremium > 0 ? ((premiumUsers - lastMonthPremium) / lastMonthPremium) * 100 : 0,
		subjectsTrend: 0,
		revenueTrend:
			(lastMonthRevenue?.total ?? 0) > 0
				? (((currentRevenue?.total ?? 0) - (lastMonthRevenue?.total ?? 0)) / (lastMonthRevenue?.total ?? 1)) * 100
				: 0,
	};
});

export const adminDashboardRouter = {
	stats,
};
