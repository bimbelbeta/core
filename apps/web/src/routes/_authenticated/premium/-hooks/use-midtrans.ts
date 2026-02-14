import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";

export function useMidtrans() {
	const queryClient = useQueryClient();
	const transactionMutation = useMutation(orpc.transaction.subscribe.mutationOptions());
	const [token, setToken] = useState<string | undefined>();
	const enabled = import.meta.env.VITE_PAYMENTS_ENABLED === "true";

	useEffect(() => {
		if (!enabled) return;

		const midtransScriptUrl = import.meta.env.PROD
			? "https://app.midtrans.com/snap/snap.js"
			: "https://app.sandbox.midtrans.com/snap/snap.js";
		const scriptTag = document.createElement("script");
		scriptTag.src = midtransScriptUrl;
		const myMidtransClientKey = (process.env.MIDTRANS_CLIENT_KEY ?? import.meta.env.MIDTRANS_CLIENT_KEY) || "";
		scriptTag.setAttribute("data-client-key", myMidtransClientKey);
		document.body.appendChild(scriptTag);
		return () => {
			document.body.removeChild(scriptTag);
		};
	}, []);

	useEffect(() => {
		if (!enabled) return;

		if (token) {
			// @ts-expect-error - Midtrans Snap is loaded globally
			window.snap.pay(token, {
				onSuccess: () => {
					toast.success("Pembayaran berhasil!");
					queryClient.invalidateQueries();
				},
				onPending: () => {
					toast.info("Menunggu pembayaran...");
				},
				onError: () => {
					toast.error("Pembayaran gagal. Silakan coba lagi.");
				},
				onClose: () => {
					toast.warning("Pembayaran dibatalkan.");
				},
			});
		}
	}, [token, queryClient]);

	const handlePurchase = async (slug: string) => {
		if (!enabled) {
			toast.info("Pembayaran belum tersedia. Segera hadir.");
			return;
		}

		try {
			const data = await transactionMutation.mutateAsync({ slug });
			setToken(data.token);
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error("Terjadi kesalahan. Silakan coba lagi.");
			}
		}
	};

	return {
		handlePurchase,
		isPending: enabled ? transactionMutation.isPending : false,
	};
}
