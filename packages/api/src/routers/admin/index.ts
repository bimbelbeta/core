import { adminContentRouter } from "@/routers/admin/content";
import { adminCreditRouter } from "@/routers/admin/credit";
import { adminDashboardRouter } from "@/routers/admin/dashboard";
import { adminProductRouter } from "@/routers/admin/product";
import { questionRouter } from "@/routers/admin/question";
import { adminSubjectRouter } from "@/routers/admin/subject";
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
		questions: questionRouter,
		questionsBulk: subtestQuestionRouter,
	},
	university: adminUniversityRouter,
	credit: adminCreditRouter,
	users: usersRouter,
	products: adminProductRouter,
};

export type { adminContentRouter } from "@/routers/admin/content";
export type { adminDashboardRouter } from "@/routers/admin/dashboard";
export type { adminSubjectRouter } from "@/routers/admin/subject";
export type { adminUniversityRouter } from "@/routers/admin/university";
