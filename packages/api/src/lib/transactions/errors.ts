/**
 * The things that can go wrong while talking to a payment provider.
 *
 * Kept separate from oRPC error codes because the payment layer also runs from webhooks and
 * jobs. Procedures decide how each one surfaces to the caller.
 */
export const paymentErrorCodes = [
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

/**
 * Narrows any thrown value to a payment error code.
 *
 * Anything that is not a `PaymentError` is treated as the provider being unavailable, which is
 * the safe assumption when a transport or parsing failure escapes without a specific cause.
 */
