import type { PaymentEvent, PaymentFailureCode } from "@/lib/transactions/failures";
import type { PurchaseBenefits, TransactionWithProduct } from "@/lib/transactions/types";

export type NotificationOutcome =
	| { action: "already_processed" }
	| { action: "user_deleted" }
	| { action: "process_success"; userId: string; benefits: PurchaseBenefits }
	| { action: "update_status"; status: "failed"; failure?: PaymentFailureCode; detail?: string }
	| { action: "update_status"; status: "pending" }
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
	event: PaymentEvent,
	existingTransaction: TransactionWithProduct,
	purchaseDate: Date,
	calcBenefits: (tx: TransactionWithProduct, date: Date) => PurchaseBenefits,
): NotificationOutcome {
	if (existingTransaction.tx.paidAt) {
		return { action: "already_processed" };
	}

	if (event.status === "paid") {
		const userId = existingTransaction.tx.userId;
		if (!userId) {
			return { action: "user_deleted" };
		}
		const benefits = calcBenefits(existingTransaction, purchaseDate);
		return { action: "process_success", userId, benefits };
	}

	if (event.status === "failed") {
		return { action: "update_status", status: "failed", failure: event.failure, detail: event.detail };
	}

	if (event.status === "pending") {
		return { action: "update_status", status: "pending" };
	}

	return { action: "noop" };
}
