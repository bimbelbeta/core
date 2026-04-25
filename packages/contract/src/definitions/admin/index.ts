import { adminCreditContract } from "@/definitions/admin/credit.contract";
import { adminDashboardContract } from "@/definitions/admin/dashboard.contract";
import { adminProductContract } from "@/definitions/admin/product.contract";
import { adminQuestionContract } from "@/definitions/admin/question.contract";
import { adminContentContract, adminSubjectContract } from "@/definitions/admin/subject.contract";
import { adminSubtestContract } from "@/definitions/admin/subtest.contract";
import { adminSubtestQuestionContract } from "@/definitions/admin/subtest-question.contract";
import { adminTryoutContract } from "@/definitions/admin/tryout.contract";
import { adminUniversityContract } from "@/definitions/admin/university";
import { adminUsersContract } from "@/definitions/admin/users.contract";

export const adminContract = {
	dashboard: adminDashboardContract,
	credit: adminCreditContract,
	users: adminUsersContract,
	products: adminProductContract,
	subject: adminSubjectContract,
	content: adminContentContract,
	tryout: {
		...adminTryoutContract,
		subtest: adminSubtestContract,
		questions: adminQuestionContract,
		questionsBulk: adminSubtestQuestionContract,
	},
	university: adminUniversityContract,
};
