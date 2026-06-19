import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { tryoutAttempt, tryoutSubtestAttempt } from "@bimbelbeta/db/schema/tryout";
import { and, asc, desc, eq, gt, inArray, lt } from "drizzle-orm";
import { buildIdCursorPage, parseIdCursor } from "@/lib/pagination/cursor";
import { adminImplementer } from "@/lib/router-definition";
import { parseNullableInt } from "@/lib/utils";

const admin = adminImplementer;

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

	const { items: pagedItems, pageInfo } = buildIdCursorPage(mappedRows, limit, isBackward, !!cursorStr);
	const attemptIds = pagedItems.map((row) => row.id);
	const subtestAttemptsByAttemptId = new Map<number, { subtestId: number; score: number | null }[]>();

	if (attemptIds.length > 0) {
		const subtestAttempts = await db
			.select({
				tryoutAttemptId: tryoutSubtestAttempt.tryoutAttemptId,
				subtestId: tryoutSubtestAttempt.subtestId,
				score: tryoutSubtestAttempt.score,
			})
			.from(tryoutSubtestAttempt)
			.where(inArray(tryoutSubtestAttempt.tryoutAttemptId, attemptIds))
			.orderBy(asc(tryoutSubtestAttempt.subtestId));

		for (const subtestAttempt of subtestAttempts) {
			const attempts = subtestAttemptsByAttemptId.get(subtestAttempt.tryoutAttemptId) ?? [];
			attempts.push({
				subtestId: subtestAttempt.subtestId,
				score: parseNullableInt(subtestAttempt.score),
			});
			subtestAttemptsByAttemptId.set(subtestAttempt.tryoutAttemptId, attempts);
		}
	}

	const items = pagedItems.map((row) => ({
		...row,
		subtestAttempts: subtestAttemptsByAttemptId.get(row.id) ?? [],
	}));

	return { items, pageInfo };
});

export const tryoutAttemptRouter = {
	list,
};
