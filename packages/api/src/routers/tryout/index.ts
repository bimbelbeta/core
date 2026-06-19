import { db } from "@bimbelbeta/db";
import { tryout, tryoutAttempt } from "@bimbelbeta/db/schema/tryout";
import { and, desc, eq, gt, lt } from "drizzle-orm";
import { buildIdCursorPage, parseIdCursor } from "@/lib/pagination/cursor";
import { authedImplementer } from "@/lib/router-definition";
import { find, history, result, start } from "@/routers/tryout/attempt";
import { review } from "@/routers/tryout/review";
import { saveAnswer, startSubtest, submitSubtest, submitTryout, toggleRaguRagu } from "@/routers/tryout/session";

const authed = authedImplementer;

const list = authed.tryout.list.handler(async ({ input, context }) => {
	const now = new Date();
	const limit = input?.limit ?? 20;
	const isBackward = !!input?.before;
	const cursorStr = input?.after ?? input?.before;
	const cursorId = cursorStr ? parseIdCursor(cursorStr) : null;

	const rows = await db
		.select({
			id: tryout.id,
			title: tryout.title,
			passingGrade: tryout.passingGrade,
			startsAt: tryout.startsAt,
			endsAt: tryout.endsAt,
			attemptId: tryoutAttempt.id,
			attemptStatus: tryoutAttempt.status,
		})
		.from(tryout)
		.leftJoin(
			tryoutAttempt,
			and(eq(tryoutAttempt.tryoutId, tryout.id), eq(tryoutAttempt.userId, context.session.user.id)),
		)
		.where(
			and(
				eq(tryout.status, "published"),
				cursorId !== null ? (isBackward ? lt(tryout.id, cursorId) : gt(tryout.id, cursorId)) : undefined,
			),
		)
		.orderBy(isBackward ? desc(tryout.id) : desc(tryout.startsAt))
		.limit(limit + 1);

	const { items, pageInfo } = buildIdCursorPage(rows, limit, isBackward, !!cursorStr);

	return {
		items: items.map((t) => ({
			...t,
			isOpen: (!t.startsAt || t.startsAt <= now) && (!t.endsAt || t.endsAt >= now),
		})),
		pageInfo,
	};
});

const featured = authed.tryout.featured.handler(async ({ context, errors }) => {
	let status: "finished" | "not_started" | "ongoing" = "not_started";
	const [data] = await db
		.select({
			id: tryout.id,
			title: tryout.title,
			passingGrade: tryout.passingGrade,
			startsAt: tryout.startsAt,
			endsAt: tryout.endsAt,
			startedAt: tryoutAttempt.startedAt,
			completedAt: tryoutAttempt.completedAt,
			attemptId: tryoutAttempt.id,
			attemptStatus: tryoutAttempt.status,
		})
		.from(tryout)
		.leftJoin(
			tryoutAttempt,
			and(eq(tryoutAttempt.tryoutId, tryout.id), eq(tryoutAttempt.userId, context.session.user.id)),
		)
		.where(eq(tryout.status, "published"))
		.orderBy(desc(tryout.startsAt));

	if (!data)
		throw errors.NOT_FOUND({
			message: "Gagal menemukan paket Tryout!",
		});

	if (data.startedAt) status = "ongoing";
	if (data.completedAt) status = "finished";

	return {
		...data,
		status,
	};
});

export const tryoutRouter = {
	list,
	find,
	start,
	featured,
	startSubtest,
	saveAnswer,
	toggleRaguRagu,
	submitSubtest,
	submitTryout,
	history,
	result,
	review,
};
