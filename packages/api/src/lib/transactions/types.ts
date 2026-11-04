import type { productVariantEnum, transaction } from "@bimbelbeta/db/schema/transaction";

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

/** Provider-independent payment state. `unknown` means "do not act on this" rather than "error". */
export type PaymentStatus = "paid" | "pending" | "failed" | "unknown";

export type CheckoutInput = {
	orderId: string;
	amount: string;
	description: string;
	customer: { name: string; email: string };
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
	fetchStatus(orderId: string): Promise<PaymentStatus>;
};
