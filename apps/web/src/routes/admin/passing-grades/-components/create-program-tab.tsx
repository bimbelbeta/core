import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { type } from "arktype";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { generateSlug } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

interface CreateProgramTabProps {
	onProgramCreate: (program: { id: number; name: string }) => void;
}

export function CreateProgramTab({ onProgramCreate }: CreateProgramTabProps) {
	const form = useForm({
		defaultValues: {
			name: "",
			autoGenerateSlug: true,
			slug: "",
			description: "",
			category: "SAINTEK" as "SAINTEK" | "SOSHUM",
		},
		onSubmit: async ({ value }) => {
			createMutation.mutate({
				name: value.name,
				slug: value.slug,
				description: value.description || undefined,
				category: value.category,
			});
		},
		validators: {
			onChange: type({
				name: "string >= 1",
				slug: "string >= 1",
				category: '"SAINTEK" | "SOSHUM"',
			}),
		},
	});

	const createMutation = useMutation(
		orpc.admin.university.studyPrograms.create.mutationOptions({
			onSuccess: (result) => {
				toast.success("Program studi baru berhasil dibuat");
				onProgramCreate({ id: result.id, name: form.getFieldValue("name") });
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	return (
		<div className="grid gap-4 py-4">
			<form
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
				className="grid gap-4"
			>
				<form.Field
					name="name"
					validators={{
						onChangeListenTo: ["autoGenerateSlug"],
						onChange: ({ value, fieldApi }) => {
							const autoGenerate = fieldApi.form.getFieldValue("autoGenerateSlug");
							if (autoGenerate && value) {
								const generatedSlug = generateSlug(value);
								fieldApi.form.setFieldValue("slug", generatedSlug);
							}
							return undefined;
						},
					}}
				>
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

				<form.Field name="autoGenerateSlug">
					{(field) => (
						<div className="flex items-center justify-end gap-2">
							<Label htmlFor={field.name} className="cursor-pointer text-muted-foreground text-xs">
								Autogenerate Slug
							</Label>
							<Checkbox
								id={field.name}
								checked={field.state.value}
								onCheckedChange={(checked: boolean) => {
									field.handleChange(checked === true);
								}}
							/>
						</div>
					)}
				</form.Field>

				<form.Field name="slug">
					{(field) => (
						<div className="grid grid-cols-4 items-start gap-4">
							<Label htmlFor={field.name} className="mt-2 text-right">
								Slug
							</Label>
							<div className="col-span-3 space-y-1">
								<Input
									id={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									disabled={form.getFieldValue("autoGenerateSlug")}
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
								placeholder="Deskripsi program studi..."
								className="col-span-3"
								rows={3}
							/>
						</div>
					)}
				</form.Field>

				<form.Field name="category">
					{(field) => (
						<div className="grid grid-cols-4 items-start gap-4">
							<Label htmlFor={field.name} className="mt-2 text-right">
								Kategori
							</Label>
							<div className="col-span-3 space-y-1">
								<Select
									value={field.state.value}
									onValueChange={(val) => field.handleChange(val as "SAINTEK" | "SOSHUM")}
								>
									<SelectTrigger>
										<SelectValue placeholder="Pilih kategori" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="SAINTEK">SAINTEK</SelectItem>
										<SelectItem value="SOSHUM">SOSHUM</SelectItem>
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

				<DialogFooter>
					<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
						{([canSubmit, isSubmitting]) => (
							<Button type="submit" disabled={!canSubmit || isSubmitting}>
								{isSubmitting ? (
									<>
										<Spinner />
										Membuat...
									</>
								) : (
									"Buat Program Studi"
								)}
							</Button>
						)}
					</form.Subscribe>
				</DialogFooter>
			</form>
		</div>
	);
}
