import { adminImplementer } from "@/lib/router-definition";
import { questionService } from "./service";

const admin = adminImplementer;

const create = admin.admin.tryout.questions.create.handler(async ({ input }) => {
	const { id } = await questionService.create(input);
	return { message: "Question berhasil dibuat", id };
});

const list = admin.admin.tryout.questions.list.handler(async ({ input }) => {
	return await questionService.list(input);
});

const find = admin.admin.tryout.questions.find.handler(async ({ input }) => {
	return await questionService.find(input);
});

const update = admin.admin.tryout.questions.update.handler(async ({ input }) => {
	await questionService.update(input);
	return { message: "Question berhasil diperbarui" };
});

const remove = admin.admin.tryout.questions.remove.handler(async ({ input }) => {
	await questionService.remove(input);
	return { message: "Question berhasil dihapus" };
});

const createChoice = admin.admin.tryout.questions.createChoice.handler(async ({ input }) => {
	const { id } = await questionService.createChoice(input);
	return { message: "Choice berhasil dibuat", id };
});

const updateChoice = admin.admin.tryout.questions.updateChoice.handler(async ({ input }) => {
	await questionService.updateChoice(input);
	return { message: "Choice berhasil diperbarui" };
});

const removeChoice = admin.admin.tryout.questions.removeChoice.handler(async ({ input }) => {
	await questionService.removeChoice(input);
	return { message: "Choice berhasil dihapus" };
});

export const questionAdminRouter = {
	create,
	list,
	find,
	update,
	remove,
	createChoice,
	updateChoice,
	removeChoice,
};
