import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { type } from "arktype";
import { useEffect } from "react";
import { toast } from "sonner";
import { AdminFieldRow } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { orpc } from "@/lib/orpc";

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
	} | null;
	open: boolean;
	onSuccess: () => void;
	onOpenChange: (open: boolean) => void;
}

export function EditProgramDialog({ universityProgram, open, onSuccess, onOpenChange }: EditProgramDialogProps) {
	const form = useForm({
		defaultValues: {
			tuition: "",
			capacity: "",
			accreditation: "none",
			averageScore: "",
			isActive: true,
		},
		onSubmit: async ({ value }) => {
			if (!universityProgram) return;
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

	useEffect(() => {
		if (universityProgram) {
			form.reset({
				tuition: universityProgram.tuition != null ? String(universityProgram.tuition) : "",
				capacity: universityProgram.capacity != null ? String(universityProgram.capacity) : "",
				accreditation: universityProgram.accreditation ?? "none",
				averageScore: universityProgram.averageScore != null ? String(universityProgram.averageScore) : "",
				isActive: universityProgram.isActive,
			});
		}
	}, [universityProgram, form]);

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
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="lg" aria-describedby={undefined}>
				<DialogHeader>
					<DialogTitle className="text-base">
						Edit {universityProgram?.studyProgram.name}
						{universityProgram?.studyProgram.category && ` (${universityProgram.studyProgram.category})`}
					</DialogTitle>
				</DialogHeader>

				{universityProgram && (
					<form
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
						className="space-y-3"
					>
						<form.Field name="tuition">
							{(field) => (
								<AdminFieldRow label="Biaya (Rp)" htmlFor={field.name} optional>
									<Input
										id={field.name}
										type="number"
										placeholder="5.000.000"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
								</AdminFieldRow>
							)}
						</form.Field>

						<form.Field name="capacity">
							{(field) => (
								<AdminFieldRow label="Kapasitas" htmlFor={field.name} optional>
									<Input
										id={field.name}
										type="number"
										placeholder="100"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
								</AdminFieldRow>
							)}
						</form.Field>

						<form.Field name="accreditation">
							{(field) => (
								<AdminFieldRow label="Akreditasi" htmlFor={field.name} optional>
									<Select value={field.state.value} onValueChange={(val) => field.handleChange(val)}>
										<SelectTrigger id={field.name} className="w-full">
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
								</AdminFieldRow>
							)}
						</form.Field>

						<form.Field name="averageScore">
							{(field) => (
								<AdminFieldRow label="Skor Rata-rata" htmlFor={field.name} optional>
									<Input
										id={field.name}
										type="number"
										placeholder="500"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
								</AdminFieldRow>
							)}
						</form.Field>

						<form.Field name="isActive">
							{(field) => (
								<AdminFieldRow label="Status aktif" htmlFor={field.name}>
									<Switch id={field.name} checked={field.state.value} onCheckedChange={field.handleChange} />
								</AdminFieldRow>
							)}
						</form.Field>

						<DialogFooter>
							<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
								{([canSubmit, isSubmitting]) => (
									<Button size="xs" isPending={isSubmitting} type="submit" disabled={!canSubmit || isSubmitting}>
										{"Simpan Perubahan"}
									</Button>
								)}
							</form.Subscribe>
						</DialogFooter>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}
