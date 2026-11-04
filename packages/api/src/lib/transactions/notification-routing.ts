import type { PaymentStatus, PurchaseBenefits, TransactionWithProduct } from "@/lib/transactions/types";

export type NotificationOutcome =
	| { action: "already_processed" }
	| { action: "not_found" }
	| { action: "user_deleted" }
	| { action: "process_success"; userId: string; benefits: PurchaseBenefits }
	| { action: "update_status"; status: "failed" | "pending" }
	| { action: "noop" };

/**
 * Decides what a payment notification should do, without touching the database.
 *
 * Pure so the decision table can be tested directly: unknown orders and already-paid orders are
 * ignored, a paid status grants benefits once, failed and pending statuses only update the stored
 * status, and anything else is a no-op.
 *
 * @returns The single action to take, including the benefits to grant when the payment is paid.
 */
export function resolveNotificationOutcome(
	status: PaymentStatus,
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

	if (status === "paid") {
		const userId = existingTransaction.tx.userId;
		if (!userId) {
			return { action: "user_deleted" };
		}
		const benefits = calcBenefits(existingTransaction, purchaseDate);
		return { action: "process_success", userId, benefits };
	}

	if (status === "failed") {
		return { action: "update_status", status: "failed" };
	}

	if (status === "pending") {
		return { action: "update_status", status: "pending" };
	}

	return { action: "noop" };
}
