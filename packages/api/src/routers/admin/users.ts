import type { Role } from "@bimbelbeta/contract/common/roles";
import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { creditTransaction } from "@bimbelbeta/db/schema/credit";
import { and, asc, desc, eq, gt, inArray, like, lt, or } from "drizzle-orm";
import { requireFound } from "@/lib/crud-helpers";
import { buildStringIdCursorPage, parseStringIdCursor } from "@/lib/pagination/cursor";
import { superAdminImplementer } from "@/lib/router-definition";

const superadmin = superAdminImplementer;

const list = superadmin.admin.users.list.handler(async ({ input }) => {
	const limit = Math.min(input.limit ?? 20, 100);
	const isBackward = !!input.before;
	const cursor = input.before || input.after;
	const cursorId = cursor ? parseStringIdCursor(cursor) : undefined;

	const rows = await db
		.select()
		.from(user)
		.where(
			and(
				cursorId !== undefined ? (isBackward ? lt(user.id, cursorId) : gt(user.id, cursorId)) : undefined,
				input.search ? or(like(user.name, `%${input.search}%`), like(user.email, `%${input.search}%`)) : undefined,
				input.role ? eq(user.role, input.role) : undefined,
				input.isPremium !== undefined ? eq(user.isPremium, input.isPremium) : undefined,
			),
		)
		.orderBy(isBackward ? desc(user.id) : asc(user.id))
		.limit(limit + 1);

	const { items, pageInfo } = buildStringIdCursorPage(rows, limit, isBackward, !!cursor);

	return { items, pageInfo };
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
		role?: Role;
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

	await requireFound(
		await db.update(user).set(updateData).where(eq(user.id, input.userId)).returning(),
		"User",
		errors,
	);

	return { message: "User berhasil diperbarui" };
});

const deleteBatch = superadmin.admin.users.deleteBatch.handler(async ({ input, errors }) => {
	if (input.userIds.length === 0) {
		throw errors.UNPROCESSABLE_CONTENT({ message: "Tidak ada user yang dipilih" });
	}
	await db.delete(user).where(inArray(user.id, input.userIds));
	return { message: `${input.userIds.length} user berhasil dihapus` };
});

export const usersRouter = {
	list,
	find,
	update,
	deleteBatch,
};
