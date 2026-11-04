import type { auth } from "@bimbelbeta/auth";
import { toPaymentErrorCode } from "@/lib/transactions/errors";
import { midtransProvider } from "@/lib/transactions/providers/midtrans";
import { paymentRepository } from "@/lib/transactions/repository";

const dependencies = {
	repository: paymentRepository,
	createCheckout: midtransProvider.createCheckout,
};

type Dependencies = {
	repository: Pick<typeof paymentRepository, "findProduct" | "createTransaction">;
	createCheckout: typeof midtransProvider.createCheckout;
};

export const createSubscriptionService = (deps: Dependencies) => ({
	async subscribe(slug: string, user: Pick<typeof auth.$Infer.Session.user, "id" | "name" | "email" | "isPremium">) {
		const plan = await deps.repository.findProduct(slug);
		if (!plan) return { status: "not_found" } as const;

		if ((plan.variant === "fixed_date" || plan.variant === "monthly") && user.isPremium) {
			return { status: "already_premium" } as const;
		}

		const orderId = `tx_${crypto.randomUUID()}`;
		const created = await deps.repository.createTransaction({
			id: orderId,
			productId: plan.id,
			grossAmount: String(plan.price),
			userId: user.id,
		});
		if (!created) return { status: "creation_failed" } as const;

		try {
			const checkout = await deps.createCheckout({
				orderId,
				amount: String(plan.price),
				description: plan.name,
				customer: { name: user.name, email: user.email },
			});
			return { status: "ok", checkout } as const;
		} catch (error) {
			return { status: "payment_failed", reason: toPaymentErrorCode(error) } as const;
		}
	},
});

export const subscriptionService = createSubscriptionService(dependencies);
