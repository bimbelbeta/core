import { describe, expect, test } from "bun:test";
import { generateSlug } from "@bimbelbeta/contract/utils";
import type { ForMemberRow, ProductChanges, ProductInsert, ProductRepository, ProductRow } from "./repository";
import { createProductService } from "./service";

function productRow(overrides: Partial<ProductRow> = {}): ProductRow {
	return {
		id: "prod-1",
		name: "Paket Premium",
		slug: "paket-premium",
		description: null,
		price: "10000",
		type: "subscription",
		variant: "credits",
		fixedExpiryMonth: null,
		fixedExpiryDay: null,
		durationDays: null,
		credits: 100,
		createdAt: new Date("2025-01-01T00:00:00Z"),
		updatedAt: new Date("2025-01-01T00:00:00Z"),
		deletedAt: null,
		...overrides,
	};
}

function memberRow(overrides: Partial<ForMemberRow> = {}): ForMemberRow {
	return {
		id: "prod-1",
		name: "Paket Premium",
		slug: "paket-premium",
		description: null,
		price: "10000",
		type: "subscription",
		variant: "credits",
		fixedExpiryMonth: null,
		fixedExpiryDay: null,
		durationDays: null,
		credits: 100,
		...overrides,
	};
}

function makeRepository(overrides: Partial<ProductRepository> = {}): ProductRepository {
	return {
		listForMember: async () => [],
		listForAdmin: async () => [],
		findById: async () => undefined,
		findBySlug: async () => undefined,
		findDeleted: async () => undefined,
		create: async () => undefined,
		update: async () => undefined,
		softDelete: async () => undefined,
		restore: async () => undefined,
		...overrides,
	};
}

const createInput = {
	name: "Paket Premium",
	price: "10000",
	type: "subscription" as const,
	variant: "credits" as const,
	credits: 100,
};

describe("product service", () => {
	test("create reports an empty insert as a server error", async () => {
		const service = createProductService({ repository: makeRepository() });

		await expect(service.create(createInput)).rejects.toMatchObject({
			code: "INTERNAL_SERVER_ERROR",
			message: "Gagal membuat product",
		});
	});

	test("create requires expiry fields for a fixed_date variant", async () => {
		const inserted: ProductInsert[] = [];
		const service = createProductService({
			repository: makeRepository({
				create: async (values) => {
					inserted.push(values);
					return productRow();
				},
			}),
		});

		await expect(service.create({ ...createInput, variant: "fixed_date", fixedExpiryDay: 31 })).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "fixedExpiryMonth dan fixedExpiryDay wajib diisi untuk variant fixed_date",
		});

		await expect(service.create({ ...createInput, variant: "fixed_date", fixedExpiryMonth: 5 })).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "fixedExpiryMonth dan fixedExpiryDay wajib diisi untuk variant fixed_date",
		});

		await expect(
			service.create({ ...createInput, variant: "fixed_date", fixedExpiryMonth: 13, fixedExpiryDay: 15 }),
		).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "fixedExpiryMonth harus antara 1 dan 12",
		});

		await expect(
			service.create({ ...createInput, variant: "fixed_date", fixedExpiryMonth: 5, fixedExpiryDay: 32 }),
		).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "fixedExpiryDay harus antara 1 dan 31",
		});

		expect(inserted).toHaveLength(0);
	});

	test("create requires a duration for a monthly variant", async () => {
		const service = createProductService({ repository: makeRepository() });

		await expect(service.create({ ...createInput, variant: "monthly" })).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "durationDays wajib diisi untuk variant monthly",
		});

		await expect(service.create({ ...createInput, variant: "monthly", durationDays: 0 })).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "durationDays wajib diisi untuk variant monthly",
		});
	});

	test("create requires a positive credit amount for a credits variant", async () => {
		const service = createProductService({ repository: makeRepository() });

		await expect(service.create({ ...createInput, credits: undefined })).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "credits wajib diisi untuk variant credits",
		});
	});

	test("create refuses a slug that is already taken", async () => {
		const inserted: ProductInsert[] = [];
		const service = createProductService({
			repository: makeRepository({
				findBySlug: async () => productRow({ slug: "paket-premium" }),
				create: async (values) => {
					inserted.push(values);
					return productRow();
				},
			}),
		});

		await expect(service.create({ ...createInput, slug: "  paket-premium  " })).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: 'Slug "paket-premium" sudah digunakan',
		});

		await expect(service.create({ ...createInput, slug: "existing" })).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: 'Slug "existing" sudah digunakan',
		});

		expect(inserted).toHaveLength(0);
	});

	test("create writes a slug derived from the name when none is given", async () => {
		const inserted: ProductInsert[] = [];
		const service = createProductService({
			repository: makeRepository({
				create: async (values) => {
					inserted.push(values);
					return productRow();
				},
			}),
		});

		const result = await service.create({ ...createInput, name: "Paket UTBK 2025", slug: "  " });

		expect(result.message).toBe("Product berhasil dibuat");
		expect(result.id).toBe("prod-1");
		expect(inserted).toHaveLength(1);
		expect(inserted[0]?.slug).toBe(generateSlug("Paket UTBK 2025"));
		expect(inserted[0]?.description).toBeNull();
		expect(inserted[0]?.fixedExpiryMonth).toBeNull();
		expect(inserted[0]?.durationDays).toBeNull();
	});

	test("create keeps only the variant-relevant fields", async () => {
		const inserted: ProductInsert[] = [];
		const service = createProductService({
			repository: makeRepository({
				create: async (values) => {
					inserted.push(values);
					return productRow();
				},
			}),
		});

		await service.create({
			...createInput,
			variant: "fixed_date",
			fixedExpiryMonth: 5,
			fixedExpiryDay: 31,
			durationDays: 30,
			credits: 10,
		});

		expect(inserted[0]?.fixedExpiryMonth).toBe(5);
		expect(inserted[0]?.fixedExpiryDay).toBe(31);
		expect(inserted[0]?.durationDays).toBeNull();
		expect(inserted[0]?.credits).toBeNull();
	});

	test("find reports a missing product as not found", async () => {
		const service = createProductService({ repository: makeRepository() });

		await expect(service.find("missing")).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Product tidak ditemukan",
		});
	});

	test("find returns the stored product", async () => {
		const service = createProductService({
			repository: makeRepository({
				findById: async () => productRow({ description: "Deskripsi" }),
			}),
		});

		await expect(service.find("prod-1")).resolves.toMatchObject({
			product: { id: "prod-1", description: "Deskripsi" },
		});
	});

	test("update refuses an unknown or deleted product", async () => {
		const service = createProductService({ repository: makeRepository() });

		await expect(service.update({ productId: "missing", name: "Baru" })).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Product tidak ditemukan",
		});

		const deleted = createProductService({
			repository: makeRepository({
				findById: async () => productRow({ deletedAt: new Date("2025-02-02T00:00:00Z") }),
			}),
		});

		await expect(deleted.update({ productId: "prod-1", name: "Baru" })).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Tidak dapat mengupdate product yang sudah dihapus. Gunakan restore terlebih dahulu.",
		});
	});

	test("update keeps the new slug unique and unchanged when null", async () => {
		const saved: { productId: string; changes: ProductChanges }[] = [];
		const service = createProductService({
			repository: makeRepository({
				findById: async () => productRow(),
				findBySlug: async (slug) => (slug === "dipakai" ? productRow({ slug: "dipakai" }) : undefined),
				update: async (productId, changes) => {
					saved.push({ productId, changes });
					return productRow(changes);
				},
			}),
		});

		await expect(service.update({ productId: "prod-1", slug: "dipakai" })).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: 'Slug "dipakai" sudah digunakan',
		});

		await service.update({ productId: "prod-1", slug: null });

		expect(saved).toHaveLength(1);
		expect(saved[0]?.changes.slug).toBeUndefined();
	});

	test("update revalidates variant rules against the stored product", async () => {
		const service = createProductService({
			repository: makeRepository({
				findById: async () => productRow({ variant: "monthly", durationDays: null }),
			}),
		});

		await expect(service.update({ productId: "prod-1" })).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "durationDays wajib diisi untuk variant monthly",
		});
	});

	test("update switches a product to credits and clears the other variant fields", async () => {
		const saved: { productId: string; changes: ProductChanges }[] = [];
		const service = createProductService({
			repository: makeRepository({
				findById: async () => productRow({ variant: "fixed_date", fixedExpiryMonth: 5, fixedExpiryDay: 31 }),
				update: async (productId, changes) => {
					saved.push({ productId, changes });
					return productRow(changes);
				},
			}),
		});

		await service.update({ productId: "prod-1", variant: "credits", credits: 50 });

		expect(saved[0]?.changes).toMatchObject({
			variant: "credits",
			credits: 50,
			fixedExpiryMonth: null,
			fixedExpiryDay: null,
			durationDays: null,
		});
		expect(saved[0]?.changes.updatedAt).toBeInstanceOf(Date);
	});

	test("update reports a lost write race as not found", async () => {
		const service = createProductService({
			repository: makeRepository({
				findById: async () => productRow(),
				update: async () => undefined,
			}),
		});

		await expect(service.update({ productId: "prod-1", name: "Baru" })).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Product tidak ditemukan",
		});
	});

	test("remove refuses an unknown or already deleted product", async () => {
		const service = createProductService({ repository: makeRepository() });

		await expect(service.remove("missing")).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Product tidak ditemukan",
		});

		const deleted = createProductService({
			repository: makeRepository({
				findById: async () => productRow({ deletedAt: new Date() }),
			}),
		});

		await expect(deleted.remove("prod-1")).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Product sudah dihapus",
		});
	});

	test("remove soft-deletes and reports the outcome", async () => {
		const removed: string[] = [];
		const service = createProductService({
			repository: makeRepository({
				findById: async () => productRow(),
				softDelete: async (productId) => {
					removed.push(productId);
					return productRow({ deletedAt: new Date() });
				},
			}),
		});

		await expect(service.remove("prod-1")).resolves.toMatchObject({
			message: "Product berhasil dihapus",
		});
		expect(removed).toEqual(["prod-1"]);
	});

	test("restore only revives a deleted product", async () => {
		const service = createProductService({ repository: makeRepository() });

		await expect(service.restore("prod-1")).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Product tidak ditemukan atau belum dihapus",
		});

		const revived: string[] = [];
		const restoring = createProductService({
			repository: makeRepository({
				findDeleted: async () => productRow({ deletedAt: new Date() }),
				restore: async (productId) => {
					revived.push(productId);
					return productRow();
				},
			}),
		});

		await expect(restoring.restore("prod-1")).resolves.toMatchObject({
			message: "Product berhasil dipulihkan",
		});
		expect(revived).toEqual(["prod-1"]);
	});

	test("listForMember caps the page size and builds cursor metadata", async () => {
		const pages: { limit: number; cursorId: string | null; backward: boolean }[] = [];
		const service = createProductService({
			repository: makeRepository({
				listForMember: async (options) => {
					pages.push(options);
					return [memberRow({ id: "prod-9" })];
				},
			}),
		});

		const result = await service.listForMember(undefined);

		expect(pages[0]).toEqual({ limit: 20, cursorId: null, backward: false });
		expect(result.pageInfo).toEqual({
			hasNextPage: false,
			hasPreviousPage: false,
			startCursor: "cHJvZC05",
			endCursor: "cHJvZC05",
		});

		await service.listForMember({ limit: 500, before: "cHJvZC05" });

		expect(pages[1]).toEqual({ limit: 100, cursorId: "prod-9", backward: true });
	});

	test("listForAdmin forwards filters and caps the page size", async () => {
		const pages: {
			limit: number;
			cursorId: string | null;
			backward: boolean;
			search?: string;
			variant?: "fixed_date" | "monthly" | "credits";
			includeDeleted: boolean;
		}[] = [];
		const service = createProductService({
			repository: makeRepository({
				listForAdmin: async (options) => {
					pages.push(options);
					return [productRow()];
				},
			}),
		});

		await service.listForAdmin({ search: "paket", includeDeleted: true });

		expect(pages[0]).toEqual({
			limit: 10,
			cursorId: null,
			backward: false,
			search: "paket",
			includeDeleted: true,
		});

		await service.listForAdmin({ limit: 350, variant: "monthly" });

		expect(pages[1]).toMatchObject({ limit: 100, variant: "monthly" });
	});
});
