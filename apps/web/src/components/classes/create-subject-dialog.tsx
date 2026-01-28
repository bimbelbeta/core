import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type } from "arktype";
import { useEffect } from "react";
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
import { orpc } from "@/utils/orpc";
import type { SubjectListItem } from "./classes-types";

type SubjectCategory = SubjectListItem["category"];

type CreateSubjectDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	defaultCategory?: SubjectCategory | "all";
};

// type FormValues = {
// 	name: string;
// 	shortName: string;
// 	description: string;
// 	category: SubjectCategory | "";
// 	gradeLevel: string;
// };

const categoryLabel: Record<SubjectCategory, string> = {
	sd: "SD",
	smp: "SMP",
	sma: "SMA",
	utbk: "UTBK",
};

const gradeRanges: Record<Exclude<SubjectCategory, "utbk">, [number, number]> = {
	sd: [1, 6],
	smp: [7, 9],
	sma: [10, 12],
};

export function CreateSubjectDialog({ open, onOpenChange, defaultCategory }: CreateSubjectDialogProps) {
	const queryClient = useQueryClient();

	const form = useForm({
		defaultValues: {
			name: "",
			shortName: "",
			description: "",
			category: (defaultCategory && defaultCategory !== "all" ? defaultCategory : "") as SubjectCategory | "",
			gradeLevel: "",
		},
		onSubmit: async ({ value }) => {
			const category = (value.category || undefined) as SubjectCategory | undefined;

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
				const [min, max] = gradeRanges[category];
				if (gradeLevel < min || gradeLevel > max) {
					toast.error(`Grade level harus antara ${min} dan ${max} untuk kategori ${category.toUpperCase()}`);
					return;
				}
			}

			if (category === "utbk") {
				gradeLevel = undefined;
			}

			createMutation.mutate({
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
				category: type("'sd' | 'smp' | 'sma' | 'utbk'").optional(),
				gradeLevel: "string",
			}),
		},
	});

	useEffect(() => {
		if (open) {
			form.reset({
				name: "",
				shortName: "",
				description: "",
				category: (defaultCategory && defaultCategory !== "all" ? defaultCategory : "") as SubjectCategory | "",
				gradeLevel: "",
			});
		}
	}, [open, defaultCategory, form]);

	const createMutation = useMutation(
		orpc.admin.subject.createSubject.mutationOptions({
			onSuccess: (data) => {
				toast.success(data.message);
				queryClient.invalidateQueries();
				onOpenChange(false);
			},
			onError: (error) => {
				toast.error(error.message || "Gagal membuat kelas");
			},
		}),
	);

	const isUtbk = form.state.values.category === "utbk" || (!form.state.values.category && defaultCategory === "utbk");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Tambah Subject</DialogTitle>
					<DialogDescription>Buat kelas baru untuk ditampilkan di daftar subject.</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
					className="space-y-4"
				>
					<form.Field name="name">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Nama Kelas *</Label>
								<Input
									id={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Contoh: Matematika Wajib"
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message ?? String(error)} className="text-destructive text-xs">
										{error?.message ?? String(error)}
									</p>
								))}
							</div>
						)}
					</form.Field>

					<form.Field name="shortName">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Singkatan *</Label>
								<Input
									id={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Contoh: MAT W"
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message ?? String(error)} className="text-destructive text-xs">
										{error?.message ?? String(error)}
									</p>
								))}
							</div>
						)}
					</form.Field>

					<form.Field name="description">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Deskripsi</Label>
								<Input
									id={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Deskripsi singkat kelas (opsional)"
								/>
							</div>
						)}
					</form.Field>

					<div className="grid gap-4 sm:grid-cols-[30%_70%]">
						<form.Field name="category">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Kategori</Label>
									<Select
										value={field.state.value || ""}
										onValueChange={(value) => {
											field.handleChange(value as SubjectCategory | "");
											if (value === "utbk") {
												form.setFieldValue("gradeLevel", "");
											}
										}}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Pilih kategori" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="sd">{categoryLabel.sd}</SelectItem>
											<SelectItem value="smp">{categoryLabel.smp}</SelectItem>
											<SelectItem value="sma">{categoryLabel.sma}</SelectItem>
											<SelectItem value="utbk">{categoryLabel.utbk}</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}
						</form.Field>

						<form.Field name="gradeLevel">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>
										Grade Level{" "}
										{isUtbk && <span className="text-muted-foreground text-xs">(tidak berlaku untuk UTBK)</span>}
									</Label>
									<Input
										id={field.name}
										type="number"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder={isUtbk ? "Tidak perlu diisi untuk UTBK" : "Contoh: 10, 11, 12"}
										disabled={isUtbk}
									/>
								</div>
							)}
						</form.Field>
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
							Batal
						</Button>
						<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
							{([canSubmit, isSubmitting]) => (
								<Button type="submit" disabled={!canSubmit || isSubmitting || createMutation.isPending}>
									{isSubmitting || createMutation.isPending ? "Menyimpan..." : "Simpan"}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
