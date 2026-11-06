import { createIsomorphicFn, createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import type { RouterAppContext } from "@/routes/__root";
import { authClient } from "./auth-client";

type SessionRequestOptions = Parameters<typeof authClient.getSession>[0];

function getErrorStatus(cause: unknown): number | undefined {
	if (typeof cause !== "object" || cause === null) {
		return undefined;
	}

	if ("statusCode" in cause && typeof cause.statusCode === "number") {
		return cause.statusCode;
	}

	if ("status" in cause && typeof cause.status === "number") {
		return cause.status;
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

async function fetchSession(options?: SessionRequestOptions) {
	try {
		const { data, error } = await authClient.getSession(options);

		if (error) {
			throw error;
		}

		return data;
	} catch (error) {
		throw new SessionLookupError(error);
	}
}

export const getUser = createServerFn().handler(async () => {
	const headers = getRequestHeaders();

	const headersToForward = {
		cookie: headers.get("cookie") || "",
		"user-agent": headers.get("user-agent"),
	};

	return await fetchSession({
		fetchOptions: {
			headers: headersToForward,
		},
	});
});

export const $getSession = createIsomorphicFn()
	.client(async (queryClient: RouterAppContext["queryClient"]) => {
		const session = await queryClient.fetchQuery({
			queryFn: () => fetchSession(),
			queryKey: ["auth", "getSession"],
			staleTime: 60_000,
			retry: false,
		});

		return { session };
	})
	.server(async (_: RouterAppContext["queryClient"]) => {
		const headers = getRequestHeaders();

		const headersToForward = {
			cookie: headers.get("cookie") || "",
			"user-agent": headers.get("user-agent"),
		};

		const session = await fetchSession({
			fetchOptions: {
				headers: headersToForward,
			},
		});

		return { session };
	});
