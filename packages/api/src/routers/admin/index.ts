import { adminCreditRouter } from "@/features/credit/admin-router";
import { adminProductRouter } from "@/features/product/admin-router";
import { questionAdminRouter } from "@/features/question/admin-router";
import { adminSubjectRouter } from "@/features/subject/admin-router";
import { adminContentRouter } from "@/routers/admin/content";
import { adminDashboardRouter } from "@/routers/admin/dashboard";
import { adminReferralRouter } from "@/routers/admin/referral";
import { subtestRouter } from "@/routers/admin/subtest";
import { subtestQuestionRouter } from "@/routers/admin/subtest-question";
import { tryoutRouter } from "@/routers/admin/tryout";
import { adminUniversityRouter } from "@/routers/admin/university";
import { usersRouter } from "@/routers/admin/users";

export const adminRouter = {
	dashboard: adminDashboardRouter,
	subject: adminSubjectRouter,
	content: adminContentRouter,
	tryout: {
		...tryoutRouter,
		subtest: subtestRouter,
		questions: questionAdminRouter,
		questionsBulk: subtestQuestionRouter,
	},
	university: adminUniversityRouter,
	credit: adminCreditRouter,
	users: usersRouter,
	products: adminProductRouter,
	referral: adminReferralRouter,
};

export type { adminContentRouter } from "@/routers/admin/content";
export type { adminDashboardRouter } from "@/routers/admin/dashboard";
export type { adminUniversityRouter } from "@/routers/admin/university";
export type { adminSubjectRouter };
