import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/lib/orpc";

export function useCreateReferral(onSuccess: () => void) {
	const [open, setOpen] = useState(false);
	const [code, setCode] = useState("");
	const [premiumDays, setPremiumDays] = useState("");
	const [maxUsages, setMaxUsages] = useState("");
	const [validUntil, setValidUntil] = useState("");

	const createMutation = useMutation(
		orpc.admin.referral.create.mutationOptions({
			onSuccess: () => {
				toast.success("Kode referal berhasil dibuat.");
				setOpen(false);
				setCode("");
				setPremiumDays("");
				setMaxUsages("");
				setValidUntil("");
				onSuccess();
			},
			onError: (err) => toast.error(err.message),
		}),
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const days = Number.parseInt(premiumDays, 10);
		if (!premiumDays || Number.isNaN(days) || days < 1) {
			toast.error("Durasi premium harus lebih dari 0 hari.");
			return;
		}
		if (code && !/^[A-Z0-9]+$/i.test(code)) {
			toast.error("Kode hanya boleh mengandung huruf dan angka.");
			return;
		}
		createMutation.mutate({
			code: code.toUpperCase() || undefined,
			premiumDays: days,
			maxUsages: maxUsages ? Number.parseInt(maxUsages, 10) : null,
			validUntil: validUntil ? new Date(validUntil) : null,
		});
	};

	return {
		open,
		setOpen,
		code,
		setCode,
		premiumDays,
		setPremiumDays,
		maxUsages,
		setMaxUsages,
		validUntil,
		setValidUntil,
		createMutation,
		handleSubmit,
	};
}
