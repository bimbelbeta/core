import { adminCreditRouter } from "./credit";
import { adminDashboardRouter } from "./dashboard";
import { adminProductRouter } from "./product";
import { questionRouter } from "./question";
import { adminContentRouter, adminSubjectRouter } from "./subject";
import { subtestRouter } from "./subtest";
import { subtestQuestionRouter } from "./subtest-question";
import { tryoutRouter } from "./tryout";
import { adminUniversityRouter } from "./university";
import { usersRouter } from "./users";

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

export type { adminDashboardRouter } from "./dashboard";
export type { adminContentRouter, adminSubjectRouter } from "./subject";
export type { adminUniversityRouter } from "./university";
