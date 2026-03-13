import { user } from "@bimbelbeta/db/schema/auth";
import { creditTransaction } from "@bimbelbeta/db/schema/credit";
import { type } from "arktype";
import { createSelectSchema } from "drizzle-arktype";
import { oc } from "../../lib/contract-definition";

const UserSchema = createSelectSchema(user);
const CreditTransactionSchema = createSelectSchema(creditTransaction);

const UserListInputSchema = type({
	cursor: "string?",
	limit: "number = 10",
	search: "string?",
	role: "'user' | 'admin' | 'superadmin'?",
	isPremium: "boolean?",
});

const UserListOutputSchema = type({
	users: UserSchema.array(),
	nextCursor: "string?",
});

const UserDetailOutputSchema = type({
	user: UserSchema,
	creditHistory: CreditTransactionSchema.array(),
});

const MessageResponseSchema = type({
	message: "string",
});

export const adminUsersContract = {
	list: oc
		.route({
			path: "/admin/users",
			method: "GET",
			tags: ["Admin - Users"],
		})
		.input(UserListInputSchema)
		.output(UserListOutputSchema),
	get: oc
		.route({
			path: "/admin/users/{userId}",
			method: "GET",
			tags: ["Admin - Users"],
		})
		.input(type({ userId: "string" }))
		.output(UserDetailOutputSchema),
	update: oc
		.route({
			path: "/admin/users/{userId}",
			method: "PATCH",
			tags: ["Admin - Users"],
		})
		.input(
			type({
				userId: "string",
				role: "'user' | 'admin' | 'superadmin'?",
				isPremium: "boolean?",
				premiumExpiresAt: "Date | null?",
			}),
		)
		.output(MessageResponseSchema),
};
