import { superAdminImplementer } from "@/lib/router-definition";
import { referralService } from "./service";

const superadmin = superAdminImplementer;

const list = superadmin.admin.referral.list.handler(async ({ input }) => referralService.list(input));

const create = superadmin.admin.referral.create.handler(async ({ input, context }) =>
	referralService.create(input, context.session.user),
);

const updateStatus = superadmin.admin.referral.updateStatus.handler(async ({ input }) =>
	referralService.updateStatus(input),
);

const bulkDeactivate = superadmin.admin.referral.bulkDeactivate.handler(async ({ input }) =>
	referralService.bulkDeactivate(input),
);

const getUsages = superadmin.admin.referral.getUsages.handler(async ({ input }) => referralService.getUsages(input));

export const adminReferralRouter = {
	list,
	create,
	updateStatus,
	bulkDeactivate,
	getUsages,
};
