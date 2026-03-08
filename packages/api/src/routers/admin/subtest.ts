import { db } from "@bimbelbeta/db";
import { tryout, tryoutSubtest } from "@bimbelbeta/db/schema/tryout";
import { type } from "arktype";
import { eq, sql } from "drizzle-orm";
import { admin } from "../..";

const getSubtest = admin
	.route({
		path: "/admin/tryouts/subtests/{id}",
		method: "GET",
		tags: ["Admin - Tryouts"],
	})
	.input(type({ id: "number" }))
	.output(
		type({
			id: "number",
			tryoutId: "number",
			name: "string",
			"description?": "string | null",
			duration: "number",
			questionOrder: "string",
			order: "number",
			"scoringMap?": "Record<string, number> | null",
		}),
	)
	.handler(async ({ input, errors }) => {
		const [subtest] = await db.select().from(tryoutSubtest).where(eq(tryoutSubtest.id, input.id)).limit(1);

		if (!subtest) {
			throw errors.NOT_FOUND({
				message: "Subtest tidak ditemukan",
			});
		}

		return subtest;
	});

const createSubtest = admin
	.route({
		path: "/admin/tryouts/{tryoutId}/subtests",
		method: "POST",
		tags: ["Admin - Tryouts"],
	})
	.input(
		type({
			tryoutId: "number",
			name: "string",
			description: "string?",
			duration: "number?",
			questionOrder: type("'random' | 'sequential'")?.optional(),
		}),
	)
	.output(type({ message: "string", id: "number" }))
	.handler(async ({ input, errors }) => {
		const [tryoutExists] = await db
			.select({ id: tryout.id })
			.from(tryout)
			.where(eq(tryout.id, input.tryoutId))
			.limit(1);

		if (!tryoutExists)
			throw errors.NOT_FOUND({
				message: "Tryout tidak ditemukan",
			});

		const [maxOrderResult] = await db
			.select({ maxOrder: sql<number>`max(${tryoutSubtest.order})` })
			.from(tryoutSubtest)
			.where(eq(tryoutSubtest.tryoutId, input.tryoutId));

		const nextOrder = (maxOrderResult?.maxOrder ?? 0) + 1;

		const [created] = await db
			.insert(tryoutSubtest)
			.values({
				tryoutId: input.tryoutId,
				name: input.name,
				description: input.description ?? null,
				duration: input.duration ?? 0,
				questionOrder: input.questionOrder ?? "sequential",
				order: nextOrder,
			})
			.returning();

		if (!created)
			throw errors.INTERNAL_SERVER_ERROR({
				message: "Gagal membuat subtest",
			});

		return {
			message: "Subtest berhasil dibuat",
			id: created.id,
		};
	});

const updateSubtest = admin
	.route({
		path: "/admin/tryouts/subtests/{id}",
		method: "PATCH",
		tags: ["Admin - Tryouts"],
	})
	.input(
		type({
			id: "number",
			name: "string?",
			description: "string?",
			duration: "number?",
			questionOrder: type("'random' | 'sequential'")?.optional(),
			"scoringMap?": type("Record<string, number>").or("null"),
		}),
	)
	.output(type({ message: "string" }))
	.handler(async ({ input, errors }) => {
		const updateData: {
			name?: string;
			description?: string | null;
			duration?: number;
			questionOrder?: "random" | "sequential";
			scoringMap?: Record<string, number> | null;
		} = {};

		if (input.name !== undefined) updateData.name = input.name;
		if (input.description !== undefined) updateData.description = input.description ?? null;
		if (input.duration !== undefined) updateData.duration = input.duration;
		if (input.questionOrder !== undefined) updateData.questionOrder = input.questionOrder;
		if (input.scoringMap !== undefined) updateData.scoringMap = input.scoringMap;

		const [updated] = await db.update(tryoutSubtest).set(updateData).where(eq(tryoutSubtest.id, input.id)).returning();

		if (!updated)
			throw errors.NOT_FOUND({
				message: "Subtest tidak ditemukan",
			});

		return { message: "Subtest berhasil diperbarui" };
	});

const deleteSubtest = admin
	.route({
		path: "/admin/tryouts/subtests/{id}",
		method: "DELETE",
		tags: ["Admin - Tryouts"],
	})
	.input(type({ id: "number" }))
	.output(type({ message: "string" }))
	.handler(async ({ input, errors }) => {
		const [deleted] = await db.delete(tryoutSubtest).where(eq(tryoutSubtest.id, input.id)).returning();

		if (!deleted) {
			throw errors.NOT_FOUND({
				message: "Subtest tidak ditemukan",
			});
		}

		return { message: "Subtest berhasil dihapus" };
	});

export const subtestRouter = {
	getSubtest,
	createSubtest,
	updateSubtest,
	deleteSubtest,
};
