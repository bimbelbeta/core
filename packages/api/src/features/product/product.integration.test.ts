import { afterAll, describe, expect, test } from "bun:test";
import { db } from "@bimbelbeta/db";
import { product } from "@bimbelbeta/db/schema/transaction";
import { call } from "@orpc/server";
import { eq } from "drizzle-orm";
import type { Session } from "@/context";
import { appRouter } from "@/routers";

const enabled = !!process.env.TEST_DATABASE_URL && process.env.DATABASE_URL === process.env.TEST_DATABASE_URL;
const id = `product-it-${crypto.randomUUID()}`;
const now = new Date();
const session = {
	user: {
		id,
		name: id,
		email: `${id}@example.com`,
		emailVerified: false,
		image: null,
		createdAt: now,
		updatedAt: now,
		role: "superadmin",
		isPremium: false,
		premiumExpiresAt: null,
		tryoutCredits: 0,
		targetUniversityId: null,
		targetStudyProgramId: null,
	},
	session: {
		id,
		userId: id,
		token: id,
		expiresAt: new Date("2100-01-01"),
		createdAt: now,
		updatedAt: now,
		ipAddress: null,
		userAgent: null,
	},
} satisfies Session;
const options = { context: { session } };
const created: string[] = [];

describe.skipIf(!enabled)("product feature slice", () => {
	afterAll(async () => {
		for (const productId of created) await db.delete(product).where(eq(product.id, productId));
	});

	test("an unknown product slug still returns NOT_FOUND", async () => {
		await expect(call(appRouter.transaction.subscribe, { slug: "does-not-exist" }, options)).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Produk tidak ditemukan.",
		});
	});

	test("runs the admin product write path end to end", async () => {
		await expect(
			call(appRouter.admin.products.find, { productId: crypto.randomUUID() }, options),
		).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Product tidak ditemukan",
		});

		await expect(
			call(
				appRouter.admin.products.create,
				{ name: "Gagal", price: "10000", type: "subscription", variant: "fixed_date", fixedExpiryDay: 31 },
				options,
			),
		).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "fixedExpiryMonth dan fixedExpiryDay wajib diisi untuk variant fixed_date",
		});

		const made = await call(
			appRouter.admin.products.create,
			{
				name: id,
				slug: id,
				description: "Deskripsi",
				price: "10000",
				type: "subscription",
				variant: "fixed_date",
				fixedExpiryMonth: 5,
				fixedExpiryDay: 31,
			},
			options,
		);
		created.push(made.id);
		expect(made.message).toBe("Product berhasil dibuat");

		await expect(
			call(
				appRouter.admin.products.create,
				{ name: "Ulang", slug: id, price: "10000", type: "subscription", variant: "credits", credits: 1 },
				options,
			),
		).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: `Slug "${id}" sudah digunakan`,
		});

		const found = await call(appRouter.admin.products.find, { productId: made.id }, options);
		expect(found.product).toMatchObject({
			id: made.id,
			name: id,
			slug: id,
			variant: "fixed_date",
			fixedExpiryMonth: 5,
			fixedExpiryDay: 31,
			deletedAt: null,
		});

		const listed = await call(appRouter.admin.products.list, { search: id }, options);
		expect(listed.items.map((item) => item.id)).toContain(made.id);

		await call(appRouter.admin.products.update, { productId: made.id, price: "20000", credits: 5 }, options);
		expect((await call(appRouter.admin.products.find, { productId: made.id }, options)).product.price).toBe("20000");

		const memberListed = await call(appRouter.product.list, {}, options);
		expect(Array.isArray(memberListed.items)).toBe(true);
		expect(Object.keys(memberListed.pageInfo).sort()).toEqual([
			"endCursor",
			"hasNextPage",
			"hasPreviousPage",
			"startCursor",
		]);
		for (const item of memberListed.items) {
			expect("createdAt" in item).toBe(false);
			expect("updatedAt" in item).toBe(false);
			expect("deletedAt" in item).toBe(false);
		}

		await call(appRouter.admin.products.remove, { productId: made.id }, options);
		expect((await call(appRouter.admin.products.find, { productId: made.id }, options)).product.deletedAt).not.toBe(
			null,
		);
		await expect(
			call(appRouter.admin.products.update, { productId: made.id, name: "Hidup lagi" }, options),
		).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Tidak dapat mengupdate product yang sudah dihapus. Gunakan restore terlebih dahulu.",
		});

		await expect(call(appRouter.admin.products.restore, { productId: made.id }, options)).resolves.toMatchObject({
			message: "Product berhasil dipulihkan",
		});
		expect((await call(appRouter.admin.products.find, { productId: made.id }, options)).product.deletedAt).toBe(null);

		await expect(call(appRouter.admin.products.restore, { productId: made.id }, options)).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Product tidak ditemukan atau belum dihapus",
		});

		await expect(
			call(appRouter.admin.products.remove, { productId: crypto.randomUUID() }, options),
		).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Product tidak ditemukan",
		});
	});
});
