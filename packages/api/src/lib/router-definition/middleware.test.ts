import { describe, expect, mock, test } from "bun:test";

type MiddlewareFn = (input: Record<string, unknown>) => Promise<unknown>;

const mockMiddleware = (fn: MiddlewareFn) => fn;

mock.module("@/lib/router-definition", () => ({
	baseImplementer: { middleware: mockMiddleware },
}));

mock.module("@bimbelbeta/db", () => ({
	db: { update: () => ({ set: () => ({ where: () => Promise.resolve() }) }) },
}));

mock.module("@bimbelbeta/db/schema/auth", () => ({
	user: { id: "id" },
}));

mock.module("@orpc/experimental-ratelimit", () => ({
	createRatelimitMiddleware: () => "rateLimit",
}));

mock.module("@/lib/roles", () => ({
	ROLES: { ADMIN: "admin", SUPER_ADMIN: "superadmin" },
}));

mock.module("@/lib/router-definition/rate-limiter", () => ({
	getFreeRatelimiter: () => "free",
	getPremiumRatelimiter: () => "premium",
	getNoOpRatelimiter: () => "noop",
}));

const { requireAdmin, requireSuperAdmin, requireAuth, requirePremium, revokeExpiredPremium } = await import(
	"./middleware"
);

describe("requireAdmin", () => {
	const makeErrors = () => ({
		UNAUTHORIZED: () => new Error("UNAUTHORIZED"),
	});

	test("passes through for admin role", async () => {
		const next = mock(() => "ok");
		await (requireAdmin as MiddlewareFn)({
			context: { session: { user: { role: "admin" } } },
			next,
			errors: makeErrors(),
		});
		expect(next).toHaveBeenCalled();
	});

	test("passes through for superadmin role", async () => {
		const next = mock(() => "ok");
		await (requireAdmin as MiddlewareFn)({
			context: { session: { user: { role: "superadmin" } } },
			next,
			errors: makeErrors(),
		});
		expect(next).toHaveBeenCalled();
	});

	test("throws UNAUTHORIZED for non-admin role", async () => {
		const next = mock(() => "ok");
		expect(
			(requireAdmin as MiddlewareFn)({
				context: { session: { user: { role: "user" } } },
				next,
				errors: makeErrors(),
			}),
		).rejects.toThrow("UNAUTHORIZED");
		expect(next).not.toHaveBeenCalled();
	});
});

describe("requireSuperAdmin", () => {
	const makeErrors = () => ({
		UNAUTHORIZED: () => new Error("UNAUTHORIZED"),
	});

	test("passes through for superadmin role", async () => {
		const next = mock(() => "ok");
		await (requireSuperAdmin as MiddlewareFn)({
			context: { session: { user: { role: "superadmin" } } },
			next,
			errors: makeErrors(),
		});
		expect(next).toHaveBeenCalled();
	});

	test("throws UNAUTHORIZED for admin role", async () => {
		const next = mock(() => "ok");
		expect(
			(requireSuperAdmin as MiddlewareFn)({
				context: { session: { user: { role: "admin" } } },
				next,
				errors: makeErrors(),
			}),
		).rejects.toThrow("UNAUTHORIZED");
	});
});

describe("requireAuth", () => {
	const makeErrors = () => ({
		UNAUTHORIZED: () => new Error("UNAUTHORIZED"),
	});

	test("passes through when user is authenticated", async () => {
		const next = mock(() => "ok");
		await (requireAuth as MiddlewareFn)({
			context: { session: { user: { id: "1" } } },
			next,
			errors: makeErrors(),
		});
		expect(next).toHaveBeenCalled();
	});

	test("throws UNAUTHORIZED when no user", async () => {
		const next = mock(() => "ok");
		expect(
			(requireAuth as MiddlewareFn)({
				context: { session: { user: null } },
				next,
				errors: makeErrors(),
			}),
		).rejects.toThrow("UNAUTHORIZED");
	});
});

describe("requirePremium", () => {
	const makeErrors = () => ({
		FORBIDDEN: () => new Error("FORBIDDEN"),
	});

	test("passes through for premium user", async () => {
		const next = mock(() => "ok");
		await (requirePremium as MiddlewareFn)({
			context: { session: { user: { isPremium: true, role: "user" } } },
			next,
			errors: makeErrors(),
		});
		expect(next).toHaveBeenCalled();
	});

	test("passes through for admin", async () => {
		const next = mock(() => "ok");
		await (requirePremium as MiddlewareFn)({
			context: { session: { user: { isPremium: false, role: "admin" } } },
			next,
			errors: makeErrors(),
		});
		expect(next).toHaveBeenCalled();
	});

	test("throws FORBIDDEN for non-premium non-admin", async () => {
		const next = mock(() => "ok");
		expect(
			(requirePremium as MiddlewareFn)({
				context: { session: { user: { isPremium: false, role: "user" } } },
				next,
				errors: makeErrors(),
			}),
		).rejects.toThrow("FORBIDDEN");
	});
});

describe("revokeExpiredPremium", () => {
	test("calls next without modification when user is not premium", async () => {
		const next = mock(() => undefined);
		await (revokeExpiredPremium as MiddlewareFn)({
			context: { session: { user: { isPremium: false, id: "1" } } },
			next,
		});
		expect(next).toHaveBeenCalled();
	});

	test("calls next without modification when premium has not expired", async () => {
		const next = mock((args?: { context?: unknown }) => args?.context ?? {});
		const futureDate = new Date(Date.now() + 100000);
		await (revokeExpiredPremium as MiddlewareFn)({
			context: { session: { user: { isPremium: true, premiumExpiresAt: futureDate, id: "1" } } },
			next,
		});
		expect(next).toHaveBeenCalled();
	});

	test("sets isPremium to false when premium has expired", async () => {
		const next = mock((args?: { context?: unknown }) => args?.context ?? {});
		const pastDate = new Date(Date.now() - 100000);
		const result = await (revokeExpiredPremium as MiddlewareFn)({
			context: { session: { user: { isPremium: true, premiumExpiresAt: pastDate, id: "1" } } },
			next,
		});
		expect(result.session.user.isPremium).toBe(false);
	});
});
