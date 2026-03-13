import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { tryoutAttempt } from "@bimbelbeta/db/schema/tryout";
import { and, eq, gt } from "drizzle-orm";
import { admin } from "../../..";

type GetByTryoutInput = {
	id: number;
	after?: number;
	limit: number;
};

const list = admin.admin.tryout.attempts.list.handler(async ({ input }: { input: GetByTryoutInput }) => {
	const rows = await db
		.select({
			attempt: tryoutAttempt,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				image: user.image,
			},
		})
		.from(tryoutAttempt)
		.innerJoin(user, eq(user.id, tryoutAttempt.userId))
		.where(and(eq(tryoutAttempt.tryoutId, input.id), input.after ? gt(tryoutAttempt.id, input.after) : undefined))
		.orderBy(tryoutAttempt.id)
		.limit(input.limit + 1);

	if (rows.length === 0 || !rows)
		return {
			attempts: [],
			nextCursor: null,
		};

	const hasMore = rows.length > input.limit;
	const data = hasMore ? rows.slice(0, input.limit) : rows;
	const lastAttempt = data.at(-1);

	return {
		attempts: data,
		nextCursor: hasMore && lastAttempt ? lastAttempt.attempt.id : undefined,
	};
});

export const tryoutAttemptRouter = {
	list,
};
