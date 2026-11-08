import { adminImplementer } from "@/lib/router-definition";
import { tryoutAdminService } from "./admin.service";

const admin = adminImplementer;

const create = admin.admin.tryout.create.handler(async ({ input }) => tryoutAdminService.create(input));

const list = admin.admin.tryout.list.handler(async ({ input }) => tryoutAdminService.list(input));

const find = admin.admin.tryout.find.handler(async ({ input }) => tryoutAdminService.find(input));

const update = admin.admin.tryout.update.handler(async ({ input }) => tryoutAdminService.update(input));

const remove = admin.admin.tryout.remove.handler(async ({ input }) => tryoutAdminService.remove(input));

const listAccessCodes = admin.admin.tryout.listAccessCodes.handler(async ({ input }) =>
	tryoutAdminService.listAccessCodes(input),
);

const createAccessCode = admin.admin.tryout.createAccessCode.handler(async ({ input }) =>
	tryoutAdminService.createAccessCode(input),
);

const updateAccessCodeStatus = admin.admin.tryout.updateAccessCodeStatus.handler(async ({ input }) =>
	tryoutAdminService.updateAccessCodeStatus(input),
);

const listAttempts = admin.admin.tryout.attempts.list.handler(async ({ input }) =>
	tryoutAdminService.listAttempts(input),
);

const findSubtest = admin.admin.tryout.subtest.find.handler(async ({ input }) => tryoutAdminService.findSubtest(input));

const createSubtest = admin.admin.tryout.subtest.create.handler(async ({ input }) =>
	tryoutAdminService.createSubtest(input),
);

const updateSubtest = admin.admin.tryout.subtest.update.handler(async ({ input }) =>
	tryoutAdminService.updateSubtest(input),
);

const removeSubtest = admin.admin.tryout.subtest.remove.handler(async ({ input }) =>
	tryoutAdminService.removeSubtest(input),
);

const listQuestions = admin.admin.tryout.questionsBulk.list.handler(async ({ input }) =>
	tryoutAdminService.listSubtestQuestions(input),
);

const addQuestionToSubtest = admin.admin.tryout.questionsBulk.addQuestionToSubtest.handler(async ({ input }) =>
	tryoutAdminService.addQuestionToSubtest(input),
);

const bulkAddQuestionsToSubtest = admin.admin.tryout.questionsBulk.bulkAddQuestionsToSubtest.handler(
	async ({ input }) => tryoutAdminService.bulkAddQuestionsToSubtest(input),
);

const bulkRemoveQuestionsFromSubtest = admin.admin.tryout.questionsBulk.bulkRemoveQuestionsFromSubtest.handler(
	async ({ input }) => tryoutAdminService.bulkRemoveQuestionsFromSubtest(input),
);

const updateSubtestQuestionOrder = admin.admin.tryout.questionsBulk.updateSubtestQuestionOrder.handler(
	async ({ input }) => tryoutAdminService.updateSubtestQuestionOrder(input),
);

const removeQuestionFromSubtest = admin.admin.tryout.questionsBulk.removeQuestionFromSubtest.handler(
	async ({ input }) => tryoutAdminService.removeQuestionFromSubtest(input),
);

export const adminTryoutRouter = {
	create,
	list,
	find,
	update,
	remove,
	listAccessCodes,
	createAccessCode,
	updateAccessCodeStatus,
	attempts: {
		list: listAttempts,
	},
	subtest: {
		find: findSubtest,
		create: createSubtest,
		update: updateSubtest,
		remove: removeSubtest,
	},
	questionsBulk: {
		list: listQuestions,
		addQuestionToSubtest,
		bulkAddQuestionsToSubtest,
		bulkRemoveQuestionsFromSubtest,
		updateSubtestQuestionOrder,
		removeQuestionFromSubtest,
	},
};
