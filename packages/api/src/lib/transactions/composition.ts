import { db } from "@bimbelbeta/db";
import { createNotificationService } from "@/lib/transactions/notification.service";
import { processSuccessfulTransaction } from "@/lib/transactions/processor";
import { midtransProvider } from "@/lib/transactions/providers/midtrans";
import { paymentRepository } from "@/lib/transactions/repository";
import { createSubscriptionService } from "@/lib/transactions/subscription.service";

const appOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";

export const verifyNotification = midtransProvider.verifyNotification;

export const subscriptionService = createSubscriptionService({
	repository: paymentRepository,
	createCheckout: (input) => midtransProvider.createCheckout({ ...input, returnUrl: `${appOrigin}/premium` }),
});

export const notificationService = createNotificationService({
	fetchStatus: midtransProvider.fetchStatus,
	find: paymentRepository.findTransactionWithProduct,
	updateStatus: paymentRepository.updateStatus,
	process: (options) => db.transaction((trx) => processSuccessfulTransaction({ ...options, trx })),
});
