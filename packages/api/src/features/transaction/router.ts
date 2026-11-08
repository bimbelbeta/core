import { authedImplementer } from "@/lib/router-definition";
import { baseImplementer } from "@/lib/router-definition/base";
import { transactionService } from "./composition";

const pub = baseImplementer;
const authed = authedImplementer;

const subscribe = authed.transaction.subscribe.handler(async ({ input, context }) =>
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
