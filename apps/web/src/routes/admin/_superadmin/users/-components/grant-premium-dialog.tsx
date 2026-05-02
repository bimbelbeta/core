import { CalendarDotsIcon, StarIcon } from "@phosphor-icons/react";
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
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDateLong } from "@/lib/format-date";
import { cn } from "@/lib/utils";
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
			<DialogTrigger asChild>
				<Button variant="ghost" size="icon">
					<StarIcon className="size-4" />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Grant Premium</DialogTitle>
					<DialogDescription>Berikan status premium untuk user "{userName}"</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-4 py-2">
					{currentPremiumExpiry && (
						<div className="flex items-center justify-between rounded-md border bg-muted/50 px-4 py-2.5">
							<span className="text-muted-foreground text-sm">Premium expires</span>
							<Badge variant="outline">{new Date(currentPremiumExpiry).toLocaleDateString("id-ID")}</Badge>
						</div>
					)}
					<div className="flex flex-col gap-2">
						<Label>Tanggal expired</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
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
						onClick={() =>
							updateMutation.mutate({
								userId,
								isPremium: true,
								premiumExpiresAt: date ?? null,
							})
						}
						disabled={updateMutation.isPending || !date}
					>
						{updateMutation.isPending ? "Memproses..." : "Grant Premium"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
