import { db } from "@bimbelbeta/db";
import { tryout } from "@bimbelbeta/db/schema/tryout";
import { and, asc, desc, eq, gt, ilike, lt } from "drizzle-orm";
import { admin } from "../../..";
import { buildIdCursorPage, parseIdCursor } from "../../../lib/pagination/cursor";
import { pickDefined } from "../../../lib/utils";

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

	const rows = await db
		.select()
		.from(tryout)
		.where(and(...baseFilters.filter(Boolean)))
		.orderBy(isBackward ? desc(tryout.id) : asc(tryout.id))
		.limit(limit + 1);

	const { items, pageInfo } = buildIdCursorPage(rows, limit, isBackward, !!cursorStr);

	return { items, pageInfo };
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
	const updateData = {
		...pickDefined({
			title: input.title,
			description: input.description !== undefined ? (input.description ?? null) : undefined,
			category: input.category,
			status: input.status,
			startsAt: input.startsAt !== undefined ? (input.startsAt ? new Date(input.startsAt) : null) : undefined,
			endsAt: input.endsAt !== undefined ? (input.endsAt ? new Date(input.endsAt) : null) : undefined,
		}),
		updatedAt: new Date(),
	};

	const [updated] = await db.update(tryout).set(updateData).where(eq(tryout.id, input.id)).returning();

	if (!updated)
		throw errors.NOT_FOUND({
			message: "Tryout tidak ditemukan",
		});

	return { message: "Tryout berhasil diperbarui" };
});

const remove = admin.admin.tryout.remove.handler(async ({ input, errors }) => {
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
	remove,
	attempts: tryoutAttemptRouter,
};
