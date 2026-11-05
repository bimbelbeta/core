import { db } from "@bimbelbeta/db";
import { tryout, tryoutAttempt } from "@bimbelbeta/db/schema/tryout";
import { ORPCError } from "@orpc/server";
import { and, asc, desc, eq, gt, inArray, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import { buildIdCursorPage, parseIdCursor } from "@/lib/pagination/cursor";

export async function discoverTryouts(
	input: {
		level: "tka" | "utbk";
		limit?: number;
		after?: string;
		before?: string;
	},
	userId: string,
) {
	const limit = input.limit ?? 20;
	const isBackward = !!input.before;
	const cursorString = input.after ?? input.before;
	const [cursor] = cursorString
		? await db
				.select({ id: tryout.id, startsAt: tryout.startsAt })
				.from(tryout)
				.where(eq(tryout.id, parseIdCursor(cursorString)))
		: [];
	if (cursorString && !cursor) throw new ORPCError("BAD_REQUEST", { message: "Kursor tryout tidak ditemukan." });

	const compareId = isBackward ? gt : lt;
	const compareDate = isBackward ? gt : lt;
	const cursorCondition = cursor
		? cursor.startsAt
			? or(
					compareDate(tryout.startsAt, cursor.startsAt),
					and(eq(tryout.startsAt, cursor.startsAt), compareId(tryout.id, cursor.id)),
					isBackward ? undefined : isNull(tryout.startsAt),
				)
			: or(
					and(isNull(tryout.startsAt), compareId(tryout.id, cursor.id)),
					isBackward ? isNotNull(tryout.startsAt) : undefined,
				)
		: undefined;

	const rows = await db
		.select({
			id: tryout.id,
			title: tryout.title,
			passingGrade: tryout.passingGrade,
			startsAt: tryout.startsAt,
			endsAt: tryout.endsAt,
			attemptId: tryoutAttempt.id,
			category: tryout.category,
			attemptStatus: tryoutAttempt.status,
		})
		.from(tryout)
		.leftJoin(tryoutAttempt, and(eq(tryoutAttempt.tryoutId, tryout.id), eq(tryoutAttempt.userId, userId)))
		.where(
			and(
				eq(tryout.status, "published"),
				inArray(tryout.category, input.level === "tka" ? ["sd", "smp", "sma"] : ["utbk"]),
				cursorCondition,
			),
		)
		.orderBy(
			isBackward ? sql`${tryout.startsAt} asc nulls first` : sql`${tryout.startsAt} desc nulls last`,
			isBackward ? asc(tryout.id) : desc(tryout.id),
		)
		.limit(limit + 1);

	const { items, pageInfo } = buildIdCursorPage(rows, limit, isBackward, !!cursorString);
	const now = new Date();
	return {
		items: items.map((item) => ({
			...item,
			availability:
				item.startsAt && item.startsAt > now
					? ("upcoming" as const)
					: item.endsAt && item.endsAt < now
						? ("expired" as const)
						: ("open" as const),
		})),
		pageInfo,
	};
}
