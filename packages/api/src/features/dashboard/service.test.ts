import { describe, expect, test } from "bun:test";
import type { DashboardRepository } from "./repository";
import { createDashboardService } from "./service";

function makeRepository(overrides: Partial<DashboardRepository> = {}): DashboardRepository {
	return {
		userCounts: async () => undefined,
		questionCounts: async () => ({ total: 0, essay: 0 }),
		successfulRevenueSince: async () => undefined,
		recentTryouts: async () => [],
		...overrides,
	};
}

describe("dashboard service", () => {
	test("asks the read model for month boundaries and defaults missing measures to zero", async () => {
		const userCountsSince: Date[] = [];
		const revenueSince: Date[] = [];
		const now = new Date();
		const service = createDashboardService({
			repository: makeRepository({
				userCounts: async (since) => {
					userCountsSince.push(since);
					return undefined;
				},
				successfulRevenueSince: async (since) => {
					revenueSince.push(since);
					return undefined;
				},
			}),
		});

		const stats = await service.stats();

		const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
		const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
		expect(userCountsSince).toEqual([lastMonthStart]);
		expect(revenueSince).toEqual([currentMonthStart, lastMonthStart]);
		expect(stats).toEqual({
			totalUsers: 0,
			premiumUsers: 0,
			monthlyRevenue: 0,
			usersTrend: null,
			revenueTrend: null,
			totalQuestions: 0,
			essayQuestions: 0,
			recentTryouts: [],
		});
	});

	test("turns the read model counts into the admin stats payload", async () => {
		const revenueCalls: Date[] = [];
		const service = createDashboardService({
			repository: makeRepository({
				userCounts: async () => ({ total: 150, premium: 50, createdSince: 100, premiumExpiringSince: 25 }),
				questionCounts: async () => ({ total: 12, essay: 4 }),
				successfulRevenueSince: async () => {
					revenueCalls.push(new Date());
					return { total: revenueCalls.length === 1 ? 150000 : 100000 };
				},
			}),
		});

		const stats = await service.stats();

		expect(stats).toEqual({
			totalUsers: 150,
			premiumUsers: 50,
			monthlyRevenue: 150000,
			usersTrend: 200,
			revenueTrend: 50,
			totalQuestions: 12,
			essayQuestions: 4,
			recentTryouts: [],
		});
	});
});
