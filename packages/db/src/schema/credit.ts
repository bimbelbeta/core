import { relations } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { transaction } from "./transaction";
import { tryoutAttempt } from "./tryout";

/**
 * Credit Transaction Table - Audit trail for tryout credit purchases and usage
 *
 * Records both:
 * - Credit additions (from purchases): amount > 0, transactionId set
 * - Credit consumption (from tryout starts): amount < 0, tryoutAttemptId set
 */
export const creditTransaction = pgTable(
	"credit_transaction",
	{
		id: uuid().defaultRandom().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		transactionId: text("transaction_id").references(() => transaction.id, { onDelete: "set null" }),
		tryoutAttemptId: integer("tryout_attempt_id").references(() => tryoutAttempt.id, { onDelete: "set null" }),
		amount: integer().notNull(), // Positive for credits added, negative for credits consumed
		balanceAfter: integer("balance_after").notNull(), // User's credit balance after this operation
		note: text(), // Optional note (e.g., "Admin grant", "Manual adjustment")
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => [index("idx_credit_transaction_user_id").on(t.userId)],
);

export const creditTransactionRelations = relations(creditTransaction, ({ one }) => ({
	user: one(user, {
		fields: [creditTransaction.userId],
		references: [user.id],
	}),
	transaction: one(transaction, {
		fields: [creditTransaction.transactionId],
		references: [transaction.id],
	}),
	tryoutAttempt: one(tryoutAttempt, {
		fields: [creditTransaction.tryoutAttemptId],
		references: [tryoutAttempt.id],
	}),
}));
