import type { auth } from "@bimbelbeta/auth";
import { Snap } from "midtrans-client";

let _snap: Snap | null = null;

function getSnap(): Snap {
	if (!_snap) {
		_snap = new Snap({
			isProduction: process.env.NODE_ENV === "production",
			serverKey: process.env.MIDTRANS_SERVER_KEY || "",
			clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
		});
	}
	return _snap;
}

export async function createSubscriptionTransaction({
	id,
	name,
	price,
	session,
}: {
	id: string;
	name: string;
	price: string;
	session: typeof auth.$Infer.Session;
}) {
	const params = {
		transaction_details: {
			order_id: id,
			gross_amount: price,
		},
		item_details: [
			{
				price: price,
				quantity: 1,
				name: name,
			},
		],
		customer_details: {
			first_name: session.user.name,
			email: session.user.email,
		},
		credit_card: { secure: true },
		callbacks: {
			finish: `${process.env.CORS_ORIGIN}/premium/payment/finish`,
			error: `${process.env.CORS_ORIGIN}/premium/payment/error`,
			pending: `${process.env.CORS_ORIGIN}/premium/payment/unfinish`,
		},
	};

	let snapTransaction: { token: string; redirect_url: string };
	try {
		snapTransaction = await getSnap().createTransaction(params);
	} catch (err) {
		throw new Error("Gagal memproses pembayaran. Silahkan coba lagi.", { cause: err });
	}

	return {
		token: snapTransaction.token,
		redirectUrl: snapTransaction.redirect_url,
	};
}
