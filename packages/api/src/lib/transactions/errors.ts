export const paymentErrorCodes = [
	"INVALID_SIGNATURE",
	"INVALID_PAYLOAD",
	"PROVIDER_UNAVAILABLE",
	"PROVIDER_REJECTED",
	"CONFIGURATION_ERROR",
] as const;

export type PaymentErrorCode = (typeof paymentErrorCodes)[number];

export class PaymentError extends Error {
	constructor(
		readonly code: PaymentErrorCode,
		message: string,
		options?: { cause?: unknown },
	) {
		super(message, options);
	}
}

export function toPaymentErrorCode(error: unknown): PaymentErrorCode {
	return error instanceof PaymentError ? error.code : "PROVIDER_UNAVAILABLE";
}
