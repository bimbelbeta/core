import type { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { creditTransaction } from "@bimbelbeta/db/schema/credit";
import { transaction } from "@bimbelbeta/db/schema/transaction";
import { and, eq, isNull, sql } from "drizzle-orm";
import type { PurchaseBenefits, TransactionWithProduct } from "@/lib/transactions/types";

export interface ProcessSuccessfulTransactionOpts {
	trx: Parameters<Parameters<typeof db.transaction>[0]>[0];
	orderId: string;
	userId: string;
	existingTransaction: TransactionWithProduct;
	purchaseDate: Date;
	benefits: PurchaseBenefits;
}

/**
 * Applies everything a successful payment grants, inside the caller's transaction.
 *
 * The order is claimed first with a conditional update that only matches while `paid_at` is still
 * empty. That single conditional write is what makes repeated or concurrent notifications safe:
 * exactly one caller can claim the order, and the losers get `false` and grant nothing.
 *
 * After the claim, premium access and credits are written before the transaction commits, so a
 * failure part way through rolls back the claim too and the payment can be retried.
 *
 * @returns `true` when this call claimed and processed the order, `false` when another call
 * already had.
 */
export async function processSuccessfulTransaction({
	trx,
	orderId,
	userId,
	existingTransaction,
	purchaseDate,
	benefits,
}: ProcessSuccessfulTransactionOpts): Promise<boolean> {
	const claimed = await trx
		.update(transaction)
		.set({ status: "success", paidAt: purchaseDate })
		.where(and(eq(transaction.id, orderId), isNull(transaction.paidAt)))
		.returning({ id: transaction.id });

	if (claimed.length === 0) return false;

	if (benefits.grantsPremium && benefits.premiumExpiry) {
		await trx
			.update(user)
			.set({ isPremium: true, premiumExpiresAt: benefits.premiumExpiry })
			.where(eq(user.id, userId));
	}

	if (benefits.grantsCredits && benefits.creditsToAdd) {
		const creditsToAdd = benefits.creditsToAdd;

		const updatedUser = (
			await trx
				.update(user)
				.set({ tryoutCredits: sql`${user.tryoutCredits} + ${creditsToAdd}` })
				.where(eq(user.id, userId))
				.returning({ tryoutCredits: user.tryoutCredits })
		)[0]!;

		await trx.insert(creditTransaction).values({
			userId: userId,
			transactionId: orderId,
			amount: creditsToAdd,
			balanceAfter: updatedUser.tryoutCredits!,
			note: `Purchased ${existingTransaction.prodSlug}`,
		});
	}

	return true;
}
