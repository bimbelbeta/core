import { createHash, randomBytes } from "node:crypto";
import { db } from "@bimbelbeta/db";
import { tryout, tryoutAccessCode } from "@bimbelbeta/db/schema/tryout";
import { ORPCError } from "@orpc/client";
import { type } from "arktype";
import { and, eq, gt, ilike } from "drizzle-orm";
import { admin } from "../../..";
import { tryoutAttemptRouter } from "./attempt";

const maskCode = (code: string) => {
	if (code.length <= 4) {
		return `${code}${"*".repeat(4)}`;
	}

	return `${code.slice(0, 4)}${"*".repeat(Math.max(code.length - 4, 4))}`;
};

const generateAccessCode = () => {
	return randomBytes(6).toString("base64url").toUpperCase();
};

const createTryout = admin
	.route({
		path: "/admin/tryouts",
		method: "POST",
		tags: ["Admin - Tryouts"],
	})
	.input(
		type({
			title: "string",
			description: "string?",
			category: type("'sd' | 'smp' | 'sma' | 'utbk'"),
			status: type("'draft' | 'published' | 'archived'")?.optional(),
			startsAt: "string?",
			endsAt: "string?",
		}),
	)
	.output(type({ message: "string", id: "number" }))
	.handler(async ({ input }) => {
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
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Gagal membuat tryout",
			});

		return {
			message: "Tryout berhasil dibuat",
			id: created.id,
		};
	});

const listTryouts = admin
	.route({
		path: "/admin/tryouts",
		method: "GET",
		tags: ["Admin - Tryouts"],
	})
	.input(
		type({
			cursor: "number?",
			limit: "number = 10",
			search: "string?",
			category: type("'sd' | 'smp' | 'sma' | 'utbk'")?.optional(),
			status: type("'draft' | 'published' | 'archived'")?.optional(),
		}),
	)
	.handler(async ({ input }) => {
		const rows = await db
			.select()
			.from(tryout)
			.where(
				and(
					input.cursor ? gt(tryout.id, input.cursor) : undefined,
					input.search ? ilike(tryout.title, `%${input.search}%`) : undefined,
					input.category ? eq(tryout.category, input.category) : undefined,
					input.status ? eq(tryout.status, input.status) : undefined,
				),
			)
			.limit(input.limit + 1)
			.orderBy(tryout.id);

		const hasMore = rows.length > input.limit;
		const tryoutsList = hasMore ? rows.slice(0, input.limit) : rows;
		const lastTryout = tryoutsList.at(-1);

		return {
			tryouts: tryoutsList,
			nextCursor: hasMore && lastTryout ? lastTryout.id : undefined,
		};
	});

const getTryout = admin
	.route({
		path: "/admin/tryouts/{id}",
		method: "GET",
		tags: ["Admin - Tryouts"],
	})
	.input(type({ id: "number" }))
	.handler(async ({ input }) => {
		const [tryoutData] = await db.select().from(tryout).where(eq(tryout.id, input.id)).limit(1);

		if (!tryoutData)
			throw new ORPCError("NOT_FOUND", {
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

const updateTryout = admin
	.route({
		path: "/admin/tryouts/{id}",
		method: "PATCH",
		tags: ["Admin - Tryouts"],
	})
	.input(
		type({
			id: "number",
			title: "string?",
			description: "string?",
			category: type("'sd' | 'smp' | 'sma' | 'utbk'")?.optional(),
			status: type("'draft' | 'published' | 'archived'")?.optional(),
			startsAt: "string?",
			endsAt: "string?",
		}),
	)
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
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
			throw new ORPCError("NOT_FOUND", {
				message: "Tryout tidak ditemukan",
			});

		return { message: "Tryout berhasil diperbarui" };
	});

const deleteTryout = admin
	.route({
		path: "/admin/tryouts/{id}",
		method: "DELETE",
		tags: ["Admin - Tryouts"],
	})
	.input(type({ id: "number" }))
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
		const [deleted] = await db.delete(tryout).where(eq(tryout.id, input.id)).returning();

		if (!deleted) {
			throw new ORPCError("NOT_FOUND", {
				message: "Tryout tidak ditemukan",
			});
		}

		return { message: "Tryout berhasil dihapus" };
	});

const listAccessCodes = admin
	.route({
		path: "/admin/tryouts/{id}/access-codes",
		method: "GET",
		tags: ["Admin - Tryouts"],
	})
	.input(type({ id: "number" }))
	.handler(async ({ input }) => {
		const rows = await db.query.tryoutAccessCode.findMany({
			where: eq(tryoutAccessCode.tryoutId, input.id),
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

const createAccessCode = admin
	.route({
		path: "/admin/tryouts/{id}/access-codes",
		method: "POST",
		tags: ["Admin - Tryouts"],
	})
	.input(
		type({
			id: "number",
			label: "string?",
			code: "string?",
			expiresAt: "string?",
			maxUses: "number?",
		}),
	)
	.handler(async ({ input }) => {
		const existingTryout = await db.query.tryout.findFirst({
			where: eq(tryout.id, input.id),
			columns: { id: true },
		});

		if (!existingTryout) {
			throw new ORPCError("NOT_FOUND", { message: "Tryout tidak ditemukan" });
		}

		if (input.maxUses !== undefined && input.maxUses <= 0) {
			throw new ORPCError("BAD_REQUEST", { message: "Maksimal penggunaan harus lebih dari 0" });
		}

		const plainCode = (input.code?.trim() || generateAccessCode()).toUpperCase();
		const codeHash = createHash("sha256").update(plainCode).digest("hex");

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
					label: tryoutAccessCode.label,
					isActive: tryoutAccessCode.isActive,
					expiresAt: tryoutAccessCode.expiresAt,
					maxUses: tryoutAccessCode.maxUses,
					usedCount: tryoutAccessCode.usedCount,
					createdAt: tryoutAccessCode.createdAt,
				});

			if (!created) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Gagal membuat kode akses",
				});
			}

			return {
				...created,
				code: plainCode,
			};
		} catch {
			throw new ORPCError("CONFLICT", {
				message: "Kode akses sudah ada untuk tryout ini",
			});
		}
	});

const updateAccessCodeStatus = admin
	.route({
		path: "/admin/tryouts/{id}/access-codes/{accessCodeId}",
		method: "PATCH",
		tags: ["Admin - Tryouts"],
	})
	.input(
		type({
			id: "number",
			accessCodeId: "number",
			isActive: "boolean",
		}),
	)
	.handler(async ({ input }) => {
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
			throw new ORPCError("NOT_FOUND", { message: "Kode akses tidak ditemukan" });
		}

		return updated;
	});

export const tryoutRouter = {
	createTryout,
	listTryouts,
	getTryout,
	updateTryout,
	deleteTryout,
	listAccessCodes,
	createAccessCode,
	updateAccessCodeStatus,
	attempts: tryoutAttemptRouter,
};
