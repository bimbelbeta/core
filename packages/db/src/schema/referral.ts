import { boolean, index, integer, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { user } from "@/schema/auth";

export const referralCode = pgTable(
	"referral_code",
	{
		id: text("id").primaryKey(),
		code: text("code").notNull().unique(),
		status: boolean("status").default(true).notNull(),
		usageCount: integer("usage_count").default(0).notNull(),
		maxUsages: integer("max_usages"),
		validUntil: timestamp("valid_until"),
		premiumDays: integer("premium_days").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
	},
	(t) => [index("idx_referral_code_code").on(t.code)],
);

export const referralUsage = pgTable(
	"referral_usage",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		referralCodeId: text("referral_code_id")
			.notNull()
			.references(() => referralCode.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => [
		unique("referral_usage_user_code_idx").on(t.userId, t.referralCodeId),
		index("idx_referral_usage_user_id").on(t.userId),
		index("idx_referral_usage_code_id").on(t.referralCodeId),
	],
);
