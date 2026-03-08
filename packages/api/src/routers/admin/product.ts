import { db } from "@bimbelbeta/db";
import { product } from "@bimbelbeta/db/schema/transaction";
import { type } from "arktype";
import { and, desc, eq, gt, ilike, isNotNull, isNull } from "drizzle-orm";
import { superadmin } from "../..";
import { generateSlug } from "../../lib/utils";

const list = superadmin
	.route({
		path: "/admin/products",
		method: "GET",
		tags: ["Admin - Products"],
	})
	.input(
		type({
			cursor: "string?",
			limit: "number = 10",
			search: "string?",
			variant: type("'fixed_date' | 'monthly' | 'credits'")?.optional(),
			includeDeleted: "boolean?",
		}),
	)
	.handler(async ({ input }) => {
		const rows = await db
			.select()
			.from(product)
			.where(
				and(
					input.cursor ? gt(product.id, input.cursor) : undefined,
					input.search ? ilike(product.name, `%${input.search}%`) : undefined,
					input.variant ? eq(product.variant, input.variant) : undefined,
					!input.includeDeleted ? isNull(product.deletedAt) : undefined,
				),
			)
			.limit(input.limit + 1)
			.orderBy(desc(product.createdAt));

		const hasMore = rows.length > input.limit;
		const products = hasMore ? rows.slice(0, input.limit) : rows;
		const lastProduct = products.at(-1);

		return {
			products,
			nextCursor: hasMore && lastProduct?.id ? lastProduct.id : undefined,
		};
	});

const find = superadmin
	.route({
		path: "/admin/products/{productId}",
		method: "GET",
		tags: ["Admin - Products"],
	})
	.input(type({ productId: "string" }))
	.handler(async ({ input, errors }) => {
		const [productData] = await db.select().from(product).where(eq(product.id, input.productId)).limit(1);

		if (!productData) {
			throw errors.NOT_FOUND({
				message: "Product tidak ditemukan",
			});
		}

		return { product: productData };
	});

const create = superadmin
	.route({
		path: "/admin/products",
		method: "POST",
		tags: ["Admin - Products"],
	})
	.input(
		type({
			name: "string",
			slug: "string?",
			description: "string?",
			price: "string",
			type: type("'subscription' | 'product'"),
			variant: type("'fixed_date' | 'monthly' | 'credits'"),
			fixedExpiryMonth: "number?",
			fixedExpiryDay: "number?",
			durationDays: "number?",
			credits: "number?",
		}),
	)
	.output(type({ message: "string", id: "string" }))
	.handler(async ({ input, errors }) => {
		if (input.variant === "fixed_date") {
			if (!input.fixedExpiryMonth || !input.fixedExpiryDay) {
				throw errors.BAD_REQUEST({
					message: "fixedExpiryMonth dan fixedExpiryDay wajib diisi untuk variant fixed_date",
				});
			}
			if (input.fixedExpiryMonth < 1 || input.fixedExpiryMonth > 12) {
				throw errors.BAD_REQUEST({
					message: "fixedExpiryMonth harus antara 1 dan 12",
				});
			}
			if (input.fixedExpiryDay < 1 || input.fixedExpiryDay > 31) {
				throw errors.BAD_REQUEST({
					message: "fixedExpiryDay harus antara 1 dan 31",
				});
			}
		}

		if (input.variant === "monthly") {
			if (!input.durationDays || input.durationDays < 1) {
				throw errors.BAD_REQUEST({
					message: "durationDays wajib diisi untuk variant monthly",
				});
			}
		}

		if (input.variant === "credits") {
			if (!input.credits || input.credits < 1) {
				throw errors.BAD_REQUEST({
					message: "credits wajib diisi untuk variant credits",
				});
			}
		}

		const slug = input.slug?.trim() || generateSlug(input.name);

		const [existingSlug] = await db.select().from(product).where(eq(product.slug, slug)).limit(1);
		if (existingSlug) {
			throw errors.BAD_REQUEST({
				message: `Slug "${slug}" sudah digunakan`,
			});
		}

		const [created] = await db
			.insert(product)
			.values({
				name: input.name,
				slug,
				description: input.description ?? null,
				price: input.price,
				type: input.type,
				variant: input.variant,
				fixedExpiryMonth: input.variant === "fixed_date" ? input.fixedExpiryMonth : null,
				fixedExpiryDay: input.variant === "fixed_date" ? input.fixedExpiryDay : null,
				durationDays: input.variant === "monthly" ? input.durationDays : null,
				credits: input.variant === "credits" ? input.credits : null,
			})
			.returning();

		if (!created) {
			throw errors.INTERNAL_SERVER_ERROR({
				message: "Gagal membuat product",
			});
		}

		return {
			message: "Product berhasil dibuat",
			id: created.id,
		};
	});

const update = superadmin
	.route({
		path: "/admin/products/{productId}",
		method: "PATCH",
		tags: ["Admin - Products"],
	})
	.input(
		type({
			productId: "string",
			name: "string?",
			slug: "string?",
			description: "string?",
			price: "string?",
			type: type("'subscription' | 'product'")?.optional(),
			variant: type("'fixed_date' | 'monthly' | 'credits'")?.optional(),
			fixedExpiryMonth: "number?",
			fixedExpiryDay: "number?",
			durationDays: "number?",
			credits: "number?",
		}),
	)
	.output(type({ message: "string" }))
	.handler(async ({ input, errors }) => {
		const [existing] = await db.select().from(product).where(eq(product.id, input.productId)).limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				message: "Product tidak ditemukan",
			});
		}

		if (existing.deletedAt) {
			throw errors.BAD_REQUEST({
				message: "Tidak dapat mengupdate product yang sudah dihapus. Gunakan restore terlebih dahulu.",
			});
		}

		const effectiveVariant = input.variant ?? existing.variant;

		if (effectiveVariant === "fixed_date") {
			const month = input.fixedExpiryMonth ?? existing.fixedExpiryMonth;
			const day = input.fixedExpiryDay ?? existing.fixedExpiryDay;
			if (!month || !day) {
				throw errors.BAD_REQUEST({
					message: "fixedExpiryMonth dan fixedExpiryDay wajib diisi untuk variant fixed_date",
				});
			}
		}

		if (effectiveVariant === "monthly") {
			const duration = input.durationDays ?? existing.durationDays;
			if (!duration || duration < 1) {
				throw errors.BAD_REQUEST({
					message: "durationDays wajib diisi untuk variant monthly",
				});
			}
		}

		if (effectiveVariant === "credits") {
			const credits = input.credits ?? existing.credits;
			if (!credits || credits < 1) {
				throw errors.BAD_REQUEST({
					message: "credits wajib diisi untuk variant credits",
				});
			}
		}

		if (input.slug && input.slug !== existing.slug) {
			const [slugConflict] = await db.select().from(product).where(eq(product.slug, input.slug)).limit(1);
			if (slugConflict) {
				throw errors.BAD_REQUEST({
					message: `Slug "${input.slug}" sudah digunakan`,
				});
			}
		}

		const updateData: {
			name?: string;
			slug?: string;
			description?: string | null;
			price?: string;
			type?: "subscription" | "product";
			variant?: "fixed_date" | "monthly" | "credits";
			fixedExpiryMonth?: number | null;
			fixedExpiryDay?: number | null;
			durationDays?: number | null;
			credits?: number | null;
			updatedAt: Date;
		} = {
			updatedAt: new Date(),
		};

		if (input.name !== undefined) updateData.name = input.name;
		if (input.slug !== undefined) updateData.slug = input.slug;
		if (input.description !== undefined) updateData.description = input.description ?? null;
		if (input.price !== undefined) updateData.price = input.price;
		if (input.type !== undefined) updateData.type = input.type;
		if (input.variant !== undefined) {
			updateData.variant = input.variant;
			if (input.variant === "fixed_date") {
				updateData.fixedExpiryMonth = input.fixedExpiryMonth ?? existing.fixedExpiryMonth;
				updateData.fixedExpiryDay = input.fixedExpiryDay ?? existing.fixedExpiryDay;
				updateData.durationDays = null;
				updateData.credits = null;
			} else if (input.variant === "monthly") {
				updateData.durationDays = input.durationDays ?? existing.durationDays;
				updateData.fixedExpiryMonth = null;
				updateData.fixedExpiryDay = null;
				updateData.credits = null;
			} else if (input.variant === "credits") {
				updateData.credits = input.credits ?? existing.credits;
				updateData.fixedExpiryMonth = null;
				updateData.fixedExpiryDay = null;
				updateData.durationDays = null;
			}
		} else {
			if (input.fixedExpiryMonth !== undefined) updateData.fixedExpiryMonth = input.fixedExpiryMonth;
			if (input.fixedExpiryDay !== undefined) updateData.fixedExpiryDay = input.fixedExpiryDay;
			if (input.durationDays !== undefined) updateData.durationDays = input.durationDays;
			if (input.credits !== undefined) updateData.credits = input.credits;
		}

		const [updated] = await db.update(product).set(updateData).where(eq(product.id, input.productId)).returning();

		if (!updated) {
			throw errors.INTERNAL_SERVER_ERROR({
				message: "Gagal memperbarui product",
			});
		}

		return { message: "Product berhasil diperbarui" };
	});

const deleteProduct = superadmin
	.route({
		path: "/admin/products/{productId}",
		method: "DELETE",
		tags: ["Admin - Products"],
	})
	.input(type({ productId: "string" }))
	.output(type({ message: "string" }))
	.handler(async ({ input, errors }) => {
		const [existing] = await db.select().from(product).where(eq(product.id, input.productId)).limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				message: "Product tidak ditemukan",
			});
		}

		if (existing.deletedAt) {
			throw errors.BAD_REQUEST({
				message: "Product sudah dihapus",
			});
		}

		const [updated] = await db
			.update(product)
			.set({ deletedAt: new Date() })
			.where(eq(product.id, input.productId))
			.returning();

		if (!updated) {
			throw errors.INTERNAL_SERVER_ERROR({
				message: "Gagal menghapus product",
			});
		}

		return { message: "Product berhasil dihapus" };
	});

const restore = superadmin
	.route({
		path: "/admin/products/{productId}/restore",
		method: "POST",
		tags: ["Admin - Products"],
	})
	.input(type({ productId: "string" }))
	.output(type({ message: "string" }))
	.handler(async ({ input, errors }) => {
		const [existing] = await db
			.select()
			.from(product)
			.where(and(eq(product.id, input.productId), isNotNull(product.deletedAt)))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				message: "Product tidak ditemukan atau belum dihapus",
			});
		}

		const [updated] = await db
			.update(product)
			.set({ deletedAt: null })
			.where(eq(product.id, input.productId))
			.returning();

		if (!updated) {
			throw errors.INTERNAL_SERVER_ERROR({
				message: "Gagal memulihkan product",
			});
		}

		return { message: "Product berhasil dipulihkan" };
	});

export const adminProductRouter = {
	list,
	find,
	create,
	update,
	delete: deleteProduct,
	restore,
};
