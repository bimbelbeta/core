import { superAdminImplementer } from "@/lib/router-definition";
import { productService } from "./service";

const superadmin = superAdminImplementer;

const list = superadmin.admin.products.list.handler(async ({ input }) => productService.listForAdmin(input));

const find = superadmin.admin.products.find.handler(async ({ input }) => productService.find(input.productId));

const create = superadmin.admin.products.create.handler(async ({ input }) => productService.create(input));

const update = superadmin.admin.products.update.handler(async ({ input }) => productService.update(input));

const remove = superadmin.admin.products.remove.handler(async ({ input }) => productService.remove(input.productId));

const restore = superadmin.admin.products.restore.handler(async ({ input }) => productService.restore(input.productId));

export const adminProductRouter = {
	list,
	find,
	create,
	update,
	remove,
	restore,
};
