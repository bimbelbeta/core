import { db } from "@bimbelbeta/db";
import { createDashboardRepository, type DashboardRepository } from "./repository";

function monthStart(now: Date, monthOffset: number) {
	return new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
}

function trend(current: number, previous: number) {
	return previous > 0 ? ((current - previous) / previous) * 100 : 0;
}

export function createDashboardService({ repository }: { repository: DashboardRepository }) {
	return {
		async stats() {
			const now = new Date();
			const currentMonthStart = monthStart(now, 0);
			const lastMonthStart = monthStart(now, 1);

			const userCounts = await repository.userCounts(lastMonthStart);
			const subjectCount = await repository.subjectCount();
			const monthlyRevenue = await repository.successfulRevenueSince(currentMonthStart);
			const lastMonthRevenue = await repository.successfulRevenueSince(lastMonthStart);

			const totalUsers = userCounts?.total ?? 0;
			const premiumUsers = userCounts?.premium ?? 0;

			return {
				totalUsers,
				premiumUsers,
				activeSubjects: subjectCount?.count ?? 0,
				monthlyRevenue: monthlyRevenue?.total ?? 0,
				usersTrend: trend(totalUsers, userCounts?.createdSince ?? 0),
				premiumTrend: trend(premiumUsers, userCounts?.premiumExpiringSince ?? 0),
				subjectsTrend: 0,
				revenueTrend: trend(monthlyRevenue?.total ?? 0, lastMonthRevenue?.total ?? 0),
			};
		},
	};
}

export const dashboardService = createDashboardService({
	repository: createDashboardRepository(db),
});
