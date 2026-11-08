import { db } from "@bimbelbeta/db";
import { createCreditRepository } from "@/features/credit/repository";
import { createProductRepository } from "@/features/product/repository";
import { createUserRepository } from "@/features/user/repository";
import { createNotificationService } from "./notification.service";
import { processSuccessfulTransaction } from "./processor";
import { midtransProvider } from "./providers/midtrans";
import { createTransactionRepository } from "./repository";
import { createTransactionService } from "./service";
import { createSubscriptionService } from "./subscription.service";

export const paymentRepository = createTransactionRepository(db);

export const subscriptionService = createSubscriptionService({
	productRepository: createProductRepository(db),
	repository: paymentRepository,
	providerName: midtransProvider.name,
	createCheckout: (input) =>
		midtransProvider.createCheckout({
			...input,
			returnUrl: `${process.env.CORS_ORIGIN || "http://localhost:3000"}/premium`,
		}),
});

export const notificationService = createNotificationService({
	fetchStatus: midtransProvider.fetchStatus,
	find: paymentRepository.findTransactionWithProduct,
	updateStatus: paymentRepository.updateStatus,
	process: (options) =>
		db.transaction((trx) =>
			processSuccessfulTransaction({
				...options,
				repository: createTransactionRepository(trx),
				userRepository: createUserRepository(trx),
				creditRepository: createCreditRepository(trx),
			}),
		),
});

export const transactionService = createTransactionService({
	repository: paymentRepository,
	subscriptionService,
	notificationService,
	verifyNotification: midtransProvider.verifyNotification,
});
