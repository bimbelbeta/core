import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { product } from "@bimbelbeta/db/schema/transaction";
import { and, asc, desc, eq, gt, isNotNull, lt } from "drizzle-orm";
import { buildStringIdCursorPage, parseStringIdCursor } from "@/lib/pagination/cursor";
import { authedNoPremiumImplementer } from "@/lib/router-definition";

const authed = authedNoPremiumImplementer;

const balance = authed.credit.balance.handler(async ({ context }) => {
	const [userData] = await db
		.select({ tryoutCredits: user.tryoutCredits })
		.from(user)
		.where(eq(user.id, context.session.user.id))
		.limit(1);

	return {
		balance: userData?.tryoutCredits ?? 0,
	};
});

const packages = authed.credit.packages.handler(async ({ input }) => {
	const limit = Math.min(input?.limit ?? 20, 100);
	const isBackward = !!input?.before;
	const cursorStr = input?.after ?? input?.before;
	const cursorId = cursorStr ? parseStringIdCursor(cursorStr) : null;

	const rows = await db
		.select({
			id: product.id,
			name: product.name,
			slug: product.slug,
			price: product.price,
			credits: product.credits,
		})
		.from(product)
		.where(
			and(
				eq(product.type, "product"),
				isNotNull(product.credits),
				cursorId !== null ? (isBackward ? lt(product.id, cursorId) : gt(product.id, cursorId)) : undefined,
			),
		)
		.orderBy(isBackward ? desc(product.id) : asc(product.id))
		.limit(limit + 1);

	const { items, pageInfo } = buildStringIdCursorPage(rows, limit, isBackward, !!cursorStr);

	return { items, pageInfo };
});

export const creditRouter = {
	balance,
	packages,
};
