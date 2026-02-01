import { decimal, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

/**
 * PRODUCT VARIANT ARCHITECTURE
 *
 * We support 3 product variants:
 * 1. FIXED_DATE - Expires at fixed date yearly (e.g., May 31)
 * 2. MONTHLY    - Duration-based from purchase (e.g., 30 days)
 * 3. CREDITS    - Credits only, no expiry
 */

export const typeEnum = pgEnum("product_type_enum", ["subscription", "product"]);
export const statusEnum = pgEnum("transaction_status_enum", ["pending", "success", "failed"]);
export const productVariantEnum = pgEnum("product_variant_enum", ["fixed_date", "monthly", "credits"]);

export const transaction = pgTable("transaction", {
	id: text().primaryKey(),
	userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
	productId: uuid("product_id").references(() => product.id, { onDelete: "set null" }),
	grossAmount: decimal("gross_amount"),
	status: statusEnum("status").notNull().default("pending"),
	paidAt: timestamp("paid_at"),
	orderedAt: timestamp("ordered_at").defaultNow(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const product = pgTable("product", {
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
});
