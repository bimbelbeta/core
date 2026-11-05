import { decimal, index, integer, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { app } from "@/schema/app";
import { user } from "@/schema/auth";

/**
 * PRODUCT VARIANT ARCHITECTURE
 *
 * We support 3 product variants:
 * 1. FIXED_DATE - Expires at fixed date yearly (e.g., May 31)
 * 2. MONTHLY    - Duration-based from purchase (e.g., 30 days)
 * 3. CREDITS    - Credits only, no expiry
 */

export const typeEnum = app.enum("product_type_enum", ["subscription", "product"]);
export const statusEnum = app.enum("transaction_status_enum", ["pending", "success", "failed"]);
export const productVariantEnum = app.enum("product_variant_enum", ["fixed_date", "monthly", "credits"]);

export const paymentFailureEnum = app.enum("payment_failure_code", [
	"insufficient_balance",
	"limit_exceeded",
	"card_declined",
	"fraud_rejected",
	"payment_expired",
	"payment_cancelled",
	"provider_error",
	"unknown",
]);

export const transaction = app.table(
	"transaction",
	{
		id: text().primaryKey(),
		userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
		productId: uuid("product_id").references(() => product.id, { onDelete: "set null" }),
		grossAmount: decimal("gross_amount"),
		amountPaid: decimal("amount_paid"),
		provider: text("provider").notNull().default("midtrans"),
		providerTransactionId: text("provider_transaction_id"),
		paymentMethod: text("payment_method"),
		expiresAt: timestamp("expires_at"),
		status: statusEnum("status").notNull().default("pending"),
		failureCode: paymentFailureEnum("failure_code"),
		failureDetail: text("failure_detail"),
		paidAt: timestamp("paid_at"),
		orderedAt: timestamp("ordered_at").defaultNow(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(t) => [index("idx_transaction_user_id").on(t.userId), index("idx_transaction_product_id").on(t.productId)],
);

export const product = app.table("product", {
	id: uuid().defaultRandom().primaryKey(),
	name: text().notNull(),
	slug: text().notNull().unique(),
	description: text(),
	price: decimal().notNull(),
	type: typeEnum("type").notNull(),
	variant: productVariantEnum("variant").notNull().default("credits"),
	fixedExpiryMonth: integer("fixed_expiry_month"),
	fixedExpiryDay: integer("fixed_expiry_day"),
	durationDays: integer("duration_days"),
	credits: integer(),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
	deletedAt: timestamp("deleted_at"),
});
