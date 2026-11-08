import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { useState } from "react";
import { orpc } from "@/lib/orpc";

export function useReferral() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const [code, setCodeState] = useState("");
	const [localError, setLocalError] = useState<string | null>(null);
	const [success, setSuccess] = useState<{ premiumExpiresAt: Date; premiumDays: number } | null>(null);
	const [celebrate, setCelebrate] = useState(false);

	const redeemMutation = useMutation(
		orpc.referral.redeem.mutationOptions({
			onSuccess: (res) => {
				setSuccess(res);
				setCelebrate(true);
				setCodeState("");
				void queryClient.invalidateQueries({ queryKey: ["auth", "getSession"] });
				void router.invalidate();
			},
		}),
	);

	const setCode = (next: string) => {
		setCodeState(next);
		setLocalError(null);
		setSuccess(null);
		redeemMutation.reset();
	};

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		const trimmed = code.trim();
		if (!trimmed) return;
		if (!/^[A-Za-z0-9]+$/.test(trimmed)) {
			setLocalError("Kode hanya boleh berisi huruf dan angka.");
			return;
		}
		redeemMutation.mutate({ code: trimmed });
	};

	return {
		code,
		setCode,
		error: localError ?? redeemMutation.error?.message ?? null,
		success,
		celebrate,
		dismissCelebration: () => setCelebrate(false),
		isPending: redeemMutation.isPending,
		handleSubmit,
	};
}
