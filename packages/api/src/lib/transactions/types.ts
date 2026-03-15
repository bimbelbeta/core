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

export type MidtransTransactionStatus =
	| "capture"
	| "settlement"
	| "pending"
	| "deny"
	| "cancel"
	| "expire"
	| "refund"
	| "partial_refund"
	| "authorize";

export type MidtransFraudStatus = "accept" | "deny" | "challenge";

export type MidtransStatus = {
	transaction_status: MidtransTransactionStatus;
	fraud_status: MidtransFraudStatus;
};

export type PurchaseBenefits = {
	grantsPremium: boolean;
	grantsCredits: boolean;
	premiumExpiry: Date | null;
	creditsToAdd: number | null;
};
