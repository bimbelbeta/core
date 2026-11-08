import { authedImplementer } from "@/lib/router-definition";
import { bareImplementer, baseImplementer } from "@/lib/router-definition/base";
import { transactionService } from "./composition";
import { AlreadyPremiumError } from "./errors";

const pub = baseImplementer;
const authed = authedImplementer;

const translateAlreadyPremium = bareImplementer.middleware(async function translateAlreadyPremium({ next, errors }) {
	try {
		return await next();
	} catch (error) {
		if (error instanceof AlreadyPremiumError) throw errors.UNPROCESSABLE_CONTENT({ message: error.message });
		throw error;
	}
});

const subscribe = authed
	.use(translateAlreadyPremium)
	.transaction.subscribe.handler(async ({ input, context }) =>
		transactionService.subscribe(input.slug, context.session.user),
	);

const notification = pub.transaction.notification.handler(async ({ input }) =>
	transactionService.processNotification(input, new Date()),
);

const status = authed.transaction.status.handler(async ({ input, context }) =>
	transactionService.status(input.orderId, context.session.user),
);

export const transactionRouter = {
	subscribe,
	notification,
	status,
};
