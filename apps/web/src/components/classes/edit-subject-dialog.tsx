import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type } from "arktype";
import { useEffect } from "react";
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
import { Typography } from "@/components/ui/typography";
import { orpc } from "@/lib/orpc";
import { SUBJECT_CATEGORY_LABELS, subjectCategorySchema } from "@/lib/schemas";
import { isValidCategory, validateGradeLevel } from "./classes-constants";
import type { SubjectListItem } from "./classes-types";

type EditSubjectDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	subject: SubjectListItem;
};

export function EditSubjectDialog({ open, onOpenChange, subject }: EditSubjectDialogProps) {
	const queryClient = useQueryClient();

	const form = useForm({
		defaultValues: {
			name: subject.name,
			shortName: subject.shortName,
			description: subject.description ?? "",
			category: isValidCategory(subject.category) ? subject.category : "",
			gradeLevel: subject.gradeLevel?.toString() ?? "",
		},
		onSubmit: async ({ value }) => {
			const category = value.category && isValidCategory(value.category) ? value.category : undefined;

			let gradeLevel: number | undefined;
			if (value.gradeLevel.trim()) {
				const parsed = Number(value.gradeLevel);
				if (Number.isNaN(parsed)) {
					toast.error("Grade level harus berupa angka");
					return;
				}
				gradeLevel = parsed;
			}

			if (category && category !== "utbk" && gradeLevel !== undefined) {
				const gradeLevelError = validateGradeLevel(category, gradeLevel);
				if (gradeLevelError) {
					toast.error(gradeLevelError);
					return;
				}
			}

			if (category === "utbk") {
				gradeLevel = undefined;
			}

			updateMutation.mutate({
				id: subject.id,
				name: value.name,
				shortName: value.shortName,
				description: value.description.trim() || undefined,
				category,
				gradeLevel,
			});
		},
		validators: {
			onSubmit: type({
				name: "string >= 1",
				shortName: "string >= 1",
				description: "string",
				category: subjectCategorySchema.optional(),
				gradeLevel: "string",
			}),
		},
	});

	useEffect(() => {
		if (open) {
			form.reset({
				name: subject.name,
				shortName: subject.shortName,
				description: subject.description ?? "",
				category: isValidCategory(subject.category) ? subject.category : "",
				gradeLevel: subject.gradeLevel?.toString() ?? "",
			});
		}
	}, [open, subject, form]);

	const updateMutation = useMutation(
		orpc.admin.subject.update.mutationOptions({
			onSuccess: (data) => {
				toast.success(data.message);
				queryClient.invalidateQueries();
				onOpenChange(false);
			},
			onError: (error) => {
				toast.error(error.message || "Gagal memperbarui kelas");
			},
		}),
	);

	const isUtbk = form.state.values.category === "utbk";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle className="text-base">Edit Subject</DialogTitle>
					<DialogDescription>Perbarui informasi kelas.</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
					className="space-y-3"
				>
					<form.Field name="name">
						{(field) => (
							<AdminFieldRow label="Nama Kelas *" htmlFor={field.name}>
								<div className="space-y-1">
									<Input
										id={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Contoh: Matematika Wajib"
									/>
									{field.state.meta.errors.map((error) => (
										<Typography variant="caption" tone="destructive" key={error?.message ?? String(error)}>
											{error?.message ?? String(error)}
										</Typography>
									))}
								</div>
							</AdminFieldRow>
						)}
					</form.Field>

					<form.Field name="shortName">
						{(field) => (
							<AdminFieldRow label="Singkatan *" htmlFor={field.name}>
								<div className="space-y-1">
									<Input
										id={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Contoh: MAT W"
									/>
									{field.state.meta.errors.map((error) => (
										<Typography variant="caption" tone="destructive" key={error?.message ?? String(error)}>
											{error?.message ?? String(error)}
										</Typography>
									))}
								</div>
							</AdminFieldRow>
						)}
					</form.Field>

					<form.Field name="description">
						{(field) => (
							<AdminFieldRow label="Deskripsi" htmlFor={field.name} optional>
								<Input
									id={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Deskripsi singkat kelas"
								/>
							</AdminFieldRow>
						)}
					</form.Field>

					<form.Field name="category">
						{(field) => (
							<AdminFieldRow label="Kategori" htmlFor={field.name}>
								<Select
									value={field.state.value || ""}
									onValueChange={(value) => {
										if (isValidCategory(value) || value === "") {
											field.handleChange(value);
										}
										if (value === "utbk") {
											form.setFieldValue("gradeLevel", "");
										}
									}}
								>
									<SelectTrigger id={field.name} className="w-full">
										<SelectValue placeholder="Pilih kategori" />
									</SelectTrigger>
									<SelectContent>
										{Object.entries(SUBJECT_CATEGORY_LABELS).map(([value, label]) => (
											<SelectItem key={value} value={value}>
												{label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</AdminFieldRow>
						)}
					</form.Field>

					<form.Field name="gradeLevel">
						{(field) => (
							<AdminFieldRow
								label="Grade Level"
								htmlFor={field.name}
								hint={isUtbk ? "Tidak berlaku untuk UTBK" : undefined}
							>
								<Input
									id={field.name}
									type="number"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder={isUtbk ? "Tidak perlu diisi untuk UTBK" : "Contoh: 10, 11, 12"}
									disabled={isUtbk}
								/>
							</AdminFieldRow>
						)}
					</form.Field>

					<DialogFooter>
						<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
							{([canSubmit, isSubmitting]) => (
								<Button
									size="xs"
									isPending={isSubmitting || updateMutation.isPending}
									type="submit"
									disabled={!canSubmit || isSubmitting || updateMutation.isPending}
								>
									{"Simpan"}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
