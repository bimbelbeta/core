import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { type } from "arktype";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { orpc } from "@/utils/orpc";

interface EditProgramDialogProps {
	universityProgram: {
		id: number;
		studyProgram: {
			id: number;
			name: string;
			category: string | null;
		};
		tuition: number | null;
		capacity: number | null;
		accreditation: string | null;
		isActive: boolean;
	};
	onSuccess: () => void;
	onOpenChange: (open: boolean) => void;
}

export function EditProgramDialog({ universityProgram, onSuccess, onOpenChange }: EditProgramDialogProps) {
	const form = useForm({
		defaultValues: {
			tuition: universityProgram.tuition ?? "",
			capacity: universityProgram.capacity ?? "",
			accreditation: universityProgram.accreditation ?? "",
			isActive: universityProgram.isActive,
		},
		onSubmit: async ({ value }) => {
			updateMutation.mutate({
				id: universityProgram.id,
				tuition: value.tuition ? Number(value.tuition) : undefined,
				capacity: value.capacity ? Number(value.capacity) : undefined,
				accreditation: value.accreditation || undefined,
				isActive: value.isActive,
			});
		},
		validators: {
			onChange: type({
				tuition: "string?",
				capacity: "string?",
				accreditation: "string?",
				isActive: "boolean",
			}),
		},
	});

	const updateMutation = useMutation(
		orpc.admin.university.universityPrograms.update.mutationOptions({
			onSuccess: () => {
				toast.success("Program studi berhasil diperbarui");
				onSuccess();
				onOpenChange(false);
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	return (
		<div className="grid gap-4 py-4">
			<div className="rounded-lg bg-muted p-3">
				<p className="font-medium text-sm">{universityProgram.studyProgram.name}</p>
			</div>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
				className="grid gap-4"
			>
				<form.Field name="tuition">
					{(field) => (
						<div className="grid grid-cols-4 items-start gap-4">
							<Label htmlFor={field.name} className="mt-2 text-right">
								Biaya
							</Label>
							<div className="col-span-3 space-y-1">
								<Input
									id={field.name}
									type="number"
									placeholder="Contoh: 5000000"
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

				<form.Field name="capacity">
					{(field) => (
						<div className="grid grid-cols-4 items-start gap-4">
							<Label htmlFor={field.name} className="mt-2 text-right">
								Kapasitas
							</Label>
							<div className="col-span-3 space-y-1">
								<Input
									id={field.name}
									type="number"
									placeholder="Contoh: 100"
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

				<form.Field name="accreditation">
					{(field) => (
						<div className="grid grid-cols-4 items-start gap-4">
							<Label htmlFor={field.name} className="mt-2 text-right">
								Akreditasi
							</Label>
							<div className="col-span-3 space-y-1">
								<Select value={field.state.value} onValueChange={(val) => field.handleChange(val)}>
									<SelectTrigger>
										<SelectValue placeholder="Pilih..." />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="">-</SelectItem>
										<SelectItem value="Unggul">Unggul</SelectItem>
										<SelectItem value="A">A</SelectItem>
										<SelectItem value="B">B</SelectItem>
										<SelectItem value="C">C</SelectItem>
										<SelectItem value="Baik Sekali">Baik Sekali</SelectItem>
										<SelectItem value="Baik">Baik</SelectItem>
									</SelectContent>
								</Select>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-red-500 text-xs">
										{error?.message}
									</p>
								))}
							</div>
						</div>
					)}
				</form.Field>

				<form.Field name="isActive">
					{(field) => (
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor={field.name} className="text-right font-medium text-sm">
								Status
							</Label>
							<div className="col-span-3 flex items-center gap-2">
								<Switch id={field.name} checked={field.state.value} onCheckedChange={field.handleChange} />
								<span className="text-muted-foreground text-sm">{field.state.value ? "Aktif" : "Tidak Aktif"}</span>
							</div>
						</div>
					)}
				</form.Field>

				<DialogFooter>
					<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
						{([canSubmit, isSubmitting]) => (
							<Button type="submit" disabled={!canSubmit || isSubmitting}>
								{isSubmitting ? (
									<>
										<Spinner />
										Memperbarui...
									</>
								) : (
									"Simpan Perubahan"
								)}
							</Button>
						)}
					</form.Subscribe>
				</DialogFooter>
			</form>
		</div>
	);
}
