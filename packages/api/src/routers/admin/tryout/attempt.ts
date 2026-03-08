import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { tryoutAttempt } from "@bimbelbeta/db/schema/tryout";
import { type } from "arktype";
import { and, eq, gt } from "drizzle-orm";
import { admin } from "../../..";

const getByTryout = admin
	.route({
		path: "/admin/tryouts/{id}/attempts",
		method: "GET",
	})
	.input(
		type({
			id: "number",
			after: "number?",
			limit: "number = 10",
		}),
	)
	.handler(async ({ input }) => {
		const rows = await db
			.select({
				attempt: {
					id: tryoutAttempt.id,
					userId: tryoutAttempt.userId,
					tryoutId: tryoutAttempt.tryoutId,
					startedAt: tryoutAttempt.startedAt,
					deadline: tryoutAttempt.deadline,
					completedAt: tryoutAttempt.completedAt,
					status: tryoutAttempt.status,
					score: tryoutAttempt.score,
					submittedImageUrl: tryoutAttempt.submittedImageUrl,
					isRevoked: tryoutAttempt.isRevoked,
					usedCredit: tryoutAttempt.usedCredit,
					usedAccessCode: tryoutAttempt.usedAccessCode,
				},
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					image: user.image,
					isPremium: user.isPremium,
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
	getByTryout,
};
