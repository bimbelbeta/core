import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { question } from "@bimbelbeta/db/schema/question";
import { transaction } from "@bimbelbeta/db/schema/transaction";
import { tryout, tryoutAttempt, tryoutSubtest } from "@bimbelbeta/db/schema/tryout";
import { and, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import { adminImplementer } from "@/lib/router-definition";

const admin = adminImplementer;

const stats = admin.admin.dashboard.stats.handler(async () => {
	const now = new Date();
	const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

	const [userStats] = await db
		.select({
			totalUsers: count(),
			premiumUsers: sql<number>`count(*) filter (where ${user.isPremium})`.mapWith(Number),
			usersBeforeThisMonth: sql<number>`count(*) filter (where ${user.createdAt} < ${currentMonthStart})`.mapWith(
				Number,
			),
		})
		.from(user);

	const revenueTotal = sql<number>`COALESCE(CAST(SUM(${transaction.grossAmount}) AS FLOAT), 0)`;
	const [currentRevenue] = await db
		.select({ total: revenueTotal })
		.from(transaction)
		.where(and(eq(transaction.status, "success"), gte(transaction.paidAt, currentMonthStart)));

	const [lastMonthRevenue] = await db
		.select({ total: revenueTotal })
		.from(transaction)
		.where(
			and(
				eq(transaction.status, "success"),
				gte(transaction.paidAt, lastMonthStart),
				lt(transaction.paidAt, currentMonthStart),
			),
		);

	const [questionsRow, essaysRow, recentTryouts] = await Promise.all([
		db.select({ count: count() }).from(question),
		db.select({ count: count() }).from(question).where(eq(question.type, "essay")),
		db
			.select({
				id: tryout.id,
				title: tryout.title,
				status: tryout.status,
				category: tryout.category,
				updatedAt: tryout.updatedAt,
				subtestCount:
					sql<number>`(select count(*) from ${tryoutSubtest} where ${tryoutSubtest.tryoutId} = ${tryout.id})`.mapWith(
						Number,
					),
				attemptCount:
					sql<number>`(select count(*) from ${tryoutAttempt} where ${tryoutAttempt.tryoutId} = ${tryout.id})`.mapWith(
						Number,
					),
			})
			.from(tryout)
			.orderBy(desc(tryout.updatedAt))
			.limit(6),
	]);

	const totalUsers = userStats?.totalUsers ?? 0;
	const usersBeforeThisMonth = userStats?.usersBeforeThisMonth ?? 0;
	const currentRevenueTotal = currentRevenue?.total ?? 0;
	const lastMonthRevenueTotal = lastMonthRevenue?.total ?? 0;

	return {
		totalUsers,
		premiumUsers: userStats?.premiumUsers ?? 0,
		monthlyRevenue: currentRevenueTotal,
		usersTrend: usersBeforeThisMonth > 0 ? ((totalUsers - usersBeforeThisMonth) / usersBeforeThisMonth) * 100 : null,
		revenueTrend:
			lastMonthRevenueTotal > 0 ? ((currentRevenueTotal - lastMonthRevenueTotal) / lastMonthRevenueTotal) * 100 : null,
		totalQuestions: questionsRow[0]?.count ?? 0,
		essayQuestions: essaysRow[0]?.count ?? 0,
		recentTryouts: recentTryouts.map((tryout) => ({
			...tryout,
			updatedAt: tryout.updatedAt?.toISOString() ?? null,
		})),
	};
});

export const adminDashboardRouter = {
	stats,
};
