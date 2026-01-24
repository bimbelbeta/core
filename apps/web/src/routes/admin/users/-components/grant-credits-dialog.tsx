import { PlusIcon } from "@phosphor-icons/react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { orpc } from "@/utils/orpc";

interface GrantCreditsDialogProps {
	userId: string;
	userName: string;
	currentCredits: number;
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
	const form = useForm({
		defaultValues: {
			amount: 1,
			note: "",
		},
		onSubmit: async ({ value }) => {
			adjustCreditsMutation.mutate({
				userId,
				amount: value.amount,
				note: value.note || undefined,
			});
		},
		validators: {
			onChange: type({
				amount: "number > 0",
				note: "string?",
			}),
		},
	});

	const adjustCreditsMutation = useMutation(
		orpc.admin.credit.adjustCredits.mutationOptions({
			onSuccess: () => {
				toast.success("Kredit berhasil ditambahkan");
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
					<PlusIcon className="size-4" />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-125">
				<DialogHeader>
					<DialogTitle>Grant Credits</DialogTitle>
					<DialogDescription>Tambahkan tryout credits untuk user "{userName}"</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-2 py-4">
					<div className="flex items-center justify-between rounded-md border bg-muted px-4 py-2">
						<span className="text-muted-foreground text-sm">Saldo saat ini:</span>
						<span className="font-semibold">{currentCredits} credits</span>
					</div>
				</div>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
					className="flex flex-col gap-4"
				>
					<div className="grid gap-4">
						<form.Field name="amount">
							{(field) => (
								<div className="grid grid-cols-4 items-center gap-4">
									<Label htmlFor={field.name} className="text-right">
										Jumlah
									</Label>
									<div className="col-span-3 space-y-1">
										<Input
											id={field.name}
											type="number"
											min={1}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.valueAsNumber)}
										/>
										{field.state.meta.errors.map((error) => (
											<p key={error?.message} className="text-red-500 text-xs">
												{error?.message}
											</p>
										))}
									</div>
								</div>
							)}
						</form.Field>

						<form.Field name="note">
							{(field) => (
								<div className="grid grid-cols-4 items-start gap-4">
									<Label htmlFor={field.name} className="mt-2 text-right">
										Catatan
									</Label>
									<Input
										id={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Alasan pemberian credits..."
										className="col-span-3"
									/>
								</div>
							)}
						</form.Field>
					</div>

					<DialogFooter>
						<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
							{([canSubmit, isSubmitting]) => (
								<Button type="submit" disabled={!canSubmit || isSubmitting}>
									{isSubmitting ? "Memproses..." : "Berikan Credits"}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
