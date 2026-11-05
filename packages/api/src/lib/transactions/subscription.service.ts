import type { auth } from "@bimbelbeta/auth";
import type { paymentRepository } from "@/lib/transactions/repository";
import type { PaymentProvider } from "@/lib/transactions/types";

export type SubscriptionServiceDependencies = {
	repository: Pick<typeof paymentRepository, "findProduct" | "createTransaction">;
	createCheckout: PaymentProvider<unknown>["createCheckout"];
};

export const createSubscriptionService = (deps: SubscriptionServiceDependencies) => ({
	/**
	 * Starts a purchase: records the pending transaction, then asks the gateway for a checkout.
	 *
	 * The order row is written first and deliberately kept when the gateway call fails, so a failed
	 * payment still leaves an auditable trace instead of vanishing. That is why the caller receives
	 * `payment_failed` rather than a rolled-back result.
	 *
	 * Premium and fixed-date plans are refused for members who already have premium access; credit
	 * packs are purchasable at any time. Gateway failures are returned as statuses, not thrown, so
	 * this stays usable outside oRPC; a failing database call rejects instead.
	 *
	 * @param slug Product slug identifying the plan being bought.
	 * @param user Buyer identity and current premium state.
	 * @returns `ok` with the checkout, `not_found`, `already_premium`, or
	 * or `payment_failed`.
	 */
	async subscribe(slug: string, user: Pick<typeof auth.$Infer.Session.user, "id" | "name" | "email" | "isPremium">) {
		const plan = await deps.repository.findProduct(slug);
		if (!plan) return { status: "not_found" } as const;

		if ((plan.variant === "fixed_date" || plan.variant === "monthly") && user.isPremium) {
			return { status: "already_premium" } as const;
		}

		const orderId = `tx_${crypto.randomUUID()}`;
		await deps.repository.createTransaction({
			id: orderId,
			productId: plan.id,
			grossAmount: String(plan.price),
			userId: user.id,
		});

		try {
			const checkout = await deps.createCheckout({
				orderId,
				amount: String(plan.price),
				description: plan.name,
				customer: { name: user.name, email: user.email },
			});
			return { status: "ok", checkout } as const;
		} catch (error) {
			console.error("payment checkout failed", error);
			return { status: "payment_failed" } as const;
		}
	},
});
