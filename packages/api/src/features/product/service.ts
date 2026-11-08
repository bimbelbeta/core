import { generateSlug } from "@bimbelbeta/contract/utils";
import { db } from "@bimbelbeta/db";
import { DomainError } from "@/lib/domain-error";
import { buildStringIdCursorPage, decodeStringIdPage } from "@/lib/pagination/cursor";
import { createProductRepository, type ProductChanges, type ProductRepository, type ProductRow } from "./repository";

export type MemberListInput = { limit?: number; after?: string; before?: string };

export type AdminListInput = {
	limit?: number;
	after?: string;
	before?: string;
	search?: string;
	variant?: ProductRow["variant"];
	includeDeleted?: boolean;
};

export type CreateProductInput = {
	name: string;
	slug?: string | null;
	description?: string | null;
	price: string;
	type: ProductRow["type"];
	variant: ProductRow["variant"];
	fixedExpiryMonth?: number | null;
	fixedExpiryDay?: number | null;
	durationDays?: number | null;
	credits?: number | null;
};

export type UpdateProductInput = {
	productId: string;
	name?: string;
	slug?: string | null;
	description?: string | null;
	price?: string;
	type?: ProductRow["type"];
	variant?: ProductRow["variant"];
	fixedExpiryMonth?: number | null;
	fixedExpiryDay?: number | null;
	durationDays?: number | null;
	credits?: number | null;
};

function productNotFound() {
	return new DomainError("NOT_FOUND", "Product tidak ditemukan");
}

export function createProductService({ repository }: { repository: ProductRepository }) {
	return {
		async listForMember(input: MemberListInput | undefined) {
			const { limit, backward, cursorId, hasCursor } = decodeStringIdPage(input);
			const rows = await repository.listForMember({
				limit,
				cursorId: cursorId ?? null,
				backward,
			});
			return buildStringIdCursorPage(rows, limit, backward, hasCursor);
		},

		async listForAdmin(input: AdminListInput) {
			const { limit, backward, cursorId, hasCursor } = decodeStringIdPage(input, 10);
			const rows = await repository.listForAdmin({
				limit,
				cursorId: cursorId ?? null,
				backward,
				search: input.search,
				variant: input.variant,
				includeDeleted: !!input.includeDeleted,
			});
			return buildStringIdCursorPage(rows, limit, backward, hasCursor);
		},

		async find(productId: string) {
			const found = await repository.findById(productId);
			if (!found) throw productNotFound();
			return { product: found };
		},

		async create(input: CreateProductInput) {
			if (input.variant === "fixed_date") {
				if (!input.fixedExpiryMonth || !input.fixedExpiryDay) {
					throw new DomainError(
						"BAD_REQUEST",
						"fixedExpiryMonth dan fixedExpiryDay wajib diisi untuk variant fixed_date",
					);
				}
				if (input.fixedExpiryMonth < 1 || input.fixedExpiryMonth > 12) {
					throw new DomainError("BAD_REQUEST", "fixedExpiryMonth harus antara 1 dan 12");
				}
				if (input.fixedExpiryDay < 1 || input.fixedExpiryDay > 31) {
					throw new DomainError("BAD_REQUEST", "fixedExpiryDay harus antara 1 dan 31");
				}
			}

			if (input.variant === "monthly") {
				if (!input.durationDays || input.durationDays < 1) {
					throw new DomainError("BAD_REQUEST", "durationDays wajib diisi untuk variant monthly");
				}
			}

			if (input.variant === "credits") {
				if (!input.credits || input.credits < 1) {
					throw new DomainError("BAD_REQUEST", "credits wajib diisi untuk variant credits");
				}
			}

			const slug = input.slug?.trim() || generateSlug(input.name);

			const existingSlug = await repository.findBySlug(slug);
			if (existingSlug) {
				throw new DomainError("BAD_REQUEST", `Slug "${slug}" sudah digunakan`);
			}

			const created = await repository.create({
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
			});

			if (!created) {
				throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal membuat product");
			}

			return {
				message: "Product berhasil dibuat",
				id: created.id,
			};
		},

		async update(input: UpdateProductInput) {
			const existing = await repository.findById(input.productId);

			if (!existing) {
				throw productNotFound();
			}

			if (existing.deletedAt) {
				throw new DomainError(
					"BAD_REQUEST",
					"Tidak dapat mengupdate product yang sudah dihapus. Gunakan restore terlebih dahulu.",
				);
			}

			const effectiveVariant = input.variant ?? existing.variant;

			if (effectiveVariant === "fixed_date") {
				const month = input.fixedExpiryMonth ?? existing.fixedExpiryMonth;
				const day = input.fixedExpiryDay ?? existing.fixedExpiryDay;
				if (!month || !day) {
					throw new DomainError(
						"BAD_REQUEST",
						"fixedExpiryMonth dan fixedExpiryDay wajib diisi untuk variant fixed_date",
					);
				}
			}

			if (effectiveVariant === "monthly") {
				const duration = input.durationDays ?? existing.durationDays;
				if (!duration || duration < 1) {
					throw new DomainError("BAD_REQUEST", "durationDays wajib diisi untuk variant monthly");
				}
			}

			if (effectiveVariant === "credits") {
				const credits = input.credits ?? existing.credits;
				if (!credits || credits < 1) {
					throw new DomainError("BAD_REQUEST", "credits wajib diisi untuk variant credits");
				}
			}

			const nextSlug = input.slug === null ? undefined : input.slug;

			if (nextSlug && nextSlug !== existing.slug) {
				const slugConflict = await repository.findBySlug(nextSlug);
				if (slugConflict) {
					throw new DomainError("BAD_REQUEST", `Slug "${nextSlug}" sudah digunakan`);
				}
			}

			const updateData: ProductChanges = {
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

			const updated = await repository.update(input.productId, updateData);

			if (!updated) {
				throw productNotFound();
			}

			return { message: "Product berhasil diperbarui" };
		},

		async remove(productId: string) {
			const existing = await repository.findById(productId);

			if (!existing) {
				throw productNotFound();
			}

			if (existing.deletedAt) {
				throw new DomainError("BAD_REQUEST", "Product sudah dihapus");
			}

			const deleted = await repository.softDelete(productId);

			if (!deleted) {
				throw productNotFound();
			}

			return { message: "Product berhasil dihapus" };
		},

		async restore(productId: string) {
			const existing = await repository.findDeleted(productId);

			if (!existing) {
				throw new DomainError("NOT_FOUND", "Product tidak ditemukan atau belum dihapus");
			}

			const restored = await repository.restore(productId);

			if (!restored) {
				throw productNotFound();
			}

			return { message: "Product berhasil dipulihkan" };
		},
	};
}

export const productService = createProductService({
	repository: createProductRepository(db),
});
