import { db } from "@bimbelbeta/db";
import { tryout, tryoutAccessCode } from "@bimbelbeta/db/schema/tryout";
import { and, asc, desc, eq, gt, ilike, lt } from "drizzle-orm";
import { buildIdCursorPage, parseIdCursor } from "../../../lib/pagination/cursor";
import { baseImplementer } from "../../../lib/router-definition";
import { rateLimit, requireAdmin, requireAuth } from "../../../lib/router-definition/middleware";
import { pickDefined } from "../../../lib/utils";
import { generateAccessCode, hashAccessCode, maskCode } from "./access-code-utils";
import { tryoutAttemptRouter } from "./attempt";

const admin = baseImplementer.use(requireAuth).use(rateLimit).use(requireAdmin);

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

	const rows = await db
		.select()
		.from(tryout)
		.where(
			and(
				input.search ? ilike(tryout.title, `%${input.search}%`) : undefined,
				input.category ? eq(tryout.category, input.category) : undefined,
				input.status ? eq(tryout.status, input.status) : undefined,
				cursorId !== undefined ? (isBackward ? lt(tryout.id, cursorId) : gt(tryout.id, cursorId)) : undefined,
			),
		)
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

const listAccessCodes = admin.admin.tryout.listAccessCodes.handler(async ({ input }) => {
	const rows = await db.query.tryoutAccessCode.findMany({
		where: {
			tryoutId: { eq: input.id },
		},
		columns: {
			id: true,
			codePreview: true,
			label: true,
			isActive: true,
			expiresAt: true,
			maxUses: true,
			usedCount: true,
			createdAt: true,
			updatedAt: true,
		},
		orderBy: (accessCodes, { desc }) => [desc(accessCodes.createdAt)],
	});

	return rows.map((row) => ({
		id: row.id,
		label: row.label,
		isActive: row.isActive,
		expiresAt: row.expiresAt,
		maxUses: row.maxUses,
		usedCount: row.usedCount,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		codePreview: row.codePreview,
	}));
});

const createAccessCode = admin.admin.tryout.createAccessCode.handler(async ({ input, errors }) => {
	const existingTryout = await db.query.tryout.findFirst({
		where: {
			id: { eq: input.id },
		},
		columns: { id: true },
	});

	if (!existingTryout) {
		throw errors.NOT_FOUND({ message: "Tryout tidak ditemukan" });
	}

	if (input.maxUses !== undefined && input.maxUses <= 0) {
		throw errors.BAD_REQUEST({ message: "Maksimal penggunaan harus lebih dari 0" });
	}

	const plainCode = (input.code?.trim() || generateAccessCode()).toUpperCase();
	const codeHash = hashAccessCode(plainCode);

	try {
		const [created] = await db
			.insert(tryoutAccessCode)
			.values({
				tryoutId: input.id,
				codeHash,
				codePreview: maskCode(plainCode),
				label: input.label?.trim() || null,
				expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
				maxUses: input.maxUses ?? null,
			})
			.returning({
				id: tryoutAccessCode.id,
				codePreview: tryoutAccessCode.codePreview,
				label: tryoutAccessCode.label,
				isActive: tryoutAccessCode.isActive,
				expiresAt: tryoutAccessCode.expiresAt,
				maxUses: tryoutAccessCode.maxUses,
				usedCount: tryoutAccessCode.usedCount,
				createdAt: tryoutAccessCode.createdAt,
				updatedAt: tryoutAccessCode.updatedAt,
			});

		if (!created) {
			throw errors.INTERNAL_SERVER_ERROR({
				message: "Gagal membuat kode akses",
			});
		}

		return {
			...created,
			code: plainCode,
		};
	} catch {
		throw errors.BAD_REQUEST({
			message: "Kode akses sudah ada untuk tryout ini",
		});
	}
});

const updateAccessCodeStatus = admin.admin.tryout.updateAccessCodeStatus.handler(async ({ input, errors }) => {
	const [updated] = await db
		.update(tryoutAccessCode)
		.set({
			isActive: input.isActive,
			updatedAt: new Date(),
		})
		.where(and(eq(tryoutAccessCode.id, input.accessCodeId), eq(tryoutAccessCode.tryoutId, input.id)))
		.returning({
			id: tryoutAccessCode.id,
			isActive: tryoutAccessCode.isActive,
		});

	if (!updated) {
		throw errors.NOT_FOUND({ message: "Kode akses tidak ditemukan" });
	}

	return updated;
});

export const tryoutRouter = {
	createTryout,
	list,
	find,
	updateTryout,
	remove,
	listAccessCodes,
	createAccessCode,
	updateAccessCodeStatus,
	attempts: tryoutAttemptRouter,
};
