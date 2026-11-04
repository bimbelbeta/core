import { db } from "@bimbelbeta/db";
import { calculatePurchaseBenefits } from "@/lib/transactions/benefits";
import { resolveNotificationOutcome } from "@/lib/transactions/notification-routing";
import { processSuccessfulTransaction } from "@/lib/transactions/processor";
import { fetchTransactionWithProduct } from "@/lib/transactions/products";
import { updateTransactionStatus } from "@/lib/transactions/status";
import { verifyMidtransTransaction } from "@/lib/transactions/verification";

const dependencies = {
	verify: verifyMidtransTransaction,
	find: fetchTransactionWithProduct,
	updateStatus: updateTransactionStatus,
	process: async (options: Omit<Parameters<typeof processSuccessfulTransaction>[0], "trx">) =>
		db.transaction((trx) => processSuccessfulTransaction({ ...options, trx })),
};

export const createNotificationService = (deps: typeof dependencies) => ({
	async process(orderId: string, purchaseDate: Date) {
		const verification = await deps.verify(orderId).catch(() => null);
		if (!verification) return { status: "verification_failed" } as const;

		const existingTransaction = await deps.find(orderId);
		const outcome = resolveNotificationOutcome(
			verification.transaction_status,
			verification.fraud_status,
			existingTransaction,
			purchaseDate,
			calculatePurchaseBenefits,
		);

		if (outcome.action === "not_found" || outcome.action === "already_processed" || outcome.action === "user_deleted") {
			return { status: outcome.action };
		}

		if (outcome.action === "process_success" && existingTransaction) {
			const processed = await deps
				.process({ orderId, userId: outcome.userId, existingTransaction, purchaseDate, benefits: outcome.benefits })
				.then(
					() => true,
					() => false,
				);
			if (!processed) return { status: "processing_failed" } as const;
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
