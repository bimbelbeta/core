import type { auth } from "@bimbelbeta/auth";
import { createSubscriptionTransaction } from "@/lib/transactions/client";
import { subscriptionRepository } from "@/lib/transactions/subscription.repository";

const dependencies = {
	repository: subscriptionRepository,
	createPayment: createSubscriptionTransaction,
};

export const createSubscriptionService = (deps: typeof dependencies) => ({
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

		const payment = await deps
			.createPayment({ id: orderId, user, name: plan.name, price: plan.price })
			.catch(() => null);
		if (!payment) return { status: "payment_failed" } as const;
		return { status: "ok", payment } as const;
	},
});

export const subscriptionService = createSubscriptionService(dependencies);
