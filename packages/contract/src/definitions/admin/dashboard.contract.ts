import { type } from "arktype";
import { oc } from "../../lib/contract-definition";

const DashboardStatsSchema = type({
	totalUsers: "number",
	premiumUsers: "number",
	activeSubjects: "number",
	monthlyRevenue: "number",
	usersTrend: "number",
	premiumTrend: "number",
	subjectsTrend: "number",
	revenueTrend: "number",
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
