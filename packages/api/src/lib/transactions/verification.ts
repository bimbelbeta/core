import type { MidtransStatus } from "./types";

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
		console.error(`Midtrans API error: ${statusResponse.status}`);
		throw new Error("Failed to verify transaction status");
	}

	return statusResponse.json() as Promise<MidtransStatus>;
}
