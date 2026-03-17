import type { MidtransFraudStatus, MidtransTransactionStatus, PurchaseBenefits, TransactionWithProduct } from "./types";

export type NotificationOutcome =
	| { action: "already_processed" }
	| { action: "not_found" }
	| { action: "user_deleted" }
	| { action: "process_success"; userId: string; benefits: PurchaseBenefits }
	| { action: "update_status"; status: "failed" | "pending" }
	| { action: "noop" };

/**
 * Pure function that determines what action to take for a Midtrans webhook
 * notification based on transaction status, fraud status, and existing state.
 * Extracted for testability — all I/O is handled by the caller.
 */
export function resolveNotificationOutcome(
	transactionStatus: MidtransTransactionStatus,
	fraudStatus: MidtransFraudStatus,
	existingTransaction: TransactionWithProduct | null,
	purchaseDate: Date,
	calcBenefits: (tx: TransactionWithProduct, date: Date) => PurchaseBenefits,
): NotificationOutcome {
	if (!existingTransaction) {
		return { action: "not_found" };
	}

	if (existingTransaction.tx.paidAt) {
		return { action: "already_processed" };
	}

	if (transactionStatus === "settlement" || (transactionStatus === "capture" && fraudStatus === "accept")) {
		const userId = existingTransaction.tx.userId;
		if (!userId) {
			return { action: "user_deleted" };
		}
		const benefits = calcBenefits(existingTransaction, purchaseDate);
		return { action: "process_success", userId, benefits };
	}

	if (transactionStatus === "cancel" || transactionStatus === "deny" || transactionStatus === "expire") {
		return { action: "update_status", status: "failed" };
	}

	if (transactionStatus === "pending") {
		return { action: "update_status", status: "pending" };
	}

	return { action: "noop" };
}
