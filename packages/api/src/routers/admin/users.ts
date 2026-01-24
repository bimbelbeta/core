import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { creditTransaction } from "@bimbelbeta/db/schema/credit";
import { ORPCError } from "@orpc/client";
import { type } from "arktype";
import { and, count, desc, eq, like, or } from "drizzle-orm";
import { admin } from "../..";

const listUsers = admin
	.route({
		path: "/admin/users",
		method: "GET",
		tags: ["Admin - Users"],
	})
	.input(
		type({
			page: "number = 1",
			limit: "number = 10",
			search: "string?",
			role: type("'user' | 'admin' | 'superadmin'")?.optional(),
			isPremium: "boolean?",
		}),
	)
	.handler(async ({ input }) => {
		const offset = (input.page - 1) * input.limit;

		const conditions = [];

		if (input.search) {
			conditions.push(or(like(user.name, `%${input.search}%`), like(user.email, `%${input.search}%`)));
		}

		if (input.role) {
			conditions.push(eq(user.role, input.role));
		}

		if (input.isPremium !== undefined) {
			conditions.push(eq(user.isPremium, input.isPremium));
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		const usersList = await db
			.select()
			.from(user)
			.where(whereClause)
			.limit(input.limit)
			.offset(offset)
			.orderBy(user.createdAt);

		const [countResult] = await db.select({ value: count() }).from(user).where(whereClause);
		const total = countResult?.value ?? 0;

		return {
			users: usersList,
			total,
			page: input.page,
			limit: input.limit,
		};
	});

const getUser = admin
	.route({
		path: "/admin/users/{userId}",
		method: "GET",
		tags: ["Admin - Users"],
	})
	.input(type({ userId: "string" }))
	.handler(async ({ input }) => {
		const [userData] = await db.select().from(user).where(eq(user.id, input.userId)).limit(1);

		if (!userData) {
			throw new ORPCError("NOT_FOUND", {
				message: "User tidak ditemukan",
			});
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

const updateUser = admin
	.route({
		path: "/admin/users/{userId}",
		method: "PATCH",
		tags: ["Admin - Users"],
	})
	.input(
		type({
			userId: "string",
			role: type("'user' | 'admin' | 'superadmin'")?.optional(),
			isPremium: "boolean?",
			premiumExpiresAt: "string?",
		}),
	)
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
		const [existingUser] = await db.select().from(user).where(eq(user.id, input.userId)).limit(1);

		if (!existingUser) {
			throw new ORPCError("NOT_FOUND", {
				message: "User tidak ditemukan",
			});
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
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Gagal memperbarui user",
			});
		}

		return { message: "User berhasil diperbarui" };
	});

const grantPremium = admin
	.route({
		path: "/admin/users/{userId}/premium",
		method: "POST",
		tags: ["Admin - Users"],
	})
	.input(
		type({
			userId: "string",
			expiresAt: "string?",
		}),
	)
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
		const [existingUser] = await db.select().from(user).where(eq(user.id, input.userId)).limit(1);

		if (!existingUser) {
			throw new ORPCError("NOT_FOUND", {
				message: "User tidak ditemukan",
			});
		}

		const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;

		const [updated] = await db
			.update(user)
			.set({
				isPremium: true,
				premiumExpiresAt: expiresAt,
				updatedAt: new Date(),
			})
			.where(eq(user.id, input.userId))
			.returning();

		if (!updated) {
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Gagal memberikan premium",
			});
		}

		return { message: "Premium berhasil diberikan" };
	});

export const usersRouter = {
	listUsers,
	getUser,
	updateUser,
	grantPremium,
};
