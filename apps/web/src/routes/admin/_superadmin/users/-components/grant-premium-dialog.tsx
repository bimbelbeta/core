import { CalendarDotsIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDateLong, formatDateMedium } from "@/lib/format-date";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";

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
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle className="text-base">Grant Premium</DialogTitle>
					<DialogDescription>Berikan status premium untuk user "{userName}"</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-3">
					{currentPremiumExpiry && (
						<div className="bg-muted/50 flex items-center justify-between rounded-md border px-4 py-2.5">
							<span className="text-muted-foreground text-sm">Premium expires</span>
							<Badge variant="outline">{formatDateMedium(currentPremiumExpiry)}</Badge>
						</div>
					)}
					<div className="flex flex-col gap-2">
						<Label>Tanggal expired</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									size="xs"
									variant="secondary"
									className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
								>
									<CalendarDotsIcon className="size-4" />
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
					</div>
				</div>
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
