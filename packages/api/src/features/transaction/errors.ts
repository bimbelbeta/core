/**
 * The things that can go wrong while talking to a payment provider.
 *
 * Kept separate from oRPC error codes because the payment layer also runs from webhooks and
 * jobs. Procedures decide how each one surfaces to the caller.
 */
const paymentErrorCodes = [
	"INVALID_PAYLOAD",
	"PROVIDER_UNAVAILABLE",
	"PROVIDER_REJECTED",
	"CONFIGURATION_ERROR",
] as const;

export type PaymentErrorCode = (typeof paymentErrorCodes)[number];

/**
 * A failure that came from the payment provider integration.
 *
 * Carries the reason as a stable code rather than a message so callers can log it without
 * matching on strings. The original error is kept in `cause` for debugging.
 */
export class PaymentError extends Error {
	constructor(
		readonly code: PaymentErrorCode,
		message: string,
		options?: { cause?: unknown },
	) {
		super(message, options);
	}
}

export class AlreadyPremiumError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "AlreadyPremiumError";
	}
}
