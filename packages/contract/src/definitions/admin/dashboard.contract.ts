import { type } from "arktype";
import { oc } from "@/lib/contract-definition";

const DashboardStatsSchema = type({
	totalUsers: "number",
	premiumUsers: "number",
	monthlyRevenue: "number",
	usersTrend: "number | null",
	revenueTrend: "number | null",
	totalQuestions: "number",
	essayQuestions: "number",
	recentTryouts: type(
		{
			id: "number",
			title: "string",
			status: "'draft' | 'published' | 'archived'",
			category: "'sd' | 'smp' | 'sma' | 'utbk'",
			updatedAt: "string | null",
			subtestCount: "number",
			attemptCount: "number",
		},
		"[]",
	),
});

export const adminDashboardContract = {
	stats: oc
		.route({
			path: "/admin/dashboard/stats",
			method: "GET",
			tags: ["Admin - Dashboard"],
		})
		.output(DashboardStatsSchema),
};
