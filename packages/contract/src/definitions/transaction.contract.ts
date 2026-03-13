import { type } from "arktype";
import { oc } from "../lib/contract-definition";

const SubscribeOutputSchema = type({
	token: "string",
	redirectUrl: "string",
});

const NotificationOutputSchema = type({
	status: "string",
});

const GetStatusOutputSchema = type({
	status: "string",
	paidAt: "string | null",
});

export const transactionContract = {
	subscribe: oc
		.route({
			path: "/transactions/subscribe",
			method: "POST",
			tags: ["Payment", "Subscription"],
		})
		.input(type({ slug: "string" }))
		.output(SubscribeOutputSchema),

	notification: oc
		.route({
			path: "/transactions/notification",
			method: "POST",
			tags: ["Payment", "Webhook"],
		})
		.input(type({}))
		.output(NotificationOutputSchema),

	status: oc
		.route({
			path: "/transactions/status",
			method: "GET",
			tags: ["Payment"],
		})
		.input(type({ orderId: "string" }))
		.output(GetStatusOutputSchema),
};
