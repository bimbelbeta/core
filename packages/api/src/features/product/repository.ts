import type { DbClient } from "@bimbelbeta/db";
import { product } from "@bimbelbeta/db/schema/transaction";
import { and, asc, desc, eq, gt, ilike, isNotNull, isNull, lt } from "drizzle-orm";

export type ProductRow = typeof product.$inferSelect;
export type ProductInsert = typeof product.$inferInsert;
export type ProductChanges = Omit<Partial<ProductInsert>, "id" | "createdAt" | "deletedAt">;
export type ForMemberRow = Pick<
	ProductRow,
	| "id"
	| "name"
	| "slug"
	| "description"
	| "price"
	| "type"
	| "variant"
	| "fixedExpiryMonth"
	| "fixedExpiryDay"
	| "durationDays"
	| "credits"
>;

export type ForMemberOptions = { limit: number; cursorId: string | null; backward: boolean };

export type ForAdminOptions = {
	limit: number;
	cursorId: string | null;
	backward: boolean;
	search?: string;
	variant?: ProductRow["variant"];
	includeDeleted: boolean;
};

export function createProductRepository(client: DbClient) {
	async function listForMember({ limit, cursorId, backward }: ForMemberOptions): Promise<ForMemberRow[]> {
		return client
			.select({
				id: product.id,
				name: product.name,
				slug: product.slug,
				description: product.description,
				price: product.price,
				type: product.type,
				variant: product.variant,
				fixedExpiryMonth: product.fixedExpiryMonth,
				fixedExpiryDay: product.fixedExpiryDay,
				durationDays: product.durationDays,
				credits: product.credits,
			})
			.from(product)
			.where(cursorId !== null ? (backward ? lt(product.id, cursorId) : gt(product.id, cursorId)) : undefined)
			.orderBy(backward ? desc(product.id) : asc(product.id))
			.limit(limit + 1);
	}

	async function listForAdmin({ limit, cursorId, backward, search, variant, includeDeleted }: ForAdminOptions) {
		return client
			.select()
			.from(product)
			.where(
				and(
					cursorId !== null ? (backward ? lt(product.id, cursorId) : gt(product.id, cursorId)) : undefined,
					search ? ilike(product.name, `%${search}%`) : undefined,
					variant ? eq(product.variant, variant) : undefined,
					!includeDeleted ? isNull(product.deletedAt) : undefined,
				),
			)
			.orderBy(backward ? desc(product.id) : asc(product.id))
			.limit(limit + 1);
	}

	async function findById(productId: string): Promise<ProductRow | undefined> {
		const [row] = await client.select().from(product).where(eq(product.id, productId)).limit(1);
		return row;
	}

	async function findBySlug(slug: string): Promise<ProductRow | undefined> {
		const [row] = await client.select().from(product).where(eq(product.slug, slug)).limit(1);
		return row;
	}

	async function findDeleted(productId: string): Promise<ProductRow | undefined> {
		const [row] = await client
			.select()
			.from(product)
			.where(and(eq(product.id, productId), isNotNull(product.deletedAt)))
			.limit(1);
		return row;
	}

	async function create(values: ProductInsert): Promise<ProductRow | undefined> {
		const [row] = await client.insert(product).values(values).returning();
		return row;
	}

	async function update(productId: string, changes: ProductChanges): Promise<ProductRow | undefined> {
		const [row] = await client.update(product).set(changes).where(eq(product.id, productId)).returning();
		return row;
	}

	async function softDelete(productId: string): Promise<ProductRow | undefined> {
		const [row] = await client
			.update(product)
			.set({ deletedAt: new Date() })
			.where(eq(product.id, productId))
			.returning();
		return row;
	}

	async function restore(productId: string): Promise<ProductRow | undefined> {
		const [row] = await client.update(product).set({ deletedAt: null }).where(eq(product.id, productId)).returning();
		return row;
	}

	return { listForMember, listForAdmin, findById, findBySlug, findDeleted, create, update, softDelete, restore };
}

export type ProductRepository = ReturnType<typeof createProductRepository>;
