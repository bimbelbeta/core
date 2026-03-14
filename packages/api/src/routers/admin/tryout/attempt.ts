import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { tryoutAttempt } from "@bimbelbeta/db/schema/tryout";
import { and, asc, desc, eq, gt, lt } from "drizzle-orm";
import { admin } from "../../..";
import { createIdCursor, parseIdCursor } from "../../../lib/pagination/cursor";
import { numericToNumber } from "../../../lib/utils";

type GetByTryoutInput = {
	id: number;
	after?: string;
	before?: string;
	limit?: number;
};

const list = admin.admin.tryout.attempts.list.handler(async ({ input }: { input: GetByTryoutInput }) => {
	const limit = input.limit ?? 10;
	const isBackward = !!input.before;
	const cursorStr = input.before || input.after;
	const cursorId = cursorStr ? parseIdCursor(cursorStr) : undefined;

	const baseFilters = [
		eq(tryoutAttempt.tryoutId, input.id),
		cursorId !== undefined ? (isBackward ? lt(tryoutAttempt.id, cursorId) : gt(tryoutAttempt.id, cursorId)) : undefined,
	];

	let rows = await db
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
		.where(and(...baseFilters.filter(Boolean)))
		.orderBy(isBackward ? desc(tryoutAttempt.id) : asc(tryoutAttempt.id))
		.limit(limit + 1);

	const hasExtra = rows.length > limit;
	if (hasExtra) rows = rows.slice(0, limit);
	if (isBackward) rows.reverse();

	const firstItem = rows[0];
	const lastItem = rows[rows.length - 1];

	return {
		items: rows.map((row) => ({
			...row,
			attempt: { ...row.attempt, score: numericToNumber(row.attempt.score) },
		})),
		pageInfo: {
			hasNextPage: isBackward ? true : hasExtra,
			hasPreviousPage: isBackward ? hasExtra : !!cursorStr,
			startCursor: firstItem ? createIdCursor(firstItem.attempt.id) : null,
			endCursor: lastItem ? createIdCursor(lastItem.attempt.id) : null,
		},
	};
});

export const tryoutAttemptRouter = {
	list,
};
