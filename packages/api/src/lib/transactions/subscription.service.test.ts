import { describe, expect, mock, spyOn, test } from "bun:test";
import { PaymentError } from "./errors";
import { createSubscriptionService } from "./subscription.service";

const user = { id: "user-1", name: "User", email: "user@example.com", isPremium: false };
const plan = {
	id: "product-1",
	name: "Premium",
	slug: "premium",
	description: null,
	price: "10000",
	type: "subscription" as const,
	variant: "monthly" as const,
	fixedExpiryMonth: null,
	fixedExpiryDay: null,
	durationDays: 30,
	credits: null,
	createdAt: null,
	updatedAt: new Date(),
	deletedAt: null,
};
const transaction = {
	id: "order-1",
	userId: user.id,
	productId: plan.id,
	grossAmount: plan.price,
	status: "pending" as const,
	paidAt: null,
	orderedAt: null,
	createdAt: new Date(),
	updatedAt: new Date(),
};
const checkout = { provider: "midtrans", token: "token", redirectUrl: "url" };

function setup() {
	const deps = {
		repository: {
			findProduct: mock(async (): Promise<typeof plan | undefined> => plan),
			createTransaction: mock(async (): Promise<typeof transaction | undefined> => transaction),
			findTransactionWithProduct: mock(async () => null),
			updateStatus: mock(async () => {}),
		},
		createCheckout: mock(async () => checkout),
	};
	return { deps, service: createSubscriptionService(deps) };
}

describe("subscription service", () => {
	test("records the transaction before requesting checkout", async () => {
		const { deps, service } = setup();
		deps.createCheckout.mockImplementation(async () => {
			expect(deps.repository.createTransaction).toHaveBeenCalledTimes(1);
			return checkout;
		});
		expect(await service.subscribe("premium", user)).toEqual({ status: "ok", checkout });
		expect(deps.repository.createTransaction).toHaveBeenCalledTimes(1);
	});

	test("rejects missing products and existing premium memberships", async () => {
		const { deps, service } = setup();
		deps.repository.findProduct.mockResolvedValueOnce(undefined);
		expect(await service.subscribe("missing", user)).toEqual({ status: "not_found" });
		expect(await service.subscribe("premium", { ...user, isPremium: true })).toEqual({ status: "already_premium" });
		expect(deps.repository.createTransaction).not.toHaveBeenCalled();
	});

	test("reports a failed transaction write without requesting checkout", async () => {
		const { deps, service } = setup();
		deps.repository.createTransaction.mockResolvedValueOnce(undefined);
		expect(await service.subscribe("premium", user)).toEqual({ status: "creation_failed" });
		expect(deps.createCheckout).not.toHaveBeenCalled();
	});

	test("carries the provider error code when checkout fails", async () => {
		const { deps, service } = setup();
		deps.createCheckout.mockRejectedValueOnce(new PaymentError("PROVIDER_REJECTED", "rejected"));
		const log = spyOn(console, "error").mockImplementation(() => {});
		try {
			expect(await service.subscribe("premium", user)).toEqual({
				status: "payment_failed",
				reason: "PROVIDER_REJECTED",
			});
			expect(log).toHaveBeenCalled();
		} finally {
			log.mockRestore();
		}
	});
});
