import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { product, transaction } from "@bimbelbeta/db/schema/transaction";
import { call } from "@orpc/server";
import { eq } from "drizzle-orm";
import type { Session } from "@/context";
import { appRouter } from "@/routers";

const enabled = !!process.env.TEST_DATABASE_URL && process.env.DATABASE_URL === process.env.TEST_DATABASE_URL;
const id = `transaction-it-${crypto.randomUUID()}`;
const now = new Date();
const session = {
	user: {
		id,
		name: id,
		email: `${id}@example.com`,
		emailVerified: false,
		image: null,
		createdAt: now,
		updatedAt: now,
		role: "user",
		isPremium: true,
		premiumExpiresAt: new Date("2100-01-01"),
		tryoutCredits: 0,
		targetUniversityId: null,
		targetStudyProgramId: null,
	},
	session: {
		id,
		userId: id,
		token: id,
		expiresAt: new Date("2100-01-01"),
		createdAt: now,
		updatedAt: now,
		ipAddress: null,
		userAgent: null,
	},
} satisfies Session;
const options = { context: { session } };
const orders: string[] = [];
const products: string[] = [];

describe.skipIf(!enabled)("transaction feature slice", () => {
	beforeAll(async () => {
		await db.insert(user).values({ id, name: id, email: `${id}@example.com`, role: "user" });
	});

	afterAll(async () => {
		for (const orderId of orders) await db.delete(transaction).where(eq(transaction.id, orderId));
		for (const productId of products) await db.delete(product).where(eq(product.id, productId));
		await db.delete(user).where(eq(user.id, id));
	});

	test("keeps refusing a premium member with UNPROCESSABLE_CONTENT", async () => {
		const [plan] = await db
			.insert(product)
			.values({
				name: "Premium member",
				slug: `${id}-premium`,
				price: "10000",
				type: "subscription",
				variant: "fixed_date",
				fixedExpiryMonth: 12,
				fixedExpiryDay: 31,
			})
			.returning();
		products.push(plan!.id);

		await expect(call(appRouter.transaction.subscribe, { slug: plan!.slug }, options)).rejects.toMatchObject({
			code: "UNPROCESSABLE_CONTENT",
			message: "Kamu sudah menjadi member premium.",
		});
	});

	test("reads a member transaction status and reports a missing one as NOT_FOUND", async () => {
		const [plan] = await db
			.insert(product)
			.values({
				name: "Status",
				slug: `${id}-status`,
				price: "10000",
				type: "product",
				variant: "credits",
				credits: 5,
			})
			.returning();
		products.push(plan!.id);

		const paidAt = new Date("2025-06-01T12:00:00Z");
		const failedOrderId = `${id}-failed`;
		const settledOrderId = `${id}-settled`;
		await db.insert(transaction).values([
			{
				id: failedOrderId,
				userId: id,
				productId: plan!.id,
				grossAmount: "10000",
				status: "failed",
				failureCode: "card_declined",
				failureDetail: "Ditolak",
			},
			{
				id: settledOrderId,
				userId: id,
				productId: plan!.id,
				grossAmount: "10000",
				status: "success",
				paidAt,
			},
		]);
		orders.push(failedOrderId, settledOrderId);

		await expect(call(appRouter.transaction.status, { orderId: failedOrderId }, options)).resolves.toEqual({
			status: "failed",
			failureCode: "card_declined",
			failureDetail: "Ditolak",
			paidAt: null,
		});

		await expect(call(appRouter.transaction.status, { orderId: settledOrderId }, options)).resolves.toEqual({
			status: "success",
			failureCode: null,
			failureDetail: null,
			paidAt: paidAt.toISOString(),
		});

		await expect(call(appRouter.transaction.status, { orderId: `${id}-missing` }, options)).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Transaksi tidak ditemukan",
		});

		await expect(
			call(appRouter.transaction.status, { orderId: settledOrderId }, { context: { session: null } }),
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
	});
});
