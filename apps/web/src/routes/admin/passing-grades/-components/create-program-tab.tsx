import { generateSlug } from "@bimbelbeta/contract/utils";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { type } from "arktype";
import { toast } from "sonner";
import { AdminFieldRow } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { orpc } from "@/lib/orpc";

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
			className="space-y-3"
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
					<AdminFieldRow label="Nama Program Studi *" htmlFor={field.name}>
						<div className="space-y-1">
							<Input
								id={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="Contoh: Teknik Informatika"
							/>
							{field.state.meta.errors.map((error) => (
								<Typography key={error?.message} variant="caption" tone="destructive">
									{error?.message}
								</Typography>
							))}
						</div>
					</AdminFieldRow>
				)}
			</form.Field>

			<div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-start md:gap-8">
				<div className="flex min-w-0 items-center gap-2">
					<Label htmlFor="slug">Slug</Label>
					<form.Field name="autoGenerateSlug">
						{(field) => (
							<label
								className="text-muted-foreground flex cursor-pointer items-center gap-1.5 text-xs"
								htmlFor="autoSlug"
							>
								<Checkbox
									id="autoSlug"
									checked={field.state.value}
									onCheckedChange={(checked: boolean) => {
										field.handleChange(checked === true);
									}}
								/>
								Auto
							</label>
						)}
					</form.Field>
				</div>
				<div className="min-w-0">
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
									className="tabular-nums"
								/>
								{field.state.meta.errors.map((error) => (
									<Typography key={error?.message} variant="caption" tone="destructive">
										{error?.message}
									</Typography>
								))}
							</>
						)}
					</form.Field>
				</div>
			</div>

			<form.Field name="category">
				{(field) => (
					<AdminFieldRow label="Kategori *" htmlFor={field.name}>
						<Select value={field.state.value} onValueChange={(val) => field.handleChange(val as "SAINTEK" | "SOSHUM")}>
							<SelectTrigger id={field.name} className="w-full">
								<SelectValue placeholder="Pilih kategori" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="SAINTEK">SAINTEK</SelectItem>
								<SelectItem value="SOSHUM">SOSHUM</SelectItem>
							</SelectContent>
						</Select>
					</AdminFieldRow>
				)}
			</form.Field>

			<form.Field name="description">
				{(field) => (
					<AdminFieldRow label="Deskripsi" htmlFor={field.name} optional>
						<Textarea
							id={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="Deskripsi singkat program studi..."
							rows={2}
						/>
					</AdminFieldRow>
				)}
			</form.Field>

			<DialogFooter className="pt-1">
				<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
					{([canSubmit, isSubmitting]) => (
						<Button size="xs" isPending={isSubmitting} type="submit" disabled={!canSubmit || isSubmitting}>
							{"Buat Program Studi"}
						</Button>
					)}
				</form.Subscribe>
			</DialogFooter>
		</form>
	);
}
