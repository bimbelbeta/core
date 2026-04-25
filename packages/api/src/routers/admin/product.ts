import { generateSlug } from "@bimbelbeta/contract/utils";
import { db } from "@bimbelbeta/db";
import { product } from "@bimbelbeta/db/schema/transaction";
import { and, asc, desc, eq, gt, ilike, isNotNull, isNull, lt } from "drizzle-orm";
import { decodeCursor, encodeCursor } from "@/lib/pagination/cursor";
import { baseImplementer } from "@/lib/router-definition";
import { rateLimit, requireAuth, requireSuperAdmin } from "@/lib/router-definition/middleware";

const superadmin = baseImplementer.use(requireAuth).use(rateLimit).use(requireSuperAdmin);

const list = superadmin.admin.products.list.handler(async ({ input }) => {
	const limit = input.limit ?? 10;
	const isBackward = !!input.before;
	const cursorStr = input.before || input.after;
	const cursorId = cursorStr ? decodeCursor(cursorStr) : undefined;

	let rows = await db
		.select()
		.from(product)
		.where(
			and(
				cursorId !== undefined ? (isBackward ? lt(product.id, cursorId) : gt(product.id, cursorId)) : undefined,
				input.search ? ilike(product.name, `%${input.search}%`) : undefined,
				input.variant ? eq(product.variant, input.variant) : undefined,
				!input.includeDeleted ? isNull(product.deletedAt) : undefined,
			),
		)
		.orderBy(isBackward ? desc(product.id) : asc(product.id))
		.limit(limit + 1);

	const hasExtra = rows.length > limit;
	if (hasExtra) rows = rows.slice(0, limit);
	if (isBackward) rows.reverse();

	const firstItem = rows[0];
	const lastItem = rows[rows.length - 1];

	return {
		items: rows,
		pageInfo: {
			hasNextPage: isBackward ? !!cursorStr : hasExtra,
			hasPreviousPage: isBackward ? hasExtra : !!cursorStr,
			startCursor: firstItem ? encodeCursor(firstItem.id) : null,
			endCursor: lastItem ? encodeCursor(lastItem.id) : null,
		},
	};
});

const find = superadmin.admin.products.find.handler(async ({ input, errors }) => {
	const [productData] = await db.select().from(product).where(eq(product.id, input.productId)).limit(1);

	if (!productData) {
		throw errors.NOT_FOUND({ message: "Product tidak ditemukan" });
	}

	return { product: productData };
});

const create = superadmin.admin.products.create.handler(async ({ input, errors }) => {
	if (input.variant === "fixed_date") {
		if (!input.fixedExpiryMonth || !input.fixedExpiryDay) {
			throw errors.BAD_REQUEST({
				message: "fixedExpiryMonth dan fixedExpiryDay wajib diisi untuk variant fixed_date",
			});
		}
		if (input.fixedExpiryMonth < 1 || input.fixedExpiryMonth > 12) {
			throw errors.BAD_REQUEST({ message: "fixedExpiryMonth harus antara 1 dan 12" });
		}
		if (input.fixedExpiryDay < 1 || input.fixedExpiryDay > 31) {
			throw errors.BAD_REQUEST({ message: "fixedExpiryDay harus antara 1 dan 31" });
		}
	}

	if (input.variant === "monthly") {
		if (!input.durationDays || input.durationDays < 1) {
			throw errors.BAD_REQUEST({ message: "durationDays wajib diisi untuk variant monthly" });
		}
	}

	if (input.variant === "credits") {
		if (!input.credits || input.credits < 1) {
			throw errors.BAD_REQUEST({ message: "credits wajib diisi untuk variant credits" });
		}
	}

	const slug = input.slug?.trim() || generateSlug(input.name);

	const [existingSlug] = await db.select().from(product).where(eq(product.slug, slug)).limit(1);
	if (existingSlug) {
		throw errors.BAD_REQUEST({ message: `Slug "${slug}" sudah digunakan` });
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
		throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal membuat product" });
	}

	return {
		message: "Product berhasil dibuat",
		id: created.id,
	};
});

const update = superadmin.admin.products.update.handler(async ({ input, errors }) => {
	const [existing] = await db.select().from(product).where(eq(product.id, input.productId)).limit(1);

	if (!existing) {
		throw errors.NOT_FOUND({ message: "Product tidak ditemukan" });
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
			throw errors.BAD_REQUEST({ message: "durationDays wajib diisi untuk variant monthly" });
		}
	}

	if (effectiveVariant === "credits") {
		const credits = input.credits ?? existing.credits;
		if (!credits || credits < 1) {
			throw errors.BAD_REQUEST({ message: "credits wajib diisi untuk variant credits" });
		}
	}

	const nextSlug = input.slug === null ? undefined : input.slug;

	if (nextSlug && nextSlug !== existing.slug) {
		const [slugConflict] = await db.select().from(product).where(eq(product.slug, nextSlug)).limit(1);
		if (slugConflict) {
			throw errors.BAD_REQUEST({ message: `Slug "${nextSlug}" sudah digunakan` });
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
	if (nextSlug !== undefined) updateData.slug = nextSlug;
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
		throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal memperbarui product" });
	}

	return { message: "Product berhasil diperbarui" };
});

const remove = superadmin.admin.products.remove.handler(async ({ input, errors }) => {
	const [existing] = await db.select().from(product).where(eq(product.id, input.productId)).limit(1);

	if (!existing) {
		throw errors.NOT_FOUND({ message: "Product tidak ditemukan" });
	}

	if (existing.deletedAt) {
		throw errors.BAD_REQUEST({ message: "Product sudah dihapus" });
	}

	const [updated] = await db
		.update(product)
		.set({ deletedAt: new Date() })
		.where(eq(product.id, input.productId))
		.returning();

	if (!updated) {
		throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal menghapus product" });
	}

	return { message: "Product berhasil dihapus" };
});

const restore = superadmin.admin.products.restore.handler(async ({ input, errors }) => {
	const [existing] = await db
		.select()
		.from(product)
		.where(and(eq(product.id, input.productId), isNotNull(product.deletedAt)))
		.limit(1);

	if (!existing) {
		throw errors.NOT_FOUND({ message: "Product tidak ditemukan atau belum dihapus" });
	}

	const [updated] = await db
		.update(product)
		.set({ deletedAt: null })
		.where(eq(product.id, input.productId))
		.returning();

	if (!updated) {
		throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal memulihkan product" });
	}

	return { message: "Product berhasil dipulihkan" };
});

export const adminProductRouter = {
	list,
	find,
	create,
	update,
	remove,
	restore,
};
