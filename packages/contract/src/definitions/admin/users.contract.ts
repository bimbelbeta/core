import { user } from "@bimbelbeta/db/schema/auth";
import { creditTransaction } from "@bimbelbeta/db/schema/credit";
import { type } from "arktype";
import { createSelectSchema } from "drizzle-arktype";
import { PageInfoSchema, PaginationInputSchema } from "@/common/pagination";
import { MessageResponseSchema } from "@/common/response";
import { RoleSchema } from "@/common/roles";
import { oc } from "@/lib/contract-definition";

const UserSchema = createSelectSchema(user);
const CreditTransactionSchema = createSelectSchema(creditTransaction);

const UserListInputSchema = type({
	"...": PaginationInputSchema,
	search: "string?",
	role: RoleSchema.optional(),
	isPremium: "boolean?",
});

const UserListOutputSchema = type({
	items: UserSchema.array(),
	pageInfo: PageInfoSchema,
});

const UserDetailOutputSchema = type({
	user: UserSchema,
	creditHistory: CreditTransactionSchema.array(),
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
	find: oc
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
				role: RoleSchema.optional(),
				isPremium: "boolean?",
				premiumExpiresAt: "Date | null?",
			}),
		)
		.output(MessageResponseSchema),
};
