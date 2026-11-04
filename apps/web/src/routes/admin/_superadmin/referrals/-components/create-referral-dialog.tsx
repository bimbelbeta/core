import { PlusIcon } from "@phosphor-icons/react";
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
import { useCreateReferral } from "../-hooks/use-create-referral";

export function CreateReferralDialog({ onSuccess }: { onSuccess: () => void }) {
	const {
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
	} = useCreateReferral(onSuccess);

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
							<Button type="submit" disabled={createMutation.isPending} id="submit-create-referral-btn">
								{createMutation.isPending ? "Membuat..." : "Buat Kode"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
