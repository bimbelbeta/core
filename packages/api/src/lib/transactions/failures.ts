import type { paymentFailureEnum } from "@bimbelbeta/db/schema/transaction";

export const paymentFailureCodes = [
	"insufficient_balance",
	"limit_exceeded",
	"card_declined",
	"fraud_rejected",
	"payment_expired",
	"payment_cancelled",
	"provider_error",
	"unknown",
] as const satisfies readonly (typeof paymentFailureEnum.enumValues)[number][];

export type PaymentFailureCode = (typeof paymentFailureEnum.enumValues)[number];

export type PaymentEvent = {
	status: "paid" | "pending" | "failed" | "unknown";
	failure?: PaymentFailureCode;
};
