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
	/**
	 * Starts a purchase: records the pending transaction, then asks the gateway for a checkout.
	 *
	 * The order row is written first and deliberately kept when the gateway call fails, so a failed
	 * payment still leaves an auditable trace instead of vanishing. That is why the caller receives
	 * `payment_failed` rather than a rolled-back result.
	 *
	 * Premium and fixed-date plans are refused for members who already have premium access; credit
	 * packs are purchasable at any time. Errors are returned as statuses, not thrown, so this stays
	 * usable outside oRPC.
	 *
	 * @param slug Product slug identifying the plan being bought.
	 * @param user Buyer identity and current premium state.
	 * @returns `ok` with the checkout, `not_found`, `already_premium`, `creation_failed`, or
	 * `payment_failed` with a `reason` describing what the gateway did.
	 */
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
