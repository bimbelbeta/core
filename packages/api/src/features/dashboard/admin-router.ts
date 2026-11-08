import { adminImplementer } from "@/lib/router-definition";
import { dashboardService } from "./service";

const admin = adminImplementer;

const stats = admin.admin.dashboard.stats.handler(async () => dashboardService.stats());

export const adminDashboardRouter = {
	stats,
};
