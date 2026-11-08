import { describe, expect, test } from "bun:test";
import type { universityStudyProgram } from "@bimbelbeta/db/schema/university";
import type { Session } from "@/context";
import type { ListUsersParams, UserRepository, UserRow, UserUpdateValues } from "./repository";
import { createUserService } from "./service";

const memberUser = {
	id: "user-1",
	name: "Member",
	email: "member@example.com",
	emailVerified: true,
	image: null,
	createdAt: new Date("2024-01-01"),
	updatedAt: new Date("2024-01-01"),
	role: "user",
	isPremium: false,
	premiumExpiresAt: null,
	tryoutCredits: 0,
	targetUniversityId: null,
	targetStudyProgramId: null,
} satisfies Session["user"];

const targetRow = {
	university: { id: 1, name: "Universitas Contoh", slug: "universitas-contoh", logo: null },
	studyProgram: {
		id: 2,
		name: "Teknik Informatika",
		slug: "teknik-informatika",
		category: "SAINTEK",
		accreditation: "Unggul",
		averageScore: 600,
	},
} as const;

function userRow(id: string): UserRow {
	return {
		id,
		name: `Member ${id}`,
		email: `${id}@example.com`,
		emailVerified: true,
		image: null,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
		role: "user",
		isPremium: false,
		premiumExpiresAt: null,
		tryoutCredits: 0,
		targetUniversityId: null,
		targetStudyProgramId: null,
	};
}

function programRow(): typeof universityStudyProgram.$inferSelect {
	return {
		id: 3,
		universityId: 1,
		studyProgramId: 2,
		tuition: null,
		capacity: null,
		accreditation: "Unggul",
		averageScore: 500,
		isActive: true,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
	};
}

function fakeRepository(): UserRepository {
	return {
		findTarget: async () => undefined,
		findUniversityStudyProgram: async () => undefined,
		updateUserTarget: async () => undefined,
		listUsers: async () => [],
		findById: async () => undefined,
		findCreditHistory: async () => [],
		updateUser: async () => undefined,
		deleteUsers: async () => undefined,
		revokePremium: async () => undefined,
		countDashboardStats: async () => undefined,
	};
}

describe("user service", () => {
	test("returns null targets when the member has none", async () => {
		const service = createUserService(fakeRepository());
		const result = await service.getTarget(memberUser);
		expect(result).toEqual({ university: null, studyProgram: null });
	});

	test("returns the target pair when the repository finds it", async () => {
		const repository = fakeRepository();
		repository.findTarget = async () => targetRow;
		const service = createUserService(repository);
		const result = await service.getTarget({
			...memberUser,
			targetUniversityId: 1,
			targetStudyProgramId: 2,
		});
		expect(result).toEqual(targetRow);
	});

	test("reports a NOT_FOUND domain error for a dangling target", async () => {
		const service = createUserService(fakeRepository());
		const call = service.getTarget({ ...memberUser, targetUniversityId: 1, targetStudyProgramId: 2 });
		await expect(call).rejects.toMatchObject({
			name: "DomainError",
			code: "NOT_FOUND",
			message: "Gagal menemukan resource yang diminta.",
		});
	});

	test("saves the target when the combination exists", async () => {
		const repository = fakeRepository();
		repository.findUniversityStudyProgram = async () => programRow();
		repository.updateUserTarget = async () => ({
			id: memberUser.id,
			targetUniversityId: 1,
			targetStudyProgramId: 2,
		});
		const service = createUserService(repository);
		const result = await service.updateTarget(memberUser, { universityId: 1, studyProgramId: 2 });
		expect(result).toEqual({ id: memberUser.id, targetUniversityId: 1, targetStudyProgramId: 2 });
	});

	test("rejects an invalid combination with BAD_REQUEST", async () => {
		const service = createUserService(fakeRepository());
		const call = service.updateTarget(memberUser, { universityId: 1, studyProgramId: 2 });
		await expect(call).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Kombinasi universitas dan program studi tidak valid",
		});
	});

	test("reports INTERNAL_SERVER_ERROR when the target update writes nothing", async () => {
		const repository = fakeRepository();
		repository.findUniversityStudyProgram = async () => programRow();
		const service = createUserService(repository);
		const call = service.updateTarget(memberUser, { universityId: 1, studyProgramId: 2 });
		await expect(call).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR", message: "Gagal menyimpan target" });
	});

	test("builds a forward page from the listed rows", async () => {
		const repository = fakeRepository();
		repository.listUsers = async () => [userRow("a"), userRow("b"), userRow("c")];
		const service = createUserService(repository);
		const result = await service.listUsers({ limit: 2 });
		expect(result.items.map((row) => row.id)).toEqual(["a", "b"]);
		expect(result.pageInfo).toMatchObject({ hasNextPage: true, hasPreviousPage: false });
		expect(result.pageInfo.startCursor && Buffer.from(result.pageInfo.startCursor, "base64url").toString("utf8")).toBe(
			"a",
		);
		expect(result.pageInfo.endCursor && Buffer.from(result.pageInfo.endCursor, "base64url").toString("utf8")).toBe("b");
	});

	test("clamps the page size to 100 and defaults it to 20", async () => {
		const repository = fakeRepository();
		let received: ListUsersParams | undefined;
		repository.listUsers = async (params) => {
			received = params;
			return [];
		};
		const service = createUserService(repository);
		await service.listUsers({ limit: 500 });
		expect(received?.limit).toBe(100);
		await service.listUsers({});
		expect(received?.limit).toBe(20);
	});

	test("builds a backward page from the listed rows", async () => {
		const repository = fakeRepository();
		repository.listUsers = async () => [userRow("c"), userRow("b"), userRow("a")];
		const service = createUserService(repository);
		const result = await service.listUsers({ before: "Yw", limit: 2 });
		expect(result.items.map((row) => row.id)).toEqual(["b", "c"]);
		expect(result.pageInfo).toMatchObject({ hasNextPage: true, hasPreviousPage: true });
	});

	test("finds a user with its credit history", async () => {
		const repository = fakeRepository();
		repository.findById = async () => userRow(memberUser.id);
		repository.findCreditHistory = async () => [
			{
				id: "b4d64a2c-8ce1-4f5f-9a44-1e72a06b3cd0",
				userId: memberUser.id,
				transactionId: null,
				tryoutAttemptId: null,
				amount: 1,
				balanceAfter: 1,
				note: null,
				createdAt: new Date("2024-02-01"),
			},
		];
		const service = createUserService(repository);
		const result = await service.findUser(memberUser.id);
		expect(result.user.id).toBe(memberUser.id);
		expect(result.creditHistory).toHaveLength(1);
		expect(result.creditHistory[0]?.amount).toBe(1);
	});

	test("reports NOT_FOUND for a missing user", async () => {
		const service = createUserService(fakeRepository());
		await expect(service.findUser("missing-user")).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "User tidak ditemukan",
		});
	});

	test("updates an existing user and converts the premium expiry", async () => {
		const repository = fakeRepository();
		repository.findById = async () => userRow(memberUser.id);
		let written: UserUpdateValues | undefined;
		repository.updateUser = async (_userId, values) => {
			written = values;
			return userRow(memberUser.id);
		};
		const service = createUserService(repository);
		const expiresAt = new Date("2030-01-01");
		const result = await service.updateUser(memberUser.id, {
			role: "admin",
			isPremium: true,
			premiumExpiresAt: expiresAt,
		});
		expect(result).toEqual({ message: "User berhasil diperbarui" });
		expect(written).toMatchObject({ role: "admin", isPremium: true, premiumExpiresAt: expiresAt });
		expect(written?.updatedAt).toBeInstanceOf(Date);
	});

	test("reports NOT_FOUND when updating a missing user", async () => {
		const service = createUserService(fakeRepository());
		await expect(service.updateUser("missing-user", { role: "admin" })).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "User tidak ditemukan",
		});
	});

	test("reports NOT_FOUND when the profile update matches no row", async () => {
		const repository = fakeRepository();
		repository.findById = async () => userRow(memberUser.id);
		const service = createUserService(repository);
		await expect(service.updateUser(memberUser.id, { isPremium: true })).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "User tidak ditemukan",
		});
	});

	test("deletes users and reports the count", async () => {
		const repository = fakeRepository();
		let deletedIds: string[] | undefined;
		repository.deleteUsers = async (userIds) => {
			deletedIds = userIds;
			return undefined;
		};
		const service = createUserService(repository);
		const result = await service.deleteUsers(["a", "b"]);
		expect(result).toEqual({ message: "2 user berhasil dihapus" });
		expect(deletedIds).toEqual(["a", "b"]);
	});
});
