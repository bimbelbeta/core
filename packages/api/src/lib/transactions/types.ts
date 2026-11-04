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

export type PaymentProvider<TNotification> = {
	name: string;
	createCheckout(input: CheckoutInput): Promise<Checkout>;
	verifyNotification(payload: TNotification): boolean;
	fetchStatus(orderId: string): Promise<PaymentStatus>;
};
