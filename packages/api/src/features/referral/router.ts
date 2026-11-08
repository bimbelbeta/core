import { authedImplementer } from "@/lib/router-definition";
import { referralService } from "./service";

const authed = authedImplementer;

const redeem = authed.referral.redeem.handler(async ({ input, context }) =>
	referralService.redeem(input, context.session.user),
);

export const referralRouter = {
	redeem,
};
