import { authedNoPremiumImplementer } from "@/lib/router-definition";
import { creditService } from "./service";

const authed = authedNoPremiumImplementer;

const balance = authed.credit.balance.handler(async ({ context }) => creditService.balance(context.session.user));

const packages = authed.credit.packages.handler(async ({ input }) => creditService.packages(input));

export const creditRouter = {
	balance,
	packages,
};
