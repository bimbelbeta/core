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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { orpc } from "@/utils/orpc";

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
		orpc.admin.tryout.subtest.createSubtest.mutationOptions({
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
			<DialogContent className="flex max-h-[85vh] flex-col sm:max-w-125">
				<DialogHeader className="shrink-0">
					<DialogTitle>Tambah Subtest</DialogTitle>
					<DialogDescription>Tambahkan subtest baru ke dalam tryout. Isi form di bawah ini.</DialogDescription>
				</DialogHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
					className="flex flex-1 flex-col gap-4 overflow-hidden"
				>
					<div className="max-h-[calc(85vh-14rem)] flex-1 overflow-y-auto">
						<div className="grid gap-4 py-4">
							<form.Field name="name">
								{(field) => (
									<div className="grid grid-cols-4 items-start gap-4">
										<Label htmlFor={field.name} className="mt-2 text-right">
											Nama
										</Label>
										<div className="col-span-3 space-y-1">
											<Input
												id={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
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

							<form.Field name="description">
								{(field) => (
									<div className="grid grid-cols-4 items-start gap-4">
										<Label htmlFor={field.name} className="mt-2 text-right">
											Deskripsi
										</Label>
										<Textarea
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Deskripsi subtest..."
											className="col-span-3"
											rows={3}
										/>
									</div>
								)}
							</form.Field>

							<form.Field name="duration">
								{(field) => (
									<div className="grid grid-cols-4 items-start gap-4">
										<Label htmlFor={field.name} className="mt-2 text-right">
											Durasi (menit)
										</Label>
										<div className="col-span-3 space-y-1">
											<Input
												id={field.name}
												type="number"
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

							<form.Field name="questionOrder">
								{(field) => (
									<div className="grid grid-cols-4 items-start gap-4">
										<Label htmlFor={field.name} className="mt-2 text-right">
											Urutan Soal
										</Label>
										<div className="col-span-3">
											<Select
												value={field.state.value}
												onValueChange={(val) => field.handleChange(val as typeof field.state.value)}
											>
												<SelectTrigger id={field.name}>
													<SelectValue placeholder="Pilih urutan" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="sequential">Berurutan</SelectItem>
													<SelectItem value="random">Acak</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>
								)}
							</form.Field>
						</div>
					</div>

					<DialogFooter className="shrink-0">
						<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
							{([canSubmit, isSubmitting]) => (
								<Button type="submit" disabled={!canSubmit || isSubmitting}>
									{isSubmitting ? "Menambahkan..." : "Tambah Subtest"}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
