import type { CreditRepository } from "@/features/credit/repository";
import type { UserRepository } from "@/features/user/repository";
import type { TransactionRepository } from "./repository";
import type { PurchaseBenefits, Settlement, TransactionWithProduct } from "./types";

export interface ProcessSuccessfulTransactionOpts {
	repository: Pick<TransactionRepository, "claimOrder">;
	userRepository: Pick<UserRepository, "grantPremium">;
	creditRepository: Pick<CreditRepository, "grantPurchasedCredits">;
	orderId: string;
	userId: string;
	existingTransaction: TransactionWithProduct;
	purchaseDate: Date;
	benefits: PurchaseBenefits;
	settlement: Settlement;
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
	repository,
	userRepository,
	creditRepository,
	orderId,
	userId,
	existingTransaction,
	purchaseDate,
	benefits,
	settlement,
}: ProcessSuccessfulTransactionOpts): Promise<boolean> {
	const claimed = await repository.claimOrder(orderId, { purchaseDate, settlement });

	if (!claimed) return false;

	if (benefits.grantsPremium && benefits.premiumExpiry) {
		await userRepository.grantPremium(userId, benefits.premiumExpiry);
	}

	if (benefits.grantsCredits && benefits.creditsToAdd) {
		await creditRepository.grantPurchasedCredits({
			userId,
			transactionId: orderId,
			amount: benefits.creditsToAdd,
			note: `Purchased ${existingTransaction.prodSlug}`,
		});
	}

	return true;
}
