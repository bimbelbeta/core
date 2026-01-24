import { adminCreditRouter } from "./credit";
import { adminDashboardRouter } from "./dashboard";
import { questionRouter } from "./question";
import { adminSubjectRouter } from "./subject";
import { subtestRouter } from "./subtest";
import { subtestQuestionRouter } from "./subtest-question";
import { tryoutRouter } from "./tryout";
import { adminUniversityRouter } from "./university";
import { usersRouter } from "./users";

export const adminRouter = {
	dashboard: adminDashboardRouter,
	subject: adminSubjectRouter,
	tryout: {
		...tryoutRouter,
		subtest: subtestRouter,
		questions: questionRouter,
		questionsBulk: subtestQuestionRouter,
	},
	university: adminUniversityRouter,
	credit: adminCreditRouter,
	users: usersRouter,
};

export type { adminDashboardRouter } from "./dashboard";
export type { adminSubjectRouter } from "./subject";
export type { adminUniversityRouter } from "./university";
