import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { creditTransaction } from "@bimbelbeta/db/schema/credit";
import { and, asc, desc, eq, gt, like, lt, or } from "drizzle-orm";
import { superadmin } from "../..";
import { createDateCursor, parseDateCursor } from "../../lib/pagination/cursor";

type ListUsersInput = {
	after?: string;
	before?: string;
	limit?: number;
	search?: string;
	role?: "user" | "admin" | "superadmin";
	isPremium?: boolean;
};

const list = superadmin.admin.users.list.handler(async ({ input }: { input: ListUsersInput }) => {
	const limit = input.limit ?? 10;
	const isBackward = !!input.before;
	const cursor = input.before || input.after;

	const baseFilters = [
		input.search ? or(like(user.name, `%${input.search}%`), like(user.email, `%${input.search}%`)) : undefined,
		input.role ? eq(user.role, input.role) : undefined,
		input.isPremium !== undefined ? eq(user.isPremium, input.isPremium) : undefined,
	];

	if (cursor) {
		const cursorDate = parseDateCursor(cursor);
		if (isBackward) {
			baseFilters.push(lt(user.createdAt, cursorDate));
		} else {
			baseFilters.push(gt(user.createdAt, cursorDate));
		}
	}

	let rows = await db
		.select()
		.from(user)
		.where(and(...baseFilters.filter(Boolean)))
		.orderBy(isBackward ? desc(user.createdAt) : asc(user.createdAt))
		.limit(limit + 1);

	const hasExtra = rows.length > limit;
	if (hasExtra) {
		rows = rows.slice(0, limit);
	}

	if (isBackward) {
		rows.reverse();
	}

	const firstItem = rows[0];
	const lastItem = rows[rows.length - 1];

	const pageInfo = {
		hasNextPage: isBackward ? !!cursor : hasExtra,
		hasPreviousPage: isBackward ? hasExtra : !!cursor,
		startCursor: firstItem ? createDateCursor(firstItem.createdAt) : null,
		endCursor: lastItem ? createDateCursor(lastItem.createdAt) : null,
	};

	return {
		items: rows,
		pageInfo,
	};
});

const find = superadmin.admin.users.find.handler(async ({ input, errors }) => {
	const [userData] = await db.select().from(user).where(eq(user.id, input.userId)).limit(1);

	if (!userData) {
		throw errors.NOT_FOUND({ message: "User tidak ditemukan" });
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

const update = superadmin.admin.users.update.handler(async ({ input, errors }) => {
	const [existingUser] = await db.select().from(user).where(eq(user.id, input.userId)).limit(1);

	if (!existingUser) {
		throw errors.NOT_FOUND({ message: "User tidak ditemukan" });
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
		throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal memperbarui user" });
	}

	return { message: "User berhasil diperbarui" };
});

export const usersRouter = {
	list,
	find,
	update,
};
