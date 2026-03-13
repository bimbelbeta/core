import { adminCreditContract } from "./credit.contract";
import { adminDashboardContract } from "./dashboard.contract";
import { adminProductContract } from "./product.contract";
import { adminQuestionContract } from "./question.contract";
import { adminSubjectContract } from "./subject.contract";
import { adminSubtestContract } from "./subtest.contract";
import { adminSubtestQuestionContract } from "./subtest-question.contract";
import { adminTryoutContract } from "./tryout.contract";
import { adminUniversityContract } from "./university";
import { adminUsersContract } from "./users.contract";

export const adminContract = {
	dashboard: adminDashboardContract,
	credit: adminCreditContract,
	users: adminUsersContract,
	products: adminProductContract,
	subject: adminSubjectContract,
	tryout: {
		...adminTryoutContract,
		subtest: adminSubtestContract,
		questions: adminQuestionContract,
		questionsBulk: adminSubtestQuestionContract,
	},
	university: adminUniversityContract,
};
