import { oc } from "@bimbelbeta/contract";
import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { creditTransaction } from "@bimbelbeta/db/schema/credit";
import { product, transaction } from "@bimbelbeta/db/schema/transaction";
import { eq, sql } from "drizzle-orm";

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

/**
 * Calculate expiry date for fixed-date variant.
 * If purchased before the fixed date this year → expires this year
 * If purchased after the fixed date this year → expires next year
 */
function calculateFixedDateExpiry(purchaseDate: Date, month: number, day: number): Date {
	const currentYear = purchaseDate.getFullYear();
	const thisYearExpiry = new Date(currentYear, month - 1, day);

	if (purchaseDate > thisYearExpiry) {
		return new Date(currentYear + 1, month - 1, day);
	}

	return thisYearExpiry;
}

/**
 * Calculate expiry date for monthly variant.
 * Adds duration days to the purchase date.
 */
function calculateMonthlyExpiry(purchaseDate: Date, durationDays: number): Date {
	const expiry = new Date(purchaseDate);
	expiry.setDate(expiry.getDate() + durationDays);
	return expiry;
}

/**
 * Verify transaction status with Midtrans API.
 */
export async function verifyMidtransTransaction(orderId: string): Promise<MidtransStatus> {
	const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
	const auth = Buffer.from(`${serverKey}:`).toString("base64");

	const statusResponse = await fetch(
		`https://api${process.env.NODE_ENV === "production" ? "" : ".sandbox"}.midtrans.com/v2/${orderId}/status`,
		{
			headers: {
				Authorization: `Basic ${auth}`,
				"Content-Type": "application/json",
			},
		},
	);

	if (!statusResponse.ok) {
		console.error(`Midtrans API error: ${statusResponse.status}`);
		throw oc.INTERNAL_SERVER_ERROR({
			message: "Failed to verify transaction status",
		});
	}

	return statusResponse.json() as Promise<MidtransStatus>;
}

/**
 * Fetch transaction with associated product details from database.
 */
export async function fetchTransactionWithProduct(orderId: string): Promise<TransactionWithProduct | null> {
	const [result] = await db
		.select({
			tx: transaction,
			prodSlug: product.slug,
			prodVariant: product.variant,
			prodFixedExpiryMonth: product.fixedExpiryMonth,
			prodFixedExpiryDay: product.fixedExpiryDay,
			prodDurationDays: product.durationDays,
			prodCredits: product.credits,
		})
		.from(transaction)
		.innerJoin(product, eq(transaction.productId, product.id))
		.where(eq(transaction.id, orderId))
		.limit(1);

	return result || null;
}

/**
 * Calculate benefits to grant based on product variant.
 */
export function calculatePurchaseBenefits(
	existingTransaction: TransactionWithProduct,
	purchaseDate: Date,
): PurchaseBenefits {
	const variant = existingTransaction.prodVariant;
	let premiumExpiry: Date | null = null;

	if (variant === "fixed_date") {
		const month = existingTransaction.prodFixedExpiryMonth!;
		const day = existingTransaction.prodFixedExpiryDay!;
		premiumExpiry = calculateFixedDateExpiry(purchaseDate, month, day);
	} else if (variant === "monthly") {
		const days = existingTransaction.prodDurationDays!;
		premiumExpiry = calculateMonthlyExpiry(purchaseDate, days);
	}

	const grantsPremium = variant === "fixed_date" || variant === "monthly";
	const grantsCredits = existingTransaction.prodCredits && existingTransaction.prodCredits > 0;
	const creditsToAdd = grantsCredits ? existingTransaction.prodCredits : null;

	return {
		grantsPremium,
		grantsCredits: !!grantsCredits,
		premiumExpiry,
		creditsToAdd,
	};
}

/**
 * Process successful transaction by granting premium access and credits.
 */
export async function processSuccessfulTransaction(
	trx: Parameters<Parameters<typeof db.transaction>[0]>[0],
	orderId: string,
	userId: string,
	existingTransaction: TransactionWithProduct,
	purchaseDate: Date,
	benefits: PurchaseBenefits,
): Promise<void> {
	await trx
		.update(transaction)
		.set({
			status: "success",
			paidAt: purchaseDate,
		})
		.where(eq(transaction.id, orderId));

	if (benefits.grantsPremium && benefits.premiumExpiry) {
		await trx
			.update(user)
			.set({ isPremium: true, premiumExpiresAt: benefits.premiumExpiry })
			.where(eq(user.id, userId));
	}

	if (benefits.grantsCredits && benefits.creditsToAdd) {
		const creditsToAdd = benefits.creditsToAdd;

		const [updatedUser] = await trx
			.update(user)
			.set({
				tryoutCredits: sql`${user.tryoutCredits} + ${creditsToAdd}`,
			})
			.where(eq(user.id, userId))
			.returning({ tryoutCredits: user.tryoutCredits });

		await trx.insert(creditTransaction).values({
			userId: userId,
			transactionId: orderId,
			amount: creditsToAdd,
			balanceAfter: updatedUser?.tryoutCredits ?? creditsToAdd,
			note: `Purchased ${existingTransaction.prodSlug}`,
		});
	}
}

/**
 * Update transaction status to failed or pending.
 */
export async function updateTransactionStatus(orderId: string, status: "failed" | "pending"): Promise<void> {
	await db.update(transaction).set({ status }).where(eq(transaction.id, orderId));
}
