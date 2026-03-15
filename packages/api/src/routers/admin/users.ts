import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { creditTransaction } from "@bimbelbeta/db/schema/credit";
import { and, asc, desc, eq, gt, like, lt, or } from "drizzle-orm";
import { superadmin } from "../..";
import { buildStringIdCursorPage, parseStringIdCursor } from "../../lib/pagination/cursor";

const list = superadmin.admin.users.list.handler(async ({ input }) => {
	const limit = Math.min(input.limit ?? 20, 100);
	const isBackward = !!input.before;
	const cursor = input.before || input.after;

	const conditions: (
		| ReturnType<typeof eq>
		| ReturnType<typeof like>
		| ReturnType<typeof or>
		| ReturnType<typeof gt>
		| ReturnType<typeof lt>
	)[] = [];

	if (cursor) {
		const cursorId = parseStringIdCursor(cursor);
		if (isBackward) {
			conditions.push(lt(user.id, cursorId));
		} else {
			conditions.push(gt(user.id, cursorId));
		}
	}

	if (input.search) {
		conditions.push(or(like(user.name, `%${input.search}%`), like(user.email, `%${input.search}%`)));
	}

	if (input.role) {
		conditions.push(eq(user.role, input.role));
	}

	if (input.isPremium !== undefined) {
		conditions.push(eq(user.isPremium, input.isPremium));
	}

	const rows = await db
		.select()
		.from(user)
		.where(conditions.length > 0 ? and(...conditions) : undefined)
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
