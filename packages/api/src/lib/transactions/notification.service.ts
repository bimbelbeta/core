import { db } from "@bimbelbeta/db";
import { calculatePurchaseBenefits } from "@/lib/transactions/benefits";
import { toPaymentErrorCode } from "@/lib/transactions/errors";
import { resolveNotificationOutcome } from "@/lib/transactions/notification-routing";
import { processSuccessfulTransaction } from "@/lib/transactions/processor";
import { midtransProvider } from "@/lib/transactions/providers/midtrans";
import { paymentRepository } from "@/lib/transactions/repository";
import type { PaymentStatus } from "@/lib/transactions/types";

const dependencies = {
	fetchStatus: midtransProvider.fetchStatus,
	find: paymentRepository.findTransactionWithProduct,
	updateStatus: paymentRepository.updateStatus,
	process: async (options: Omit<Parameters<typeof processSuccessfulTransaction>[0], "trx">) =>
		db.transaction((trx) => processSuccessfulTransaction({ ...options, trx })),
};

export const createNotificationService = (deps: typeof dependencies) => ({
	async process(orderId: string, purchaseDate: Date) {
		let status: PaymentStatus;
		try {
			status = await deps.fetchStatus(orderId);
		} catch (error) {
			return { status: "verification_failed", reason: toPaymentErrorCode(error) } as const;
		}

		const existingTransaction = await deps.find(orderId);
		const outcome = resolveNotificationOutcome(status, existingTransaction, purchaseDate, calculatePurchaseBenefits);

		if (outcome.action === "not_found" || outcome.action === "already_processed" || outcome.action === "user_deleted") {
			return { status: outcome.action } as const;
		}

		if (outcome.action === "process_success" && existingTransaction) {
			const applied = await deps
				.process({ orderId, userId: outcome.userId, existingTransaction, purchaseDate, benefits: outcome.benefits })
				.catch(() => null);
			if (applied === null) return { status: "processing_failed" } as const;
			if (!applied) return { status: "already_processed" } as const;
		} else if (outcome.action === "update_status") {
			const updated = await deps.updateStatus(orderId, outcome.status).then(
				() => true,
				() => false,
			);
			if (!updated) return { status: "update_failed" } as const;
		}

		return { status: "ok" } as const;
	},
});

export const notificationService = createNotificationService(dependencies);
