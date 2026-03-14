import { db } from "@bimbelbeta/db";
import { tryout } from "@bimbelbeta/db/schema/tryout";
import { and, asc, desc, eq, gt, ilike, lt } from "drizzle-orm";
import { admin } from "../../..";
import { createIdCursor, parseIdCursor } from "../../../lib/pagination/cursor";

import { tryoutAttemptRouter } from "./attempt";

const createTryout = admin.admin.tryout.createTryout.handler(async ({ input, errors }) => {
	const [created] = await db
		.insert(tryout)
		.values({
			title: input.title,
			description: input.description ?? null,
			category: input.category,
			status: input.status ?? "draft",
			startsAt: input.startsAt ? new Date(input.startsAt) : null,
			endsAt: input.endsAt ? new Date(input.endsAt) : null,
		})
		.returning();

	if (!created)
		throw errors.INTERNAL_SERVER_ERROR({
			message: "Gagal membuat tryout",
		});

	return {
		message: "Tryout berhasil dibuat",
		id: created.id,
	};
});

const list = admin.admin.tryout.list.handler(async ({ input }) => {
	const limit = input.limit ?? 10;
	const isBackward = !!input.before;
	const cursorStr = input.before || input.after;
	const cursorId = cursorStr ? parseIdCursor(cursorStr) : undefined;

	const baseFilters = [
		input.search ? ilike(tryout.title, `%${input.search}%`) : undefined,
		input.category ? eq(tryout.category, input.category) : undefined,
		input.status ? eq(tryout.status, input.status) : undefined,
		cursorId !== undefined ? (isBackward ? lt(tryout.id, cursorId) : gt(tryout.id, cursorId)) : undefined,
	];

	let rows = await db
		.select()
		.from(tryout)
		.where(and(...baseFilters.filter(Boolean)))
		.orderBy(isBackward ? desc(tryout.id) : asc(tryout.id))
		.limit(limit + 1);

	const hasExtra = rows.length > limit;
	if (hasExtra) rows = rows.slice(0, limit);
	if (isBackward) rows.reverse();

	const firstItem = rows[0];
	const lastItem = rows[rows.length - 1];

	return {
		items: rows,
		pageInfo: {
			hasNextPage: isBackward ? true : hasExtra,
			hasPreviousPage: isBackward ? hasExtra : !!cursorStr,
			startCursor: firstItem ? createIdCursor(firstItem.id) : null,
			endCursor: lastItem ? createIdCursor(lastItem.id) : null,
		},
	};
});

const find = admin.admin.tryout.find.handler(async ({ input, errors }) => {
	const [tryoutData] = await db.select().from(tryout).where(eq(tryout.id, input.id)).limit(1);

	if (!tryoutData)
		throw errors.NOT_FOUND({
			message: "Tryout tidak ditemukan",
		});

	const { tryoutSubtest } = await import("@bimbelbeta/db/schema/tryout");

	const subtestsData = await db
		.select()
		.from(tryoutSubtest)
		.where(eq(tryoutSubtest.tryoutId, input.id))
		.orderBy(tryoutSubtest.order);

	return {
		tryout: tryoutData,
		subtests: subtestsData,
	};
});

const updateTryout = admin.admin.tryout.updateTryout.handler(async ({ input, errors }) => {
	const updateData: {
		title?: string;
		description?: string | null;
		category?: "sd" | "smp" | "sma" | "utbk";
		duration?: number;
		status?: "draft" | "published" | "archived";
		startsAt?: Date | null;
		endsAt?: Date | null;
		updatedAt: Date;
	} = {
		updatedAt: new Date(),
	};

	if (input.title !== undefined) updateData.title = input.title;
	if (input.description !== undefined) updateData.description = input.description ?? null;
	if (input.category !== undefined) updateData.category = input.category;
	if (input.status !== undefined) updateData.status = input.status;
	if (input.startsAt !== undefined) updateData.startsAt = input.startsAt ? new Date(input.startsAt) : null;
	if (input.endsAt !== undefined) updateData.endsAt = input.endsAt ? new Date(input.endsAt) : null;

	const [updated] = await db.update(tryout).set(updateData).where(eq(tryout.id, input.id)).returning();

	if (!updated)
		throw errors.NOT_FOUND({
			message: "Tryout tidak ditemukan",
		});

	return { message: "Tryout berhasil diperbarui" };
});

const deleteTryout = admin.admin.tryout.deleteTryout.handler(async ({ input, errors }) => {
	const [deleted] = await db.delete(tryout).where(eq(tryout.id, input.id)).returning();

	if (!deleted) {
		throw errors.NOT_FOUND({
			message: "Tryout tidak ditemukan",
		});
	}

	return { message: "Tryout berhasil dihapus" };
});

export const tryoutRouter = {
	createTryout,
	list,
	find,
	updateTryout,
	deleteTryout,
	attempts: tryoutAttemptRouter,
};
