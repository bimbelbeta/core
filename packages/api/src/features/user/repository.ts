import type { Role } from "@bimbelbeta/contract/common/roles";
import type { DbClient } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { creditTransaction } from "@bimbelbeta/db/schema/credit";
import { studyProgram, university, universityStudyProgram } from "@bimbelbeta/db/schema/university";
import { and, asc, desc, eq, gt, inArray, like, lt, or } from "drizzle-orm";

export type UserRow = typeof user.$inferSelect;

export type UserUpdateValues = Partial<UserRow>;

export type ListUsersParams = {
	limit: number;
	cursorId?: string;
	isBackward: boolean;
	search?: string;
	role?: Role;
	isPremium?: boolean;
};

export function createUserRepository(client: DbClient) {
	return {
		async findTarget(universityId: number, studyProgramId: number) {
			const [data] = await client
				.select({
					university: {
						id: university.id,
						name: university.name,
						slug: university.slug,
						logo: university.logo,
					},
					studyProgram: {
						id: studyProgram.id,
						name: studyProgram.name,
						slug: studyProgram.slug,
						category: studyProgram.category,
						accreditation: universityStudyProgram.accreditation,
						averageScore: universityStudyProgram.averageScore,
					},
				})
				.from(university)
				.innerJoin(universityStudyProgram, eq(universityStudyProgram.universityId, university.id))
				.innerJoin(studyProgram, eq(studyProgram.id, universityStudyProgram.studyProgramId))
				.where(and(eq(university.id, universityId), eq(studyProgram.id, studyProgramId)));

			return data;
		},

		async findUniversityStudyProgram(universityId: number, studyProgramId: number) {
			const [existing] = await client
				.select()
				.from(universityStudyProgram)
				.where(
					and(
						eq(universityStudyProgram.universityId, universityId),
						eq(universityStudyProgram.studyProgramId, studyProgramId),
					),
				)
				.limit(1);

			return existing;
		},

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
			const { limit, cursorId, isBackward, search, role, isPremium } = params;

			const rows = await client
				.select()
				.from(user)
				.where(
					and(
						cursorId !== undefined ? (isBackward ? lt(user.id, cursorId) : gt(user.id, cursorId)) : undefined,
						search ? or(like(user.name, `%${search}%`), like(user.email, `%${search}%`)) : undefined,
						role ? eq(user.role, role) : undefined,
						isPremium !== undefined ? eq(user.isPremium, isPremium) : undefined,
					),
				)
				.orderBy(isBackward ? desc(user.id) : asc(user.id))
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
	};
}

export type UserRepository = ReturnType<typeof createUserRepository>;
