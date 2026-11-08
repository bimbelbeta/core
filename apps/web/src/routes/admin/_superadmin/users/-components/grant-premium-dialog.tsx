import { CalendarDotsIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AdminFieldRow } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDateLong, formatDateMedium } from "@/lib/format-date";
import { orpc } from "@/lib/orpc";

interface GrantPremiumDialogProps {
	userId: string;
	userName: string;
	currentPremiumExpiry: Date | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export function GrantPremiumDialog({
	userId,
	userName,
	currentPremiumExpiry,
	open,
	onOpenChange,
	onSuccess,
}: GrantPremiumDialogProps) {
	const [date, setDate] = useState<Date | undefined>(undefined);

	const updateMutation = useMutation(
		orpc.admin.users.update.mutationOptions({
			onSuccess: () => {
				toast.success("Premium berhasil diberikan");
				setDate(undefined);
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
				if (!value) setDate(undefined);
				onOpenChange(value);
			}}
		>
			<DialogContent size="lg">
				<DialogHeader>
					<DialogTitle className="text-base">Grant Premium</DialogTitle>
					<DialogDescription>Berikan status premium untuk user "{userName}"</DialogDescription>
				</DialogHeader>
				<AdminFieldRow
					label="Tanggal expired"
					htmlFor="grant-premium-date"
					hint={
						currentPremiumExpiry
							? `Saat ini berakhir ${formatDateMedium(currentPremiumExpiry)}`
							: "User belum berstatus premium"
					}
				>
					<Popover>
						<PopoverTrigger asChild>
							<Button
								id="grant-premium-date"
								variant="input"
								data-empty={!date}
								className="data-[empty=true]:text-muted-foreground w-full"
							>
								<CalendarDotsIcon className="mr-2 size-4" />
								{date ? formatDateLong(date) : "Pilih tanggal"}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="single"
								selected={date}
								onSelect={setDate}
								disabled={(d) => d < new Date()}
								initialFocus
							/>
						</PopoverContent>
					</Popover>
				</AdminFieldRow>
				<DialogFooter>
					<Button
						size="xs"
						isPending={updateMutation.isPending}
						onClick={() =>
							updateMutation.mutate({
								userId,
								isPremium: true,
								premiumExpiresAt: date ?? null,
							})
						}
						disabled={updateMutation.isPending || !date}
					>
						{"Grant Premium"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
