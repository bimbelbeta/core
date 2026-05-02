import { db } from "@bimbelbeta/db";
import { product } from "@bimbelbeta/db/schema/transaction";
import { asc, desc, gt, lt } from "drizzle-orm";
import { buildStringIdCursorPage, parseStringIdCursor } from "@/lib/pagination/cursor";
import { authedNoPremiumImplementer } from "@/lib/router-definition";

const authed = authedNoPremiumImplementer;

const list = authed.product.list.handler(async ({ input }) => {
	const limit = Math.min(input?.limit ?? 20, 100);
	const isBackward = !!input?.before;
	const cursorStr = input?.after ?? input?.before;
	const cursorId = cursorStr ? parseStringIdCursor(cursorStr) : null;

	const rows = await db
		.select({
			id: product.id,
			name: product.name,
			slug: product.slug,
			description: product.description,
			price: product.price,
			type: product.type,
			variant: product.variant,
			fixedExpiryMonth: product.fixedExpiryMonth,
			fixedExpiryDay: product.fixedExpiryDay,
			durationDays: product.durationDays,
			credits: product.credits,
		})
		.from(product)
		.where(cursorId !== null ? (isBackward ? lt(product.id, cursorId) : gt(product.id, cursorId)) : undefined)
		.orderBy(isBackward ? desc(product.id) : asc(product.id))
		.limit(limit + 1);

	const { items, pageInfo } = buildStringIdCursorPage(rows, limit, isBackward, !!cursorStr);

	return { items, pageInfo };
});

export const productRouter = {
	list,
};
