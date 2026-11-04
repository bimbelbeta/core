import { describe, expect, mock, test } from "bun:test";
import { createSubscriptionService } from "./subscription.service";

const user = { id: "user-1", name: "User", email: "user@example.com", isPremium: false };
const product = {
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
	productId: product.id,
	grossAmount: product.price,
	status: "pending" as const,
	paidAt: null,
	orderedAt: null,
	createdAt: new Date(),
	updatedAt: new Date(),
};

function setup() {
	const deps = {
		repository: {
			findProduct: mock(async (): Promise<typeof product | undefined> => product),
			createTransaction: mock(async (): Promise<typeof transaction | undefined> => transaction),
		},
		createPayment: mock(async () => ({ token: "token", redirectUrl: "url" })),
	};
	return { deps, service: createSubscriptionService(deps) };
}

describe("subscription service", () => {
	test("creates a transaction before requesting payment", async () => {
		const { deps, service } = setup();
		deps.createPayment.mockImplementation(async () => {
			expect(deps.repository.createTransaction).toHaveBeenCalledTimes(1);
			return { token: "token", redirectUrl: "url" };
		});
		expect(await service.subscribe("premium", user)).toEqual({
			status: "ok",
			payment: { token: "token", redirectUrl: "url" },
		});
		expect(deps.repository.createTransaction).toHaveBeenCalledTimes(1);
		expect(deps.createPayment).toHaveBeenCalledTimes(1);
	});

	test("rejects missing products and existing premium memberships", async () => {
		const { deps, service } = setup();
		deps.repository.findProduct.mockResolvedValueOnce(undefined);
		expect(await service.subscribe("missing", user)).toEqual({ status: "not_found" });
		expect(await service.subscribe("premium", { ...user, isPremium: true })).toEqual({ status: "already_premium" });
		expect(deps.repository.createTransaction).not.toHaveBeenCalled();
	});

	test("reports creation and payment failures", async () => {
		const { deps, service } = setup();
		deps.repository.createTransaction.mockResolvedValueOnce(undefined);
		expect(await service.subscribe("premium", user)).toEqual({ status: "creation_failed" });
		expect(deps.createPayment).not.toHaveBeenCalled();
		deps.createPayment.mockRejectedValueOnce(new Error("payment failed"));
		expect(await service.subscribe("premium", user)).toEqual({ status: "payment_failed" });
	});
});
