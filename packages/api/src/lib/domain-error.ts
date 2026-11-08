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
		message: string,
	) {
		super(message);
		this.name = "DomainError";
	}
}
