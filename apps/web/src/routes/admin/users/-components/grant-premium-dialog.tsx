import { StarIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { type } from "arktype";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { orpc } from "@/utils/orpc";

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
	const form = useForm({
		defaultValues: {
			expiresAt: currentPremiumExpiry ? new Date(currentPremiumExpiry).toISOString().slice(0, 16) : "",
		},
		onSubmit: async ({ value }) => {
			grantPremiumMutation.mutate({
				userId,
				expiresAt: value.expiresAt || undefined,
			});
		},
		validators: {
			onChange: type({
				expiresAt: "string?",
			}),
		},
	});

	const grantPremiumMutation = useMutation(
		orpc.admin.users.grantPremium.mutationOptions({
			onSuccess: () => {
				toast.success("Premium berhasil diberikan");
				form.reset();
				onSuccess();
				onOpenChange(false);
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				<Button variant="ghost" size="icon">
					<StarIcon className="size-4" />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-125">
				<DialogHeader>
					<DialogTitle>Grant Premium</DialogTitle>
					<DialogDescription>Berikan status premium untuk user "{userName}"</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-2 py-4">
					{currentPremiumExpiry && (
						<div className="flex items-center justify-between rounded-md border bg-muted px-4 py-2">
							<span className="text-muted-foreground text-sm">Premium expired:</span>
							<span className="font-semibold">{new Date(currentPremiumExpiry).toLocaleString("id-ID")}</span>
						</div>
					)}
				</div>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
					className="flex flex-col gap-4"
				>
					<div className="grid gap-4">
						<form.Field name="expiresAt">
							{(field) => (
								<div className="grid grid-cols-4 items-center gap-4">
									<Label htmlFor={field.name} className="text-right">
										Tanggal Expired
									</Label>
									<div className="col-span-3 space-y-1">
										<input
											id={field.name}
											type="datetime-local"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
										/>
										<p className="text-muted-foreground text-xs">Kosongkan untuk premium lifetime</p>
									</div>
								</div>
							)}
						</form.Field>
					</div>

					<DialogFooter>
						<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
							{([canSubmit, isSubmitting]) => (
								<Button type="submit" disabled={!canSubmit || isSubmitting}>
									{isSubmitting ? "Memproses..." : "Berikan Premium"}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
