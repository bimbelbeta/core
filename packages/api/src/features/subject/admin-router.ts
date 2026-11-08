import { adminImplementer } from "@/lib/router-definition";
import { subjectService } from "./service";

const admin = adminImplementer;

const create = admin.admin.subject.create.handler(async ({ input }) => subjectService.create(input));

const update = admin.admin.subject.update.handler(async ({ input }) => subjectService.update(input));

const remove = admin.admin.subject.remove.handler(async ({ input }) => subjectService.remove(input));

const reorder = admin.admin.subject.reorder.handler(async ({ input }) => subjectService.reorder(input));

export const adminSubjectRouter = {
	create,
	update,
	remove,
	reorder,
};
