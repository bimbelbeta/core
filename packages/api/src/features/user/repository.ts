import type { Role } from "@bimbelbeta/contract/common/roles";
import type { DbClient } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { creditTransaction } from "@bimbelbeta/db/schema/credit";

import { and, asc, count, desc, eq, gt, inArray, like, lt, or, sql } from "drizzle-orm";

export type UserRow = typeof user.$inferSelect;

export type UserUpdateValues = Partial<UserRow>;

export type DashboardUserCounts = {
	total: number;
	premium: number;
	createdSince: number;
};

export type ListUsersParams = {
	limit: number;
	cursorCreatedAt?: { date: Date; id: string };
	isBackward: boolean;
	search?: string;
	role?: Role;
	isPremium?: boolean;
	newestFirst: boolean;
};

function userCursorFilter(cursor: { date: Date; id: string }, descending: boolean) {
	return or(
		descending ? lt(user.createdAt, cursor.date) : gt(user.createdAt, cursor.date),
		and(eq(user.createdAt, cursor.date), descending ? lt(user.id, cursor.id) : gt(user.id, cursor.id)),
	);
}

export function createUserRepository(client: DbClient) {
	return {
		async updateUserTarget(userId: string, universityId: number, studyProgramId: number) {
			const [updated] = await client
				.update(user)
				.set({
					targetUniversityId: universityId,
					targetStudyProgramId: studyProgramId,
				})
				.where(eq(user.id, userId))
				.returning({
					id: user.id,
					targetUniversityId: user.targetUniversityId,
					targetStudyProgramId: user.targetStudyProgramId,
				});

			return updated;
		},

		async listUsers(params: ListUsersParams) {
			const { limit, cursorCreatedAt, isBackward, search, role, isPremium, newestFirst } = params;
			const descending = newestFirst !== isBackward;

			const rows = await client
				.select()
				.from(user)
				.where(
					and(
						cursorCreatedAt ? userCursorFilter(cursorCreatedAt, descending) : undefined,
						search ? or(like(user.name, `%${search}%`), like(user.email, `%${search}%`)) : undefined,
						role ? eq(user.role, role) : undefined,
						isPremium !== undefined ? eq(user.isPremium, isPremium) : undefined,
					),
				)
				.orderBy(descending ? desc(user.createdAt) : asc(user.createdAt), descending ? desc(user.id) : asc(user.id))
				.limit(limit + 1);

			return rows;
		},

		async findById(userId: string) {
			const [userData] = await client.select().from(user).where(eq(user.id, userId)).limit(1);

			return userData;
		},

		async findCreditHistory(userId: string, limit: number) {
			const rows = await client
				.select()
				.from(creditTransaction)
				.where(eq(creditTransaction.userId, userId))
				.orderBy(desc(creditTransaction.createdAt))
				.limit(limit);

			return rows;
		},

		async updateUser(userId: string, values: UserUpdateValues) {
			const [updated] = await client.update(user).set(values).where(eq(user.id, userId)).returning();

			return updated;
		},

		async deleteUsers(userIds: string[]) {
			await client.delete(user).where(inArray(user.id, userIds));
		},

		async revokePremium(userId: string) {
			await client.update(user).set({ isPremium: false }).where(eq(user.id, userId));
		},

		async revokeExpiredPremium(now: Date): Promise<number> {
			const rows = await client
				.update(user)
				.set({ isPremium: false })
				.where(and(eq(user.isPremium, true), lt(user.premiumExpiresAt, now)))
				.returning({ id: user.id });
			return rows.length;
		},

		async grantPremium(userId: string, expiresAt: Date) {
			await client.update(user).set({ isPremium: true, premiumExpiresAt: expiresAt }).where(eq(user.id, userId));
		},

		async countDashboardStats(since: Date): Promise<DashboardUserCounts | undefined> {
			const [row] = await client
				.select({
					total: count(),
					premium: sql<number>`count(*) filter (where ${user.isPremium})`.mapWith(Number),
					createdSince: sql<number>`count(*) filter (where ${user.createdAt} >= ${since})`.mapWith(Number),
				})
				.from(user);
			return row;
		},
	};
}

export type UserRepository = ReturnType<typeof createUserRepository>;
