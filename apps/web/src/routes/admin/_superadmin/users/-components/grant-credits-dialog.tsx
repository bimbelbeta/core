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

interface GrantCreditsDialogProps {
	userId: string;
	userName: string;
	currentCredits: number | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export function GrantCreditsDialog({
	userId,
	userName,
	currentCredits,
	open,
	onOpenChange,
	onSuccess,
}: GrantCreditsDialogProps) {
	const [amount, setAmount] = useState(1);

	const adjustCreditsMutation = useMutation(
		orpc.admin.credit.adjust.mutationOptions({
			onSuccess: () => {
				toast.success("Kredit berhasil ditambahkan");
				setAmount(1);
				onSuccess();
				onOpenChange(false);
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	return (
		<Dialog
			open={open}
			onOpenChange={(value) => {
				if (!value) setAmount(1);
				onOpenChange(value);
			}}
		>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle className="text-base">Add Credits</DialogTitle>
					<DialogDescription>Tambahkan tryout credits untuk user "{userName}"</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-3">
					<div className="bg-muted/50 flex items-center justify-between rounded-md border px-4 py-2.5">
						<span className="text-muted-foreground text-sm">Saldo saat ini</span>
						<span className="font-semibold">{currentCredits ?? 0} credits</span>
					</div>
					<div className="flex flex-col gap-2">
						<Label>Jumlah credits</Label>
						<Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.valueAsNumber)} />
					</div>
				</div>
				<DialogFooter>
					<Button
						size="xs"
						isPending={adjustCreditsMutation.isPending}
						onClick={() => adjustCreditsMutation.mutate({ userId, amount })}
						disabled={adjustCreditsMutation.isPending || !amount || amount < 1}
					>
						{"Add Credits"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
