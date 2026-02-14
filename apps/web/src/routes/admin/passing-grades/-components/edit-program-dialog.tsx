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
		averageScore: number | null;
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
			accreditation: universityProgram.accreditation ?? "none",
			averageScore: universityProgram.averageScore ?? "",
			isActive: universityProgram.isActive,
		},
		onSubmit: async ({ value }) => {
			updateMutation.mutate({
				id: universityProgram.id,
				tuition: value.tuition ? Number(value.tuition) : undefined,
				capacity: value.capacity ? Number(value.capacity) : undefined,
				accreditation: value.accreditation === "none" ? undefined : value.accreditation || undefined,
				averageScore: value.averageScore ? Number(value.averageScore) : undefined,
				isActive: value.isActive,
			});
		},
		validators: {
			onChange: type({
				tuition: "string?",
				capacity: "string?",
				accreditation: "string?",
				averageScore: "string?",
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
		<div className="space-y-4">
			{/* Program info header */}
			<div className="rounded-lg border bg-muted/50 px-4 py-3">
				<p className="font-medium text-sm">{universityProgram.studyProgram.name}</p>
				{universityProgram.studyProgram.category && (
					<p className="text-muted-foreground text-xs">{universityProgram.studyProgram.category}</p>
				)}
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
				<div className="grid grid-cols-2 gap-3">
					<form.Field name="tuition">
						{(field) => (
							<div className="space-y-1.5">
								<Label htmlFor={field.name} className="font-medium text-sm">
									Biaya (Rp)
								</Label>
								<Input
									id={field.name}
									type="number"
									placeholder="5.000.000"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-destructive text-xs">
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>

					<form.Field name="capacity">
						{(field) => (
							<div className="space-y-1.5">
								<Label htmlFor={field.name} className="font-medium text-sm">
									Kapasitas
								</Label>
								<Input
									id={field.name}
									type="number"
									placeholder="100"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-destructive text-xs">
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<form.Field name="accreditation">
						{(field) => (
							<div className="space-y-1.5">
								<Label htmlFor={field.name} className="font-medium text-sm">
									Akreditasi
								</Label>
								<Select value={field.state.value} onValueChange={(val) => field.handleChange(val)}>
									<SelectTrigger>
										<SelectValue placeholder="Pilih..." />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">-</SelectItem>
										<SelectItem value="Unggul">Unggul</SelectItem>
										<SelectItem value="A">A</SelectItem>
										<SelectItem value="B">B</SelectItem>
										<SelectItem value="C">C</SelectItem>
										<SelectItem value="Baik Sekali">Baik Sekali</SelectItem>
										<SelectItem value="Baik">Baik</SelectItem>
									</SelectContent>
								</Select>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-destructive text-xs">
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>

					<form.Field name="averageScore">
						{(field) => (
							<div className="space-y-1.5">
								<Label htmlFor={field.name} className="font-medium text-sm">
									Skor Rata-rata
								</Label>
								<Input
									id={field.name}
									type="number"
									placeholder="500"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-destructive text-xs">
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>

				<form.Field name="isActive">
					{(field) => (
						<div className="flex items-center justify-between rounded-lg border px-4 py-3">
							<div>
								<Label htmlFor={field.name} className="cursor-pointer font-medium text-sm">
									Status Aktif
								</Label>
								<p className="text-muted-foreground text-xs">
									{field.state.value ? "Program studi ini aktif" : "Program studi ini tidak aktif"}
								</p>
							</div>
							<Switch id={field.name} checked={field.state.value} onCheckedChange={field.handleChange} />
						</div>
					)}
				</form.Field>

				<DialogFooter className="pt-2">
					<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
						{([canSubmit, isSubmitting]) => (
							<Button type="submit" disabled={!canSubmit || isSubmitting} className="w-full">
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
