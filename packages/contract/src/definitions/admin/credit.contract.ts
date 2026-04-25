import { user } from "@bimbelbeta/db/schema/auth";
import { creditTransaction } from "@bimbelbeta/db/schema/credit";
import { type } from "arktype";
import { createSelectSchema } from "drizzle-arktype";
import { oc } from "../../lib/contract-definition";

const CreditAdjustmentInputSchema = type({
	userId: "string",
	amount: "number",
	note: "string?",
});

const CreditAdjustmentOutputSchema = type({
	userId: "string",
	previousBalance: "number",
	newBalance: "number",
	adjustment: "number",
});

const UserCreditSummarySchema = createSelectSchema(user).pick("id", "name", "email", "tryoutCredits");
const CreditTransactionSchema = createSelectSchema(creditTransaction);

const UserCreditsOutputSchema = type({
	user: UserCreditSummarySchema,
	history: CreditTransactionSchema.array(),
});

export const adminCreditContract = {
	adjustCredits: oc
		.route({
			path: "/admin/users/{userId}/credits",
			method: "POST",
			tags: ["Admin - Credits"],
		})
		.input(CreditAdjustmentInputSchema)
		.output(CreditAdjustmentOutputSchema),
	find: oc
		.route({
			path: "/admin/users/{userId}/credits",
			method: "GET",
			tags: ["Admin - Credits"],
		})
		.input(type({ userId: "string" }))
		.output(UserCreditsOutputSchema),
};
