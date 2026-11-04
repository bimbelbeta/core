import { type } from "arktype";
import { oc } from "@/lib/contract-definition";

const SubscribeOutputSchema = type({
	provider: "string",
	redirectUrl: "string",
	"token?": "string",
});

const NotificationOutputSchema = type({
	status: "string",
});

const GetStatusOutputSchema = type({
	status: "string",
	paidAt: "string | null",
});

const MidtransNotificationSchema = type({
	order_id: "string",
	status_code: "string",
	gross_amount: "string",
	signature_key: "string",
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
			path: "/transactions/notification/midtrans",
			method: "POST",
			tags: ["Payment", "Webhook"],
		})
		.input(MidtransNotificationSchema)
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
