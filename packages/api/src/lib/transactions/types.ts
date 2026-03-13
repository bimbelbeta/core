import type { transaction } from "@bimbelbeta/db/schema/transaction";

export type TransactionWithProduct = {
	tx: typeof transaction.$inferSelect;
	prodSlug: string;
	prodVariant: string;
	prodFixedExpiryMonth: number | null;
	prodFixedExpiryDay: number | null;
	prodDurationDays: number | null;
	prodCredits: number | null;
};

export type MidtransStatus = {
	transaction_status: string;
	fraud_status: string;
};

export type PurchaseBenefits = {
	grantsPremium: boolean;
	grantsCredits: boolean;
	premiumExpiry: Date | null;
	creditsToAdd: number | null;
};
