import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { creditTransaction } from "@bimbelbeta/db/schema/credit";
import { type } from "arktype";
import { desc, eq, sql } from "drizzle-orm";
import { superadmin } from "../../index";

const adjustCredits = superadmin
	.route({
		path: "/admin/users/{userId}/credits",
		method: "POST",
		tags: ["Admin - Credits"],
	})
	.input(
		type({
			userId: "string",
			amount: "number", // Positive to add, negative to remove
			note: "string?",
		}),
	)
	.handler(async ({ input, errors }) => {
		const [targetUser] = await db.select().from(user).where(eq(user.id, input.userId)).limit(1);

		if (!targetUser) {
			throw errors.NOT_FOUND({ message: "User tidak ditemukan" });
		}

		const newBalance = (targetUser.tryoutCredits ?? 0) + input.amount;

		if (newBalance < 0) {
			throw errors.BAD_REQUEST({ message: "Kredit tidak boleh negatif" });
		}

		const [updatedUser] = await db.transaction(async (trx) => {
			const [updated] = await trx
				.update(user)
				.set({
					tryoutCredits: sql`${user.tryoutCredits} + ${input.amount}`,
				})
				.where(eq(user.id, input.userId))
				.returning({ tryoutCredits: user.tryoutCredits });

			await trx.insert(creditTransaction).values({
				userId: input.userId,
				amount: input.amount,
				balanceAfter: updated?.tryoutCredits ?? newBalance,
				note: input.note || (input.amount > 0 ? "Admin grant" : "Admin adjustment"),
			});

			return [updated];
		});

		return {
			userId: input.userId,
			previousBalance: targetUser.tryoutCredits ?? 0,
			newBalance: updatedUser?.tryoutCredits ?? newBalance,
			adjustment: input.amount,
		};
	});

const getUserCredits = superadmin
	.route({
		path: "/admin/users/{userId}/credits",
		method: "GET",
		tags: ["Admin - Credits"],
	})
	.input(type({ userId: "string" }))
	.handler(async ({ input, errors }) => {
		const [targetUser] = await db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				tryoutCredits: user.tryoutCredits,
			})
			.from(user)
			.where(eq(user.id, input.userId))
			.limit(1);

		if (!targetUser) {
			throw errors.NOT_FOUND({ message: "User tidak ditemukan" });
		}

		const history = await db
			.select()
			.from(creditTransaction)
			.where(eq(creditTransaction.userId, input.userId))
			.orderBy(desc(creditTransaction.createdAt))
			.limit(50);

		return {
			user: targetUser,
			history,
		};
	});

export const adminCreditRouter = {
	adjustCredits,
	getUserCredits,
};
