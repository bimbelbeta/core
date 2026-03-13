import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { creditTransaction } from "@bimbelbeta/db/schema/credit";
import { ORPCError } from "@orpc/client";
import { and, desc, eq, gt, like, or } from "drizzle-orm";
import { superadmin } from "../..";

type ListUsersInput = {
	cursor?: string;
	limit: number;
	search?: string;
	role?: "user" | "admin" | "superadmin";
	isPremium?: boolean;
};

type GetUserInput = {
	userId: string;
};

type UpdateUserInput = GetUserInput & {
	role?: "user" | "admin" | "superadmin";
	isPremium?: boolean;
	premiumExpiresAt?: Date | null;
};

const list = superadmin.admin.users.list.handler(async ({ input }: { input: ListUsersInput }) => {
	const rows = await db
		.select()
		.from(user)
		.where(
			and(
				input.cursor ? gt(user.createdAt, new Date(input.cursor)) : undefined,
				input.search ? or(like(user.name, `%${input.search}%`), like(user.email, `%${input.search}%`)) : undefined,
				input.role ? eq(user.role, input.role) : undefined,
				input.isPremium !== undefined ? eq(user.isPremium, input.isPremium) : undefined,
			),
		)
		.orderBy(user.createdAt)
		.limit(input.limit + 1);

	const hasMore = rows.length > input.limit;
	const users = hasMore ? rows.slice(0, input.limit) : rows;
	const lastUser = users.at(-1);

	return {
		users,
		nextCursor: hasMore && lastUser?.createdAt ? lastUser.createdAt.toISOString() : undefined,
	};
});

const get = superadmin.admin.users.get.handler(async ({ input }: { input: GetUserInput }) => {
	const [userData] = await db.select().from(user).where(eq(user.id, input.userId)).limit(1);

	if (!userData) {
		throw new ORPCError("NOT_FOUND", { message: "User tidak ditemukan" });
	}

	const history = await db
		.select()
		.from(creditTransaction)
		.where(eq(creditTransaction.userId, input.userId))
		.orderBy(desc(creditTransaction.createdAt))
		.limit(10);

	return {
		user: userData,
		creditHistory: history,
	};
});

const update = superadmin.admin.users.update.handler(async ({ input }: { input: UpdateUserInput }) => {
	const [existingUser] = await db.select().from(user).where(eq(user.id, input.userId)).limit(1);

	if (!existingUser) {
		throw new ORPCError("NOT_FOUND", { message: "User tidak ditemukan" });
	}

	const updateData: {
		role?: "user" | "admin" | "superadmin";
		isPremium?: boolean;
		premiumExpiresAt?: Date | null;
		updatedAt: Date;
	} = {
		updatedAt: new Date(),
	};

	if (input.role !== undefined) updateData.role = input.role;
	if (input.isPremium !== undefined) updateData.isPremium = input.isPremium;
	if (input.premiumExpiresAt !== undefined) {
		updateData.premiumExpiresAt = input.premiumExpiresAt ? new Date(input.premiumExpiresAt) : null;
	}

	const [updated] = await db.update(user).set(updateData).where(eq(user.id, input.userId)).returning();

	if (!updated) {
		throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Gagal memperbarui user" });
	}

	return { message: "User berhasil diperbarui" };
});

export const usersRouter = {
	list,
	get,
	update,
};
