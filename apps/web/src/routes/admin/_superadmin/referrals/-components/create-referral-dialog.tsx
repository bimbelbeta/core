import { PlusIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
			<Button onClick={() => setOpen(true)} size="sm" id="create-referral-btn">
				<PlusIcon className="mr-1 size-4" />
				Buat Kode Referal
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Buat Kode Referal</DialogTitle>
						<DialogDescription>
							Kosongkan kolom "Kode" untuk auto-generate. Hanya huruf dan angka (A-Z, 0-9).
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-1.5">
							<Label htmlFor="ref-code">Kode (opsional — auto-generate jika kosong)</Label>
							<Input
								id="ref-code"
								placeholder="Contoh: PREM30DAYS"
								value={code}
								onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="ref-premium-days">Durasi Premium (hari) *</Label>
							<Input
								id="ref-premium-days"
								type="number"
								min={1}
								placeholder="30"
								value={premiumDays}
								onChange={(e) => setPremiumDays(e.target.value)}
								required
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="ref-max-usages">Maks. Penggunaan (kosong = tak terbatas)</Label>
							<Input
								id="ref-max-usages"
								type="number"
								min={1}
								placeholder="Tak terbatas"
								value={maxUsages}
								onChange={(e) => setMaxUsages(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="ref-valid-until">Berlaku Hingga (kosong = selamanya)</Label>
							<Input
								id="ref-valid-until"
								type="datetime-local"
								value={validUntil}
								onChange={(e) => setValidUntil(e.target.value)}
							/>
						</div>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => setOpen(false)}>
								Batal
							</Button>
							<Button
								isPending={createMutation.isPending}
								type="submit"
								disabled={createMutation.isPending}
								id="submit-create-referral-btn"
							>
								{"Buat Kode"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
