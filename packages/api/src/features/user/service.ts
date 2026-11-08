import type { Role } from "@bimbelbeta/contract/common/roles";
import { db } from "@bimbelbeta/db";
import type { Session } from "@/context";
import { DomainError } from "@/lib/domain-error";
import { buildStringIdCursorPage, parseStringIdCursor } from "@/lib/pagination/cursor";
import { createUserRepository, type UserRepository } from "./repository";

type UpdateTargetInput = {
	universityId: number;
	studyProgramId: number;
};

type ListUsersInput = {
	limit?: number | undefined;
	after?: string | undefined;
	before?: string | undefined;
	search?: string | undefined;
	role?: Role | undefined;
	isPremium?: boolean | undefined;
};

type UpdateUserInput = {
	role?: Role | undefined;
	isPremium?: boolean | undefined;
	premiumExpiresAt?: Date | null | undefined;
};

export const createUserService = (repository: UserRepository) => ({
	async getTarget(user: Session["user"]) {
		if (!user.targetUniversityId || !user.targetStudyProgramId) {
			return { university: null, studyProgram: null };
		}

		const data = await repository.findTarget(user.targetUniversityId, user.targetStudyProgramId);
		if (!data) throw new DomainError("NOT_FOUND", "Gagal menemukan resource yang diminta.");

		return data;
	},

	async updateTarget(user: Session["user"], input: UpdateTargetInput) {
		const { universityId, studyProgramId } = input;

		const existing = await repository.findUniversityStudyProgram(universityId, studyProgramId);
		if (!existing) {
			throw new DomainError("BAD_REQUEST", "Kombinasi universitas dan program studi tidak valid");
		}

		const updated = await repository.updateUserTarget(user.id, universityId, studyProgramId);
		if (!updated) throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal menyimpan target");

		return updated;
	},

	async listUsers(input: ListUsersInput) {
		const limit = Math.min(input.limit ?? 20, 100);
		const isBackward = !!input.before;
		const cursor = input.before || input.after;
		const cursorId = cursor ? parseStringIdCursor(cursor) : undefined;

		const rows = await repository.listUsers({
			limit,
			cursorId,
			isBackward,
			search: input.search,
			role: input.role,
			isPremium: input.isPremium,
		});

		return buildStringIdCursorPage(rows, limit, isBackward, !!cursor);
	},

	async findUser(userId: string) {
		const userData = await repository.findById(userId);
		if (!userData) throw new DomainError("NOT_FOUND", "User tidak ditemukan");

		const creditHistory = await repository.findCreditHistory(userId, 10);

		return {
			user: userData,
			creditHistory,
		};
	},

	async updateUser(userId: string, input: UpdateUserInput) {
		const existingUser = await repository.findById(userId);
		if (!existingUser) throw new DomainError("NOT_FOUND", "User tidak ditemukan");

		const updateData: {
			role?: Role;
			isPremium?: boolean;
			premiumExpiresAt?: Date | null;
			updatedAt: Date;
		} = {
			updatedAt: new Date(),
		};

		if (input.role !== undefined) updateData.role = input.role;
		if (input.isPremium !== undefined) updateData.isPremium = input.isPremium;
		if (input.premiumExpiresAt !== undefined) {
			updateData.premiumExpiresAt = input.premiumExpiresAt ? new Date(input.premiumExpiresAt) : null;
		}

		const updated = await repository.updateUser(userId, updateData);
		if (!updated) throw new DomainError("NOT_FOUND", "User tidak ditemukan");

		return { message: "User berhasil diperbarui" };
	},

	async deleteUsers(userIds: string[]) {
		await repository.deleteUsers(userIds);

		return { message: `${userIds.length} user berhasil dihapus` };
	},
});

export const userService = createUserService(createUserRepository(db));
