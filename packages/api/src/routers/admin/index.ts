import { adminCreditRouter } from "@/features/credit/admin-router";
import { adminProductRouter } from "@/features/product/admin-router";
import { usersRouter } from "@/features/user/admin-router";
import { adminContentRouter } from "@/routers/admin/content";
import { adminDashboardRouter } from "@/routers/admin/dashboard";
import { questionRouter } from "@/routers/admin/question";
import { adminReferralRouter } from "@/routers/admin/referral";
import { adminSubjectRouter } from "@/routers/admin/subject";
import { subtestRouter } from "@/routers/admin/subtest";
import { subtestQuestionRouter } from "@/routers/admin/subtest-question";
import { tryoutRouter } from "@/routers/admin/tryout";
import { adminUniversityRouter } from "@/routers/admin/university";

export const adminRouter = {
	dashboard: adminDashboardRouter,
	subject: adminSubjectRouter,
	content: adminContentRouter,
	tryout: {
		...tryoutRouter,
		subtest: subtestRouter,
		questions: questionRouter,
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
export type { adminSubjectRouter } from "@/routers/admin/subject";
export type { adminUniversityRouter } from "@/routers/admin/university";
