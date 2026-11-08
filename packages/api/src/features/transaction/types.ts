import type { productVariantEnum, transaction } from "@bimbelbeta/db/schema/transaction";
import type { PaymentEvent } from "./failures";

export type TransactionWithProduct = {
	tx: typeof transaction.$inferSelect;
	prodSlug: string;
	prodVariant: (typeof productVariantEnum.enumValues)[number];
	prodFixedExpiryMonth: number | null;
	prodFixedExpiryDay: number | null;
	prodDurationDays: number | null;
	prodCredits: number | null;
};

export type PurchaseBenefits = {
	grantsPremium: boolean;
	grantsCredits: boolean;
	premiumExpiry: Date | null;
	creditsToAdd: number | null;
};

export type Settlement = {
	providerTransactionId: string | null;
	amountPaid: string | null;
	paymentMethod: string | null;
};

/** What the provider reported as actually settled, in column form. */
export function settlementColumns(event: PaymentEvent): Settlement {
	return {
		providerTransactionId: event.providerTransactionId ?? null,
		amountPaid: event.amountPaid ?? null,
		paymentMethod: event.paymentMethod ?? null,
	};
}

/** Provider-independent payment state. `unknown` means "do not act on this" rather than "error". */
export type PaymentStatus = "paid" | "pending" | "failed" | "unknown";

export type CheckoutInput = {
	orderId: string;
	amount: string;
	description: string;
	customer: { name: string; email: string };
	returnUrl?: string;
	expiresAt: Date;
};

export type Checkout = {
	provider: string;
	redirectUrl: string;
	token?: string;
};

/**
 * The port a payment gateway must satisfy.
 *
 * Swapping providers means writing one of these, not editing the subscription or notification
 * services. `verifyNotification` may throw a configuration error, which the procedure treats as
 * a server fault rather than a forged webhook.
 */
export type PaymentProvider<TNotification> = {
	name: string;
	createCheckout(input: CheckoutInput): Promise<Checkout>;
	verifyNotification(payload: TNotification): boolean;
	fetchStatus(orderId: string): Promise<PaymentEvent>;
};
