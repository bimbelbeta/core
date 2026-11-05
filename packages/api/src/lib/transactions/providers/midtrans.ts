import { createHash, timingSafeEqual } from "node:crypto";
import { Snap } from "midtrans-client";
import { PaymentError } from "@/lib/transactions/errors";
import type { PaymentEvent, PaymentFailureCode } from "@/lib/transactions/failures";
import type { Checkout, CheckoutInput, PaymentProvider, PaymentStatus } from "@/lib/transactions/types";

export type MidtransNotification = {
	order_id: string;
	status_code: string;
	gross_amount: string;
	signature_key: string;
};

const paid = new Set(["settlement"]);
const failed = new Set(["deny", "cancel", "expire", "failure"]);

/**
 * Translates a Midtrans transaction status into the provider-independent status.
 *
 * Midtrans signals success two ways: `settlement` for immediate payment, and `capture` for card
 * payments that only count once fraud review accepts them. A challenged capture is therefore
 * `unknown` rather than paid, while a denied one is final and therefore `failed`. Anything not
 * recognised stays `unknown` so the caller can ignore it instead of guessing.
 */
const messageHints: Array<[RegExp, PaymentFailureCode]> = [
	[/insufficient|saldo tidak cukup|dana tidak cukup/i, "insufficient_balance"],
	[/limit/i, "limit_exceeded"],
	[/expired|kadaluarsa/i, "payment_expired"],
	[/cancel|dibatalkan/i, "payment_cancelled"],
	[/fraud/i, "fraud_rejected"],
	[/decline|denied|ditolak/i, "card_declined"],
];

/**
 * Reads a failure reason out of Midtrans' vocabulary.
 *
 * Midtrans has no failure-code enumeration: it reports `deny`, `cancel`, `expire`, or `failure`
 * and puts the actual reason in free text — `status_message`, and for card payments the acquirer's
 * answer in `channel_response_message`. The status alone is therefore mapped where it is
 * unambiguous, and the messages are only used as a best-effort hint; anything unrecognised falls
 * back to the status rather than guessing at a cause the user would act on.
 */
export function toFailureCode(
	transactionStatus: string,
	fraudStatus?: string,
	...messages: (string | undefined)[]
): PaymentFailureCode | undefined {
	if (fraudStatus === "deny") return "fraud_rejected";
	if (transactionStatus === "expire") return "payment_expired";
	if (transactionStatus === "cancel") return "payment_cancelled";
	if (transactionStatus !== "deny" && transactionStatus !== "failure") return undefined;

	const hint = messageHints.find(([pattern]) => messages.some((message) => message && pattern.test(message)));
	if (hint) return hint[1];
	return transactionStatus === "deny" ? "card_declined" : "provider_error";
}

export function toPaymentStatus(transactionStatus: string, fraudStatus?: string): PaymentStatus {
	if (paid.has(transactionStatus)) return "paid";
	if (transactionStatus === "capture") {
		if (fraudStatus === "accept") return "paid";
		if (fraudStatus === "deny") return "failed";
		return "unknown";
	}
	if (transactionStatus === "pending") return "pending";
	if (failed.has(transactionStatus)) return "failed";
	return "unknown";
}

/**
 * Verifies that a notification was really sent by Midtrans.
 *
 * Midtrans signs each notification with SHA-512 over the order id, status code, gross amount, and
 * the secret server key. Recomputing it here proves the payload was not forged or edited in
 * transit; the server key never leaves the backend, so an attacker cannot produce a valid hash.
 */
export function signatureMatches({
	orderId,
	statusCode,
	grossAmount,
	signatureKey,
	serverKey,
}: {
	orderId: string;
	statusCode: string;
	grossAmount: string;
	signatureKey: string;
	serverKey: string;
}): boolean {
	const expected = Buffer.from(
		createHash("sha512").update(`${orderId}${statusCode}${grossAmount}${serverKey}`).digest("hex"),
	);
	const provided = Buffer.from(signatureKey);
	return expected.length === provided.length && timingSafeEqual(expected, provided);
}

function getServerKey(): string {
	const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";
	if (!serverKey) throw new PaymentError("CONFIGURATION_ERROR", "MIDTRANS_SERVER_KEY is not set");
	return serverKey;
}

function minutesUntil(deadline: Date): number {
	return Math.max(1, Math.round((deadline.getTime() - Date.now()) / 60_000));
}

function isProduction(): boolean {
	return process.env.NODE_ENV === "production";
}

let snap: Snap | null = null;

function getSnap(): Snap {
	if (!snap) {
		snap = new Snap({ isProduction: isProduction(), serverKey: getServerKey() });
	}
	return snap;
}

function statusErrorCode(status: number): PaymentError["code"] {
	if (status === 401 || status === 403) return "CONFIGURATION_ERROR";
	if (status >= 400 && status < 500) return "PROVIDER_REJECTED";
	return "PROVIDER_UNAVAILABLE";
}

function errorStatusCode(error: unknown): number | null {
	if (typeof error !== "object" || error === null || !("httpStatusCode" in error)) return null;
	const status = error.httpStatusCode;
	return typeof status === "number" ? status : null;
}

async function createCheckout(input: CheckoutInput): Promise<Checkout> {
	const created = await getSnap()
		.createTransaction({
			transaction_details: { order_id: input.orderId, gross_amount: input.amount },
			expiry: { unit: "minute", duration: minutesUntil(input.expiresAt) },
			item_details: [{ price: input.amount, quantity: 1, name: input.description }],
			customer_details: { first_name: input.customer.name, email: input.customer.email },
			credit_card: { secure: true },
			callbacks: input.returnUrl
				? { finish: input.returnUrl, error: input.returnUrl, pending: input.returnUrl }
				: undefined,
		})
		.catch((error: unknown) => {
			const status = errorStatusCode(error);
			throw new PaymentError(
				status === null ? "PROVIDER_UNAVAILABLE" : statusErrorCode(status),
				"Midtrans checkout failed",
				{
					cause: error,
				},
			);
		});

	return { provider: "midtrans", token: created.token, redirectUrl: created.redirect_url };
}

function verifyNotification(payload: MidtransNotification): boolean {
	return signatureMatches({
		orderId: payload.order_id,
		statusCode: payload.status_code,
		grossAmount: payload.gross_amount,
		signatureKey: payload.signature_key,
		serverKey: getServerKey(),
	});
}

/**
 * Asks Midtrans for the authoritative status of an order.
 *
 * Used instead of trusting a webhook body: the caller already verified the signature, but this
 * confirms the payment with the provider before money-backed benefits are granted. Non-2xx
 * responses, network failures, and unrecognised payloads all become `PaymentError`s so the caller
 * can log a reason and refuse to grant anything.
 */
async function fetchStatus(orderId: string): Promise<PaymentEvent> {
	const credentials = Buffer.from(`${getServerKey()}:`).toString("base64");
	const host = isProduction() ? "api.midtrans.com" : "api.sandbox.midtrans.com";

	const response = await fetch(`https://${host}/v2/${orderId}/status`, {
		headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/json" },
		signal: AbortSignal.timeout(10_000),
	}).catch((error: unknown) => {
		throw new PaymentError("PROVIDER_UNAVAILABLE", "Midtrans status request failed", { cause: error });
	});

	if (!response.ok) {
		throw new PaymentError(statusErrorCode(response.status), `Midtrans status request failed: ${response.status}`);
	}

	const body: unknown = await response.json().catch(() => null);
	if (typeof body !== "object" || body === null || !("transaction_status" in body)) {
		throw new PaymentError("INVALID_PAYLOAD", "Midtrans status response is not a status payload");
	}

	const { transaction_status: transactionStatus } = body;
	if (typeof transactionStatus !== "string") {
		throw new PaymentError("INVALID_PAYLOAD", "Midtrans status response is not a status payload");
	}

	const fraudStatus = "fraud_status" in body && typeof body.fraud_status === "string" ? body.fraud_status : undefined;
	const statusMessage =
		"status_message" in body && typeof body.status_message === "string" ? body.status_message : undefined;
	const channelMessage =
		"channel_response_message" in body && typeof body.channel_response_message === "string"
			? body.channel_response_message
			: undefined;

	const status = toPaymentStatus(transactionStatus, fraudStatus);

	const detail = [channelMessage, statusMessage].find(
		(message) => message && message !== "midtrans payment notification",
	);
	const settled = settlementOf(body as Record<string, unknown>);
	if (status !== "failed") return { status, ...settled };

	return {
		status,
		failure: toFailureCode(transactionStatus, fraudStatus, statusMessage, channelMessage) ?? "unknown",
		detail,
		...settled,
	};
}

/**
 * Pulls the fields worth keeping for reconciliation and support out of a status payload.
 *
 * Everything is optional because Midtrans omits what does not apply to the payment channel, and a
 * missing field must never be mistaken for a value.
 */
function settlementOf(body: Record<string, unknown>): Omit<PaymentEvent, "status" | "failure" | "detail"> {
	const read = (key: string) => {
		const value = body[key];
		return typeof value === "string" ? value : undefined;
	};
	return {
		providerTransactionId: read("transaction_id"),
		amountPaid: read("gross_amount"),
		paymentMethod: read("payment_type"),
	};
}

export const midtransProvider: PaymentProvider<MidtransNotification> = {
	name: "midtrans",
	createCheckout,
	verifyNotification,
	fetchStatus,
};
