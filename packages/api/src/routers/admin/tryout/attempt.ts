import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { tryoutAttempt } from "@bimbelbeta/db/schema/tryout";
import { and, asc, desc, eq, gt, lt } from "drizzle-orm";
import { admin } from "../../..";
import { buildIdCursorPage, parseIdCursor } from "../../../lib/pagination/cursor";
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
		.where(and(...baseFilters.filter(Boolean)))
		.orderBy(isBackward ? desc(tryoutAttempt.id) : asc(tryoutAttempt.id))
		.limit(limit + 1);

	const mappedRows = rows.map((row) => ({
		id: row.attempt.id,
		attempt: { ...row.attempt, score: numericToNumber(row.attempt.score) },
		user: row.user,
	}));

	const { items, pageInfo } = buildIdCursorPage(mappedRows, limit, isBackward, !!cursorStr);

	return { items, pageInfo };
});

export const tryoutAttemptRouter = {
	list,
};
