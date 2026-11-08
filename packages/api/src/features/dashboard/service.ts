import { db } from "@bimbelbeta/db";
import { createDashboardRepository, type DashboardRepository } from "./repository";

function monthStart(now: Date, monthOffset: number) {
	return new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
}

export function createDashboardService({ repository }: { repository: DashboardRepository }) {
	return {
		async stats() {
			const now = new Date();
			const currentMonthStart = monthStart(now, 0);
			const lastMonthStart = monthStart(now, 1);

			const [userCounts, questionCounts, monthlyRevenue, lastMonthRevenue, recentTryouts] = await Promise.all([
				repository.userCounts(lastMonthStart),
				repository.questionCounts(),
				repository.successfulRevenueSince(currentMonthStart),
				repository.successfulRevenueSince(lastMonthStart, currentMonthStart),
				repository.recentTryouts(6),
			]);

			const totalUsers = userCounts?.total ?? 0;
			const currentRevenue = monthlyRevenue?.total ?? 0;
			const previousRevenue = lastMonthRevenue?.total ?? 0;
			const usersBeforeThisMonth = totalUsers - (userCounts?.createdSince ?? 0);

			return {
				totalUsers,
				premiumUsers: userCounts?.premium ?? 0,
				monthlyRevenue: currentRevenue,
				usersTrend:
					usersBeforeThisMonth > 0 ? ((totalUsers - usersBeforeThisMonth) / usersBeforeThisMonth) * 100 : null,
				revenueTrend: previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : null,
				totalQuestions: questionCounts.total,
				essayQuestions: questionCounts.essay,
				recentTryouts: recentTryouts.map((tryout) => ({
					...tryout,
					updatedAt: tryout.updatedAt?.toISOString() ?? null,
				})),
			};
		},
	};
}

export const dashboardService = createDashboardService({
	repository: createDashboardRepository(db),
});
