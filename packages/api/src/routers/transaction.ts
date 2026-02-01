import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { creditTransaction } from "@bimbelbeta/db/schema/credit";
import { product, transaction } from "@bimbelbeta/db/schema/transaction";
import { ORPCError } from "@orpc/client";
import { type } from "arktype";
import { eq, sql } from "drizzle-orm";
import { authed, pub } from "..";
import { createSubscriptionTransaction } from "../lib/midtrans";

/**
 * Calculate expiry date for fixed-date variant.
 * If purchased before the fixed date this year → expires this year
 * If purchased after the fixed date this year → expires next year
 */
function calculateFixedDateExpiry(purchaseDate: Date, month: number, day: number): Date {
	const currentYear = purchaseDate.getFullYear();
	const thisYearExpiry = new Date(currentYear, month - 1, day);

	// If purchase date is past this year's expiry, move to next year
	if (purchaseDate > thisYearExpiry) {
		return new Date(currentYear + 1, month - 1, day);
	}

	return thisYearExpiry;
}

/**
 * Calculate expiry date for monthly variant.
 * Adds duration days to the purchase date.
 */
function calculateMonthlyExpiry(purchaseDate: Date, durationDays: number): Date {
	const expiry = new Date(purchaseDate);
	expiry.setDate(expiry.getDate() + durationDays);
	return expiry;
}

const subscribe = authed
	.route({
		path: "/subscribe",
		method: "POST",
		tags: ["Payment", "Subscription"],
	})
	.input(
		type({
			slug: "string",
		}),
	)
	.output(
		type({
			token: "string",
			redirectUrl: "string",
		}),
	)
	.handler(async ({ input, context, errors }) => {
		const [plan] = await db.select().from(product).where(eq(product.slug, input.slug)).limit(1);
		if (!plan) throw errors.NOT_FOUND({ message: "Produk tidak ditemukan." });

		// Check if user already has an active premium subscription
		// This applies to both fixed_date and monthly variants
		if (plan.variant === "fixed_date" || plan.variant === "monthly") {
			if (context.session.user.isPremium)
				throw errors.UNPROCESSABLE_CONTENT({ message: "Kamu sudah menjadi member premium." });
		}

		const grossAmount = plan.price;
		const orderId = `tx_${crypto.randomUUID()}`;

		const [createdTransaction] = await db
			.insert(transaction)
			.values({
				id: orderId,
				productId: plan.id,
				grossAmount: String(grossAmount),
				userId: context.session.user.id,
			})
			.returning();
		if (!createdTransaction)
			throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal membuat transaksi. Silahkan coba lagi." });

		return await createSubscriptionTransaction({
			id: orderId,
			session: context.session,
			name: plan.name,
			price: plan.price,
		});
	});

const notification = pub
	.route({
		path: "/transactions/notification",
		method: "POST",
		tags: ["Payment", "Webhook"],
	})
	.input(type({} as Record<string, unknown>))
	.handler(async ({ input }) => {
		const { order_id } = input as {
			order_id: string;
		};

		const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
		const auth = Buffer.from(`${serverKey}:`).toString("base64");

		const statusResponse = await fetch(
			`https://api${process.env.NODE_ENV === "production" ? "" : ".sandbox"}.midtrans.com/v2/${order_id}/status`,
			{
				headers: {
					Authorization: `Basic ${auth}`,
					"Content-Type": "application/json",
				},
			},
		);

		if (!statusResponse.ok) {
			console.error(`Midtrans API error: ${statusResponse.status}`);
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Failed to verify transaction status",
			});
		}

		const statusData = (await statusResponse.json()) as {
			transaction_status: string;
			fraud_status: string;
		};
		const transactionStatus = statusData.transaction_status;
		const fraudStatus = statusData.fraud_status;

		const [existingTransaction] = await db
			.select({
				tx: transaction,
				prodSlug: product.slug,
				prodVariant: product.variant,
				prodFixedExpiryMonth: product.fixedExpiryMonth,
				prodFixedExpiryDay: product.fixedExpiryDay,
				prodDurationDays: product.durationDays,
				prodCredits: product.credits,
			})
			.from(transaction)
			.innerJoin(product, eq(transaction.productId, product.id))
			.where(eq(transaction.id, order_id))
			.limit(1);

		if (!existingTransaction) {
			console.error(`Transaction not found for order ID: ${order_id}`);
			return { status: "not_found" };
		}

		const tx = existingTransaction.tx;

		// Calculate benefits based on product variant
		const variant = existingTransaction.prodVariant;
		const purchaseDate = new Date();
		let premiumExpiry: Date | null = null;

		if (variant === "fixed_date") {
			const month = existingTransaction.prodFixedExpiryMonth!;
			const day = existingTransaction.prodFixedExpiryDay!;
			premiumExpiry = calculateFixedDateExpiry(purchaseDate, month, day);
		} else if (variant === "monthly") {
			const days = existingTransaction.prodDurationDays!;
			premiumExpiry = calculateMonthlyExpiry(purchaseDate, days);
		}
		// variant === "credits" → premiumExpiry stays null

		const grantsPremium = variant === "fixed_date" || variant === "monthly";
		const grantsCredits = existingTransaction.prodCredits && existingTransaction.prodCredits > 0;

		if (tx.paidAt) {
			console.log(`Transaction ${order_id} already processed`);
			return { status: "already_processed" };
		}

		if (transactionStatus === "capture" || transactionStatus === "settlement") {
			const isValid = transactionStatus === "capture" ? fraudStatus === "accept" : true;

			if (isValid) {
				await db.transaction(async (trx) => {
					await trx
						.update(transaction)
						.set({
							status: "success",
							paidAt: purchaseDate,
						})
						.where(eq(transaction.id, order_id));

					// Grant premium access for fixed_date and monthly variants
					if (grantsPremium && premiumExpiry) {
						await trx
							.update(user)
							.set({ isPremium: true, premiumExpiresAt: premiumExpiry })
							.where(eq(user.id, tx.userId!));
					}

					// Grant tryout credits (can be combined with premium)
					if (grantsCredits) {
						const creditsToAdd = existingTransaction.prodCredits!;

						// Add credits to user balance
						const [updatedUser] = await trx
							.update(user)
							.set({
								tryoutCredits: sql`${user.tryoutCredits} + ${creditsToAdd}`,
							})
							.where(eq(user.id, tx.userId!))
							.returning({ tryoutCredits: user.tryoutCredits });

						// Record credit transaction for audit trail
						await trx.insert(creditTransaction).values({
							userId: tx.userId!,
							transactionId: tx.id,
							amount: creditsToAdd,
							balanceAfter: updatedUser?.tryoutCredits ?? creditsToAdd,
							note: `Purchased ${existingTransaction.prodSlug}`,
						});
					}
				});
			}
		} else if (transactionStatus === "cancel" || transactionStatus === "deny" || transactionStatus === "expire") {
			await db
				.update(transaction)
				.set({
					status: "failed",
				})
				.where(eq(transaction.id, order_id));
		} else if (transactionStatus === "pending") {
			await db
				.update(transaction)
				.set({
					status: "pending",
				})
				.where(eq(transaction.id, order_id));
		}

		return { status: "ok" };
	});

const getStatus = authed
	.route({
		path: "/transactions/status",
		method: "GET",
		tags: ["Payment"],
	})
	.input(type({ orderId: "string" }))
	.handler(async ({ input }) => {
		const tx = await db.select().from(transaction).where(eq(transaction.id, input.orderId)).limit(1);

		if (!tx.length) {
			throw new ORPCError("NOT_FOUND", {
				message: "Transaction not found",
			});
		}

		const row = tx[0]!;
		return {
			status: row.status,
			paidAt: row.paidAt,
		};
	});

export const transactionRouter = {
	subscribe,
	notification,
	getStatus,
};
