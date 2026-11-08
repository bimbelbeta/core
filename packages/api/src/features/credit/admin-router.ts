import { superAdminImplementer } from "@/lib/router-definition";
import { creditService } from "./service";

const superadmin = superAdminImplementer;

const adjust = superadmin.admin.credit.adjust.handler(async ({ input }) => creditService.adjust(input));

const find = superadmin.admin.credit.find.handler(async ({ input }) => creditService.find(input));

export const adminCreditRouter = {
	adjust,
	find,
};
