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

	return true;
}
