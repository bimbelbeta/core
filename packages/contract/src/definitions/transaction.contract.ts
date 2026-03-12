import { type } from "arktype";
import { oc } from "../lib/contract-definition";

const SubscribeInputSchema = type({
	slug: "string",
});

const SubscribeOutputSchema = type({
	token: "string",
	redirectUrl: "string",
});

const NotificationInputSchema = type({});

const NotificationOutputSchema = type({
	status: "string",
});

const GetStatusInputSchema = type({
	orderId: "string",
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
		.input(SubscribeInputSchema)
		.output(SubscribeOutputSchema),

	notification: oc
		.route({
			path: "/transactions/notification",
			method: "POST",
			tags: ["Payment", "Webhook"],
		})
		.input(NotificationInputSchema)
		.output(NotificationOutputSchema),

	getStatus: oc
		.route({
			path: "/transactions/status",
			method: "GET",
			tags: ["Payment"],
		})
		.input(GetStatusInputSchema)
		.output(GetStatusOutputSchema),
};
