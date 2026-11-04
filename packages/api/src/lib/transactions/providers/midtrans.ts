import { createHash } from "node:crypto";
import { Snap } from "midtrans-client";
import { PaymentError } from "@/lib/transactions/errors";
import type { Checkout, CheckoutInput, PaymentProvider, PaymentStatus } from "@/lib/transactions/types";

export type MidtransNotification = {
	order_id: string;
	status_code: string;
	gross_amount: string;
	signature_key: string;
};

type MidtransStatusPayload = {
	transaction_status: string;
	fraud_status?: string;
};

const paid = new Set(["settlement"]);
const failed = new Set(["deny", "cancel", "expire"]);

/**
 * Translates a Midtrans transaction status into the provider-independent status.
 *
 * Midtrans signals success two ways: `settlement` for immediate payment, and `capture` for card
 * payments that only count once fraud review accepts them. A challenged capture is therefore
 * `unknown` rather than paid. Anything not recognised stays `unknown` so the caller can ignore
 * it instead of guessing.
 */
export function toPaymentStatus(transactionStatus: string, fraudStatus?: string): PaymentStatus {
	if (paid.has(transactionStatus)) return "paid";
	if (transactionStatus === "capture") return fraudStatus === "accept" ? "paid" : "unknown";
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
	const expected = createHash("sha512").update(`${orderId}${statusCode}${grossAmount}${serverKey}`).digest("hex");
	return expected === signatureKey;
}

function getServerKey(): string {
	const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";
	if (!serverKey) throw new PaymentError("CONFIGURATION_ERROR", "MIDTRANS_SERVER_KEY is not set");
	return serverKey;
}

function getClientKey(): string {
	const clientKey = process.env.MIDTRANS_CLIENT_KEY ?? "";
	if (!clientKey) throw new PaymentError("CONFIGURATION_ERROR", "MIDTRANS_CLIENT_KEY is not set");
	return clientKey;
}

function isProduction(): boolean {
	return process.env.NODE_ENV === "production";
}

let snap: Snap | null = null;

function getSnap(): Snap {
	if (!snap) snap = new Snap({ isProduction: isProduction(), serverKey: getServerKey(), clientKey: getClientKey() });
	return snap;
}

function isRejection(error: unknown): boolean {
	const status = (error as { httpStatusCode?: number } | null)?.httpStatusCode;
	return typeof status === "number" && status >= 400 && status < 500;
}

async function createCheckout(input: CheckoutInput): Promise<Checkout> {
	const created = await getSnap()
		.createTransaction({
			transaction_details: { order_id: input.orderId, gross_amount: input.amount },
			item_details: [{ price: input.amount, quantity: 1, name: input.description }],
			customer_details: { first_name: input.customer.name, email: input.customer.email },
			credit_card: { secure: true },
		})
		.catch((error: unknown) => {
			throw new PaymentError(
				isRejection(error) ? "PROVIDER_REJECTED" : "PROVIDER_UNAVAILABLE",
				"Midtrans checkout failed",
				{ cause: error },
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
async function fetchStatus(orderId: string): Promise<PaymentStatus> {
	const credentials = Buffer.from(`${getServerKey()}:`).toString("base64");
	const host = isProduction() ? "api.midtrans.com" : "api.sandbox.midtrans.com";

	const response = await fetch(`https://${host}/v2/${orderId}/status`, {
		headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/json" },
	}).catch((error: unknown) => {
		throw new PaymentError("PROVIDER_UNAVAILABLE", "Midtrans status request failed", { cause: error });
	});

	if (!response.ok) {
		throw new PaymentError("PROVIDER_UNAVAILABLE", `Midtrans status request failed: ${response.status}`);
	}

	const body: unknown = await response.json().catch(() => null);
	if (
		typeof body !== "object" ||
		body === null ||
		typeof (body as MidtransStatusPayload).transaction_status !== "string"
	) {
		throw new PaymentError("INVALID_PAYLOAD", "Midtrans status response is not a status payload");
	}

	const payload = body as MidtransStatusPayload;
	return toPaymentStatus(payload.transaction_status, payload.fraud_status);
}

export const midtransProvider: PaymentProvider<MidtransNotification> = {
	name: "midtrans",
	createCheckout,
	verifyNotification,
	fetchStatus,
};
