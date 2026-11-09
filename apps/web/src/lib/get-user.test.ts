import { describe, expect, it } from "bun:test";
import type { Session } from "./auth-client";
import { fetchSessionWithRetry, SessionLookupError } from "./get-user";

describe("fetchSessionWithRetry", () => {
	const createMockSession = (id: string, name: string): Session => ({
		user: {
			id,
			name,
			email: `${id}@example.com`,
			emailVerified: false,
			createdAt: new Date(),
			updatedAt: new Date(),
			role: "user",
			isPremium: false,
			tryoutCredits: 0,
		},
		session: {
			id: `session-${id}`,
			userId: id,
			expiresAt: new Date(),
			token: `token-${id}`,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	});

	it("returns session data on immediate success", async () => {
		const mockSession = createMockSession("user-1", "User One");
		const fetcher = async () => ({ data: mockSession, error: null });

		const result = await fetchSessionWithRetry(undefined, [0, 0], fetcher);

		expect(result).toEqual(mockSession);
	});

	it("retries on retryable error (e.g. status 502 or network failure) and succeeds on retry", async () => {
		const mockSession = createMockSession("user-1", "User One");
		let attempts = 0;
		const fetcher = async () => {
			attempts++;
			if (attempts === 1) {
				return { data: null, error: { status: 502, message: "Bad Gateway" } };
			}
			return { data: mockSession, error: null };
		};

		const result = await fetchSessionWithRetry(undefined, [0, 0], fetcher);

		expect(result).toEqual(mockSession);
		expect(attempts).toBe(2);
	});

	it("retries on network failure and succeeds on retry", async () => {
		const mockSession = createMockSession("user-2", "User Two");
		let attempts = 0;
		const fetcher = async () => {
			attempts++;
			if (attempts === 1) {
				throw new Error("Network connection lost");
			}
			return { data: mockSession, error: null };
		};

		const result = await fetchSessionWithRetry(undefined, [0, 0], fetcher);

		expect(result).toEqual(mockSession);
		expect(attempts).toBe(2);
	});

	it("returns null on 401 unauthenticated session without retrying", async () => {
		let attempts = 0;
		const fetcher = async () => {
			attempts++;
			return { data: null, error: { status: 401, message: "Unauthorized" } };
		};

		const result = await fetchSessionWithRetry(undefined, [0, 0], fetcher);

		expect(result).toBeNull();
		expect(attempts).toBe(1);
	});

	it("returns null on 401 thrown exception without retrying", async () => {
		let attempts = 0;
		const fetcher = async () => {
			attempts++;
			throw { status: 401, message: "Unauthorized" };
		};

		const result = await fetchSessionWithRetry(undefined, [0, 0], fetcher);

		expect(result).toBeNull();
		expect(attempts).toBe(1);
	});

	it("does not retry on non-retryable 403 status and throws SessionLookupError with retryable === false", async () => {
		let attempts = 0;
		const fetcher = async () => {
			attempts++;
			return { data: null, error: { status: 403, message: "Forbidden" } };
		};

		let caughtError: unknown;
		try {
			await fetchSessionWithRetry(undefined, [0, 0], fetcher);
		} catch (error) {
			caughtError = error;
		}

		expect(caughtError).toBeInstanceOf(SessionLookupError);
		expect(caughtError).toHaveProperty("retryable", false);
		expect(attempts).toBe(1);
	});
});
