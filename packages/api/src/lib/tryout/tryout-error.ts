/**
 * An expected failure from a tryout workflow, carrying the oRPC error code to report.
 *
 * Services cannot use `errors.BAD_REQUEST()` and friends because those come from the oRPC
 * context, which would tie business logic to the transport. Services throw this instead, and
 * procedures translate `code` and `message` into the matching oRPC error.
 */
export class TryoutError extends Error {
	constructor(
		readonly code: "NOT_FOUND" | "FORBIDDEN" | "BAD_REQUEST" | "INTERNAL_SERVER_ERROR",
		message: string,
	) {
		super(message);
	}
}

export const tryoutErrors = {
	NOT_FOUND: ({ message }: { message: string }) => new TryoutError("NOT_FOUND", message),
	FORBIDDEN: ({ message }: { message: string }) => new TryoutError("FORBIDDEN", message),
	BAD_REQUEST: ({ message }: { message: string }) => new TryoutError("BAD_REQUEST", message),
	INTERNAL_SERVER_ERROR: ({ message }: { message: string }) => new TryoutError("INTERNAL_SERVER_ERROR", message),
};
