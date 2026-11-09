import { createIsomorphicFn, createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import type { RouterAppContext } from "@/routes/__root";
import { authClient, type Session } from "./auth-client";

export const SESSION_RETRY_DELAYS_MS = [300, 700] as const;

export type SessionRequestOptions = Parameters<typeof authClient.getSession>[0];

function getErrorStatus(cause: unknown): number | undefined {
	if (typeof cause !== "object" || cause === null) {
		return undefined;
	}

	if ("statusCode" in cause) {
		if (typeof cause.statusCode === "number") {
			return cause.statusCode;
		}
		if (typeof cause.statusCode === "string" && !Number.isNaN(Number(cause.statusCode))) {
			return Number(cause.statusCode);
		}
	}

	if ("status" in cause) {
		if (typeof cause.status === "number") {
			return cause.status;
		}
		if (typeof cause.status === "string" && !Number.isNaN(Number(cause.status))) {
			return Number(cause.status);
		}
	}

	return undefined;
}

export class SessionLookupError extends Error {
	readonly retryable: boolean;
	readonly originalError: unknown;

	constructor(cause: unknown) {
		super("Unable to verify authentication session.");
		this.name = "SessionLookupError";
		this.originalError = cause;

		const status = getErrorStatus(cause);

		this.retryable =
			status === undefined || status === 0 || status === 408 || status === 425 || status === 429 || status >= 500;
	}
}

export type SessionFetcher = (options?: SessionRequestOptions) => Promise<{ data?: Session | null; error?: unknown }>;

export async function fetchSessionWithRetry(
	options?: SessionRequestOptions,
	delays: readonly number[] = SESSION_RETRY_DELAYS_MS,
	fetcher: SessionFetcher = authClient.getSession,
): Promise<Session | null> {
	for (let attempt = 0; attempt <= delays.length; attempt++) {
		try {
			const result = await fetcher(options);
			if (result?.error) {
				if (getErrorStatus(result.error) === 401) {
					return null;
				}
				throw result.error;
			}
			return result?.data ?? null;
		} catch (cause) {
			if (getErrorStatus(cause) === 401) {
				return null;
			}

			const error = cause instanceof SessionLookupError ? cause : new SessionLookupError(cause);
			const delay = delays[attempt];

			if (!error.retryable || delay === undefined) {
				throw error;
			}

			await new Promise<void>((resolve) => {
				setTimeout(resolve, delay);
			});
		}
	}
	return null;
}

export const getUser = createServerFn().handler(async () => {
	const headers = getRequestHeaders();
	const headersToForward = {
		cookie: headers.get("cookie") || "",
		"user-agent": headers.get("user-agent"),
	};

	return await fetchSessionWithRetry({
		fetchOptions: {
			headers: headersToForward,
		},
	});
});

export const $getSession = createIsomorphicFn()
	.client(async (queryClient: RouterAppContext["queryClient"]) => {
		const session = await queryClient.fetchQuery({
			queryFn: () => fetchSessionWithRetry(),
			queryKey: ["auth", "getSession"],
			staleTime: 60_000,
			retry: false,
		});

		return {
			session,
		};
	})
	.server(async (_: RouterAppContext["queryClient"]) => {
		const headers = getRequestHeaders();

		const headersToForward = {
			cookie: headers.get("cookie") || "",
			"user-agent": headers.get("user-agent"),
		};

		const session = await fetchSessionWithRetry({
			fetchOptions: {
				headers: headersToForward,
			},
		});

		return {
			session,
		};
	});
