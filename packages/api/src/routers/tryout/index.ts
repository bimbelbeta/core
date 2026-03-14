import { db } from "@bimbelbeta/db";
import { tryout, tryoutAttempt } from "@bimbelbeta/db/schema/tryout";
import { and, desc, eq } from "drizzle-orm";
import { authed } from "../../index";
import { attemptResult, find, history, start } from "./attempt";
import { review } from "./review";
import { saveAnswer, startSubtest, submitSubtest, submitTryout, toggleRaguRagu } from "./session";

const list = authed.tryout.list.handler(async ({ context }) => {
	const now = new Date();
	const tryouts = await db
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
		.where(eq(tryout.status, "published"))
		.orderBy(desc(tryout.startsAt));

	return tryouts.map((t) => ({
		...t,
		isOpen: (!t.startsAt || t.startsAt <= now) && (!t.endsAt || t.endsAt >= now),
	}));
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
	attemptResult,
	review,
};
