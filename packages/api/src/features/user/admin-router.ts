import { superAdminImplementer } from "@/lib/router-definition";
import { userService } from "./service";

const superadmin = superAdminImplementer;

const list = superadmin.admin.users.list.handler(async ({ input }) => {
	return userService.listUsers(input);
});

const find = superadmin.admin.users.find.handler(async ({ input }) => {
	return userService.findUser(input.userId);
});

const update = superadmin.admin.users.update.handler(async ({ input }) => {
	return userService.updateUser(input.userId, input);
});

const deleteBatch = superadmin.admin.users.deleteBatch.handler(async ({ input }) => {
	return userService.deleteUsers(input.userIds);
});

export const usersRouter = {
	list,
	find,
	update,
	deleteBatch,
};
