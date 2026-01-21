import { db } from "@bimbelbeta/db";
import { tryout } from "@bimbelbeta/db/schema/tryout";
import { ORPCError } from "@orpc/client";
import { type } from "arktype";
import { and, count, eq, like } from "drizzle-orm";
import { admin } from "../..";

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
			duration: "number",
			status: type("'draft' | 'published' | 'archived'")?.optional(),
			startsAt: "string?",
			endsAt: "string?",
		}),
	)
	.output(type({ message: "string", id: "number" }))
	.handler(async ({ input }) => {
		if (input.duration < 0 || input.duration > 500) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Durasi harus antara 0 dan 500 menit",
			});
		}

		const [created] = await db
			.insert(tryout)
			.values({
				title: input.title,
				description: input.description ?? null,
				category: input.category,
				duration: input.duration,
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
			page: "number = 1",
			limit: "number = 10",
			search: "string?",
			category: type("'sd' | 'smp' | 'sma' | 'utbk'")?.optional(),
			status: type("'draft' | 'published' | 'archived'")?.optional(),
		}),
	)
	.output(
		type({
			tryouts: "unknown",
			total: "number",
			page: "number",
			limit: "number",
		}),
	)
	.handler(async ({ input }) => {
		const offset = (input.page - 1) * input.limit;

		const conditions = [];

		if (input.search) {
			conditions.push(like(tryout.title, `%${input.search}%`));
		}

		if (input.category) {
			conditions.push(eq(tryout.category, input.category));
		}

		if (input.status) {
			conditions.push(eq(tryout.status, input.status));
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		const tryoutsList = await db
			.select()
			.from(tryout)
			.where(whereClause)
			.limit(input.limit)
			.offset(offset)
			.orderBy(tryout.createdAt);

		const [countResult] = await db.select({ value: count() }).from(tryout).where(whereClause);
		const total = countResult?.value ?? 0;

		return {
			tryouts: tryoutsList,
			total,
			page: input.page,
			limit: input.limit,
		};
	});

const getTryout = admin
	.route({
		path: "/admin/tryouts/{id}",
		method: "GET",
		tags: ["Admin - Tryouts"],
	})
	.input(type({ id: "number" }))
	.output(type({ tryout: "unknown", subtests: "unknown" }))
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
			duration: "number?",
			status: type("'draft' | 'published' | 'archived'")?.optional(),
			startsAt: "string?",
			endsAt: "string?",
		}),
	)
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
		if (input.duration !== undefined && (input.duration < 0 || input.duration > 500)) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Durasi harus antara 0 dan 500 menit",
			});
		}

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
		if (input.duration !== undefined) updateData.duration = input.duration;
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

export const tryoutRouter = {
	createTryout,
	listTryouts,
	getTryout,
	updateTryout,
	deleteTryout,
};
