import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AdminFieldRow } from "@/components/admin/admin-page";
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
			<DialogContent size="lg">
				<DialogHeader>
					<DialogTitle className="text-base">Add Credits</DialogTitle>
					<DialogDescription>Tambahkan tryout credits untuk user "{userName}"</DialogDescription>
				</DialogHeader>
				<AdminFieldRow
					label="Jumlah credits"
					htmlFor="grant-credits"
					hint={`Saldo saat ini ${currentCredits ?? 0} credits`}
				>
					<Input
						id="grant-credits"
						type="number"
						min={1}
						value={amount}
						onChange={(e) => setAmount(e.target.valueAsNumber)}
					/>
				</AdminFieldRow>
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
