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
		<form
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			className="space-y-4"
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
					<div className="space-y-1.5">
						<Label htmlFor={field.name} className="font-medium text-sm">
							Nama Program Studi <span className="text-destructive">*</span>
						</Label>
						<Input
							id={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="Contoh: Teknik Informatika"
						/>
						{field.state.meta.errors.map((error) => (
							<p key={error?.message} className="text-destructive text-xs">
								{error?.message}
							</p>
						))}
					</div>
				)}
			</form.Field>

			<div className="space-y-1.5">
				<div className="flex items-center justify-between">
					<Label className="font-medium text-sm">Slug</Label>
					<form.Field name="autoGenerateSlug">
						{(field) => (
							<label className="flex cursor-pointer items-center gap-1.5" htmlFor="autoSlug">
								<Checkbox
									id="autoSlug"
									checked={field.state.value}
									onCheckedChange={(checked: boolean) => {
										field.handleChange(checked === true);
									}}
								/>
								<span className="text-muted-foreground text-xs">Auto</span>
							</label>
						)}
					</form.Field>
				</div>
				<form.Field name="slug">
					{(field) => (
						<>
							<Input
								id={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								disabled={form.getFieldValue("autoGenerateSlug")}
								placeholder="teknik-informatika"
								className="font-mono text-sm"
							/>
							{field.state.meta.errors.map((error) => (
								<p key={error?.message} className="text-destructive text-xs">
									{error?.message}
								</p>
							))}
						</>
					)}
				</form.Field>
			</div>

			<form.Field name="category">
				{(field) => (
					<div className="space-y-1.5">
						<Label htmlFor={field.name} className="font-medium text-sm">
							Kategori <span className="text-destructive">*</span>
						</Label>
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
							<p key={error?.message} className="text-destructive text-xs">
								{error?.message}
							</p>
						))}
					</div>
				)}
			</form.Field>

			<form.Field name="description">
				{(field) => (
					<div className="space-y-1.5">
						<Label htmlFor={field.name} className="font-medium text-sm">
							Deskripsi
						</Label>
						<Textarea
							id={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="Deskripsi singkat program studi... (opsional)"
							rows={2}
						/>
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
	);
}
