import type { PaymentStatus, PurchaseBenefits, TransactionWithProduct } from "@/lib/transactions/types";

export type NotificationOutcome =
	| { action: "already_processed" }
	| { action: "not_found" }
	| { action: "user_deleted" }
	| { action: "process_success"; userId: string; benefits: PurchaseBenefits }
	| { action: "update_status"; status: "failed" | "pending" }
	| { action: "noop" };

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
