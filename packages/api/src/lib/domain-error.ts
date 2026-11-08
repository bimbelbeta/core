const DOMAIN_ERROR_CODES = [
	"NOT_FOUND",
	"FORBIDDEN",
	"BAD_REQUEST",
	"UNAUTHORIZED",
	"UNPROCESSABLE_CONTENT",
	"INTERNAL_SERVER_ERROR",
] as const;

export type DomainErrorCode = (typeof DOMAIN_ERROR_CODES)[number];

export class DomainError extends Error {
	constructor(
		readonly code: DomainErrorCode,
		message?: string,
	) {
		super(message);
		this.name = "DomainError";
	}
}

function rethrowAsInternal(error: unknown, message: string): never {
	if (error instanceof DomainError) throw error;

	console.error(error);
	throw new DomainError("INTERNAL_SERVER_ERROR", message);
}

export async function withErrorFallback<T>(message: string, run: () => Promise<T>): Promise<T> {
	try {
		return await run();
	} catch (error) {
		rethrowAsInternal(error, message);
	}
}
