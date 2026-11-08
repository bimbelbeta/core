import { authedNoPremiumImplementer } from "@/lib/router-definition";
import { userService } from "./service";

const authed = authedNoPremiumImplementer;

const findTarget = authed.userSettings.findTarget.handler(async ({ context }) => {
	return userService.getTarget(context.session.user);
});

const update = authed.userSettings.update.handler(async ({ input, context }) => {
	return userService.updateTarget(context.session.user, input);
});

export const userSettingsRouter = {
	findTarget,
	update,
};
