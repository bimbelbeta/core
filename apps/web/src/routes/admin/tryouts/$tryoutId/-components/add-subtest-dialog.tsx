import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { type } from "arktype";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { orpc } from "@/lib/orpc";

export function AddSubtestDialog({
	open,
	onOpenChange,
	onSuccess,
	tryoutId,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
	tryoutId: number;
}) {
	const form = useForm({
		defaultValues: {
			name: "",
			description: "",
			duration: 30,
			questionOrder: "sequential" as "random" | "sequential",
		},
		onSubmit: async ({ value }) => {
			createMutation.mutate({
				tryoutId,
				name: value.name,
				description: value.description || undefined,
				duration: value.duration,
				questionOrder: value.questionOrder,
			});
		},
		validators: {
			onChange: type({
				name: "string >= 1",
				duration: "number >= 0",
				questionOrder: "'random' | 'sequential'",
			}),
		},
	});

	const createMutation = useMutation(
		orpc.admin.tryout.subtest.create.mutationOptions({
			onSuccess: () => {
				toast.success("Subtest berhasil dibuat");
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
			<DialogContent size="lg" className="flex max-h-[85vh] flex-col">
				<DialogHeader className="shrink-0">
					<DialogTitle className="text-base">Tambah Subtest</DialogTitle>
					<DialogDescription>Tambahkan subtest baru ke dalam tryout. Isi form di bawah ini.</DialogDescription>
				</DialogHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
					className="flex flex-1 flex-col gap-3"
				>
					<div className="-m-1 min-h-0 flex-1 overflow-y-auto p-1">
						<div className="grid gap-3">
							<form.Field name="name">
								{(field) => (
									<AdminFieldRow label="Nama" htmlFor={field.name}>
										<div className="space-y-1">
											<Input
												id={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
											/>
											{field.state.meta.errors.map((error) => (
												<Typography variant="caption" tone="destructive" key={error?.message}>
													{error?.message}
												</Typography>
											))}
										</div>
									</AdminFieldRow>
								)}
							</form.Field>

							<form.Field name="description">
								{(field) => (
									<AdminFieldRow label="Deskripsi" htmlFor={field.name}>
										<Textarea
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Deskripsi subtest..."
											rows={3}
										/>
									</AdminFieldRow>
								)}
							</form.Field>

							<form.Field name="duration">
								{(field) => (
									<AdminFieldRow label="Durasi (menit)" htmlFor={field.name}>
										<div className="space-y-1">
											<Input
												id={field.name}
												type="number"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.valueAsNumber)}
											/>
											{field.state.meta.errors.map((error) => (
												<Typography variant="caption" tone="destructive" key={error?.message}>
													{error?.message}
												</Typography>
											))}
										</div>
									</AdminFieldRow>
								)}
							</form.Field>

							<form.Field name="questionOrder">
								{(field) => (
									<AdminFieldRow label="Urutan Soal" htmlFor={field.name}>
										<Select
											value={field.state.value}
											onValueChange={(val) => field.handleChange(val as typeof field.state.value)}
										>
											<SelectTrigger id={field.name} className="w-full">
												<SelectValue placeholder="Pilih urutan" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="sequential">Berurutan</SelectItem>
												<SelectItem value="random">Acak</SelectItem>
											</SelectContent>
										</Select>
									</AdminFieldRow>
								)}
							</form.Field>
						</div>
					</div>

					<DialogFooter className="shrink-0">
						<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
							{([canSubmit, isSubmitting]) => (
								<Button size="xs" isPending={isSubmitting} type="submit" disabled={!canSubmit || isSubmitting}>
									{"Tambah Subtest"}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
