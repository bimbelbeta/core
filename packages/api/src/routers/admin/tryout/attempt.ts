import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { tryoutAttempt } from "@bimbelbeta/db/schema/tryout";
import { and, asc, desc, eq, gt, lt } from "drizzle-orm";
import { buildIdCursorPage, parseIdCursor } from "../../../lib/pagination/cursor";
import { baseImplementer } from "../../../lib/router-definition";
import { rateLimit, requireAdmin, requireAuth } from "../../../lib/router-definition/middleware";
import { parseNullableInt } from "../../../lib/utils";

const admin = baseImplementer.use(requireAuth).use(rateLimit).use(requireAdmin);

const list = admin.admin.tryout.attempts.list.handler(async ({ input }) => {
	const limit = input.limit ?? 10;
	const isBackward = !!input.before;
	const cursorStr = input.before || input.after;
	const cursorId = cursorStr ? parseIdCursor(cursorStr) : undefined;

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
		.where(
			and(
				eq(tryoutAttempt.tryoutId, input.id),
				cursorId !== undefined
					? isBackward
						? lt(tryoutAttempt.id, cursorId)
						: gt(tryoutAttempt.id, cursorId)
					: undefined,
			),
		)
		.orderBy(isBackward ? desc(tryoutAttempt.id) : asc(tryoutAttempt.id))
		.limit(limit + 1);

	const mappedRows = rows.map((row) => ({
		id: row.attempt.id,
		attempt: { ...row.attempt, score: parseNullableInt(row.attempt.score) },
		user: row.user,
	}));

	const { items, pageInfo } = buildIdCursorPage(mappedRows, limit, isBackward, !!cursorStr);

	return { items, pageInfo };
});

export const tryoutAttemptRouter = {
	list,
};
