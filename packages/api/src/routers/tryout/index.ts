import { db } from "@bimbelbeta/db";
import { tryout, tryoutAttempt } from "@bimbelbeta/db/schema/tryout";
import { and, desc, eq } from "drizzle-orm";
import { authedImplementer } from "@/lib/router-definition";
import { discoverTryouts } from "@/lib/tryout-discovery";
import { find, history, result, start } from "@/routers/tryout/attempt";
import { review } from "@/routers/tryout/review";
import { saveAnswer, startSubtest, submitSubtest, submitTryout, toggleRaguRagu } from "@/routers/tryout/session";

const authed = authedImplementer;

const list = authed.tryout.list.handler(({ input, context }) => discoverTryouts(input, context.session.user.id));

const featured = authed.tryout.featured.handler(async ({ context, errors }) => {
	let status: "finished" | "not_started" | "ongoing" = "not_started";
	const [data] = await db
		.select({
			id: tryout.id,
			title: tryout.title,
			category: tryout.category,
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
