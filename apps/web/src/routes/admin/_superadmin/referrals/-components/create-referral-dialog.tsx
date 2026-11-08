import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AdminFieldRow } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { orpc } from "@/lib/orpc";

export function CreateReferralDialog({ onSuccess }: { onSuccess: () => void }) {
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

	return (
		<>
			<Button size="xs" onClick={() => setOpen(true)} id="create-referral-btn">
				Buat kode referal
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent size="lg" aria-describedby={undefined}>
					<DialogHeader>
						<DialogTitle className="text-base">Buat kode referal</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-3">
						<AdminFieldRow
							label="Kode"
							htmlFor="ref-code"
							optional
							hint="Kosongkan untuk dibuat otomatis. Hanya huruf dan angka."
						>
							<Input
								id="ref-code"
								placeholder="Contoh: PREM30DAYS"
								value={code}
								onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
							/>
						</AdminFieldRow>
						<AdminFieldRow label="Durasi Premium (hari) *" htmlFor="ref-premium-days">
							<Input
								id="ref-premium-days"
								type="number"
								min={1}
								placeholder="30"
								value={premiumDays}
								onChange={(e) => setPremiumDays(e.target.value)}
								required
							/>
						</AdminFieldRow>
						<AdminFieldRow
							label="Maks. Penggunaan"
							htmlFor="ref-max-usages"
							optional
							hint="Kosongkan untuk tak terbatas"
						>
							<Input
								id="ref-max-usages"
								type="number"
								min={1}
								placeholder="Tak terbatas"
								value={maxUsages}
								onChange={(e) => setMaxUsages(e.target.value)}
							/>
						</AdminFieldRow>
						<AdminFieldRow
							label="Berlaku Hingga"
							htmlFor="ref-valid-until"
							optional
							hint="Kosongkan untuk tanpa batas waktu"
						>
							<Input
								id="ref-valid-until"
								type="datetime-local"
								value={validUntil}
								onChange={(e) => setValidUntil(e.target.value)}
							/>
						</AdminFieldRow>
						<DialogFooter>
							<Button
								size="xs"
								isPending={createMutation.isPending}
								type="submit"
								disabled={createMutation.isPending}
								id="submit-create-referral-btn"
							>
								{"Buat kode"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
