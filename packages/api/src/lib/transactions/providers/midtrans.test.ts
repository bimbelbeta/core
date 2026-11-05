import { afterAll, describe, expect, spyOn, test } from "bun:test";
import { createHash } from "node:crypto";
import { Snap } from "midtrans-client";
import { PaymentError } from "@/lib/transactions/errors";
import { midtransProvider, signatureMatches, toPaymentStatus } from "@/lib/transactions/providers/midtrans";

const SERVER_KEY = "test-server-key-abc123";
const originalServerKey = process.env.MIDTRANS_SERVER_KEY;
const ORDER_ID = "ORDER-001";
const STATUS_CODE = "200";
const GROSS_AMOUNT = "100000.00";

function sign(orderId: string, statusCode: string, grossAmount: string, serverKey: string) {
	return createHash("sha512").update(`${orderId}${statusCode}${grossAmount}${serverKey}`).digest("hex");
}

const notification = {
	order_id: ORDER_ID,
	status_code: STATUS_CODE,
	gross_amount: GROSS_AMOUNT,
	signature_key: sign(ORDER_ID, STATUS_CODE, GROSS_AMOUNT, SERVER_KEY),
};

afterAll(() => {
	process.env.MIDTRANS_SERVER_KEY = originalServerKey;
});

describe("signatureMatches", () => {
	const base = { orderId: ORDER_ID, statusCode: STATUS_CODE, grossAmount: GROSS_AMOUNT, serverKey: SERVER_KEY };

	test("accepts a signature computed with the same inputs", () => {
		expect(signatureMatches({ ...base, signatureKey: sign(ORDER_ID, STATUS_CODE, GROSS_AMOUNT, SERVER_KEY) })).toBe(
			true,
		);
	});

	test("rejects a signature when any signed field differs", () => {
		const signatureKey = sign(ORDER_ID, STATUS_CODE, GROSS_AMOUNT, SERVER_KEY);
		expect(signatureMatches({ ...base, orderId: "OTHER", signatureKey })).toBe(false);
		expect(signatureMatches({ ...base, statusCode: "400", signatureKey })).toBe(false);
		expect(signatureMatches({ ...base, grossAmount: "999999.00", signatureKey })).toBe(false);
		expect(signatureMatches({ ...base, serverKey: "wrong-key", signatureKey })).toBe(false);
	});
});

describe("toPaymentStatus", () => {
	test("maps settled and captured payments to paid", () => {
		expect(toPaymentStatus("settlement")).toBe("paid");
		expect(toPaymentStatus("capture", "accept")).toBe("paid");
	});

	test("leaves a challenged capture unresolved", () => {
		expect(toPaymentStatus("capture", "challenge")).toBe("unknown");
		expect(toPaymentStatus("capture")).toBe("unknown");
	});

	test("maps pending, failed and unrecognised statuses", () => {
		expect(toPaymentStatus("pending")).toBe("pending");
		for (const status of ["deny", "cancel", "expire"]) expect(toPaymentStatus(status)).toBe("failed");
		for (const status of ["refund", "partial_refund", "authorize"]) expect(toPaymentStatus(status)).toBe("unknown");
	});
});

describe("verifyNotification", () => {
	test("accepts a correctly signed payload", () => {
		process.env.MIDTRANS_SERVER_KEY = SERVER_KEY;
		expect(midtransProvider.verifyNotification(notification)).toBe(true);
	});

	test("rejects a tampered payload", () => {
		process.env.MIDTRANS_SERVER_KEY = SERVER_KEY;
		expect(midtransProvider.verifyNotification({ ...notification, gross_amount: "1.00" })).toBe(false);
	});

	test("refuses to verify when the server key is missing", () => {
		process.env.MIDTRANS_SERVER_KEY = "";
		expect(() => midtransProvider.verifyNotification(notification)).toThrow(PaymentError);
		expect(() => midtransProvider.verifyNotification(notification)).toThrow("MIDTRANS_SERVER_KEY is not set");
	});
});

describe("fetchStatus", () => {
	function respond(body: unknown, status = 200) {
		return spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(body), { status }));
	}

	test("returns the mapped status", async () => {
		process.env.MIDTRANS_SERVER_KEY = SERVER_KEY;
		const request = respond({ transaction_status: "settlement", fraud_status: "accept" });
		try {
			expect(await midtransProvider.fetchStatus(ORDER_ID)).toBe("paid");
		} finally {
			request.mockRestore();
		}
	});

	test("reports an unreachable provider", async () => {
		process.env.MIDTRANS_SERVER_KEY = SERVER_KEY;
		const request = respond({}, 503);
		try {
			await expect(midtransProvider.fetchStatus(ORDER_ID)).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE" });
		} finally {
			request.mockRestore();
		}
	});

	test("reports a payload without a transaction status", async () => {
		process.env.MIDTRANS_SERVER_KEY = SERVER_KEY;
		const request = respond({ status_code: "200" });
		try {
			await expect(midtransProvider.fetchStatus(ORDER_ID)).rejects.toMatchObject({ code: "INVALID_PAYLOAD" });
		} finally {
			request.mockRestore();
		}
	});
});

describe("createCheckout", () => {
	test("maps the provider response to the neutral checkout shape", async () => {
		process.env.MIDTRANS_SERVER_KEY = SERVER_KEY;
		process.env.MIDTRANS_CLIENT_KEY = "test-client-key";
		const create = spyOn(Snap.prototype, "createTransaction").mockResolvedValue({
			token: "snap-token",
			redirect_url: "https://app.midtrans.com/snap/v4/redirection/abc",
		});
		try {
			expect(
				await midtransProvider.createCheckout({
					orderId: ORDER_ID,
					amount: "10000",
					description: "Premium",
					customer: { name: "User", email: "user@example.com" },
					returnUrl: "https://app.example.com/premium",
				}),
			).toEqual({
				provider: "midtrans",
				token: "snap-token",
				redirectUrl: "https://app.midtrans.com/snap/v4/redirection/abc",
			});
			expect(create.mock.calls[0]?.[0]).toMatchObject({
				callbacks: {
					finish: "https://app.example.com/premium",
					error: "https://app.example.com/premium",
					pending: "https://app.example.com/premium",
				},
			});
		} finally {
			create.mockRestore();
		}
	});

	test("reports a rejected checkout as PROVIDER_REJECTED", async () => {
		process.env.MIDTRANS_SERVER_KEY = SERVER_KEY;
		process.env.MIDTRANS_CLIENT_KEY = "test-client-key";
		const create = spyOn(Snap.prototype, "createTransaction").mockRejectedValue({ httpStatusCode: 406 });
		try {
			await expect(
				midtransProvider.createCheckout({
					orderId: ORDER_ID,
					amount: "10000",
					description: "Premium",
					customer: { name: "User", email: "user@example.com" },
				}),
			).rejects.toMatchObject({ code: "PROVIDER_REJECTED" });
		} finally {
			create.mockRestore();
		}
	});
});
