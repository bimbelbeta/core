import { createHash } from "node:crypto";
import type { MidtransStatus } from "./types";

/**
 * Verifies Midtrans webhook signature.
 * SHA-512(orderId + statusCode + grossAmount + serverKey) must match the provided signature.
 */
export function verifyMidtransSignature(
	orderId: string,
	statusCode: string,
	grossAmount: string,
	signatureKey: string,
): boolean {
	const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";
	const expected = createHash("sha512").update(`${orderId}${statusCode}${grossAmount}${serverKey}`).digest("hex");
	return expected === signatureKey;
}

export async function verifyMidtransTransaction(orderId: string): Promise<MidtransStatus> {
	const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
	const auth = Buffer.from(`${serverKey}:`).toString("base64");

	const statusResponse = await fetch(
		`https://api${process.env.NODE_ENV === "production" ? "" : ".sandbox"}.midtrans.com/v2/${orderId}/status`,
		{
			headers: {
				Authorization: `Basic ${auth}`,
				"Content-Type": "application/json",
			},
		},
	);

	if (!statusResponse.ok) {
		throw new Error(`Failed to verify transaction status: ${statusResponse.status}`);
	}

	return statusResponse.json() as Promise<MidtransStatus>;
}
