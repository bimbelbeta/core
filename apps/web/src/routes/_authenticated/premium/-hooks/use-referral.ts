import { useMutation } from "@tanstack/react-query";
import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc";

export function useReferral() {
	const [code, setCode] = useState("");
	const [successData, setSuccessData] = useState<{ message: string; premiumExpiresAt: Date } | null>(null);

	const redeemMutation = useMutation(
		orpc.referral.redeem.mutationOptions({
			onSuccess: (res) => {
				setSuccessData(res);
				setCode("");
				authClient.getSession({ fetchOptions: { cache: "no-cache" } });
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		const trimmed = code.trim();
		if (!trimmed) return;
		if (!/^[A-Za-z0-9]+$/.test(trimmed)) {
			toast.error("Kode tidak valid — hanya huruf dan angka yang diperbolehkan.");
			return;
		}
		redeemMutation.mutate({ code: trimmed });
	};

	return { code, setCode, successData, setSuccessData, isPending: redeemMutation.isPending, handleSubmit };
}
