import { adminContentRouter } from "@/features/content/admin-router";
import { adminCreditRouter } from "@/features/credit/admin-router";
import { adminDashboardRouter } from "@/features/dashboard/admin-router";
import { adminProductRouter } from "@/features/product/admin-router";
import { questionAdminRouter } from "@/features/question/admin-router";
import { adminReferralRouter } from "@/features/referral/admin-router";
import { adminSubjectRouter } from "@/features/subject/admin-router";
import { adminTryoutRouter } from "@/features/tryout/admin-router";
import { adminUniversityRouter } from "@/features/university/admin-router";
import { usersRouter } from "@/features/user/admin-router";

export const adminRouter = {
	dashboard: adminDashboardRouter,
	subject: adminSubjectRouter,
	content: adminContentRouter,
	tryout: {
		...adminTryoutRouter,
		questions: questionAdminRouter,
	},
	university: adminUniversityRouter,
	credit: adminCreditRouter,
	users: usersRouter,
	products: adminProductRouter,
	referral: adminReferralRouter,
};

export type { adminContentRouter } from "@/features/content/admin-router";
export type { adminDashboardRouter } from "@/features/dashboard/admin-router";
export type { adminUniversityRouter } from "@/features/university/admin-router";
export type { adminSubjectRouter };
