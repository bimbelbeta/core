import { generateSlug } from "@bimbelbeta/contract/utils";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { type } from "arktype";
import { toast } from "sonner";
import { AdminFieldRow } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { orpc } from "@/lib/orpc";

export function AddUniversityDialog({
	open,
	onOpenChange,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}) {
	const form = useForm({
		defaultValues: {
			name: "",
			autoGenerateSlug: true,
			slug: "",
			logo: "",
			description: "",
			location: "",
			website: "",
			rank: null as number | null,
		},
		onSubmit: async ({ value }) => {
			createMutation.mutate({
				name: value.name,
				slug: value.slug,
				logo: value.logo || undefined,
				description: value.description || undefined,
				location: value.location || undefined,
				website: value.website || undefined,
				rank: value.rank ?? undefined,
			});
		},
		validators: {
			onChange: type({
				name: "string >= 1",
				slug: "string >= 1",
				logo: "string.url?",
				website: "string.url?",
				rank: "number?",
			}),
		},
	});

	const createMutation = useMutation(
		orpc.admin.university.universities.create.mutationOptions({
			onSuccess: () => {
				toast.success("Universitas berhasil ditambahkan");
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
			<DialogTrigger asChild>
				<Button size="xs" className="ml-auto">
					Tambah universitas
				</Button>
			</DialogTrigger>
			<DialogContent size="sm" className="flex max-h-[85vh] flex-col sm:max-w-2xl">
				<DialogHeader className="shrink-0">
					<DialogTitle className="text-base">Tambah universitas</DialogTitle>
					<DialogDescription>Tambahkan universitas baru ke dalam sistem. Isi form di bawah ini.</DialogDescription>
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
									<AdminFieldRow label="Nama" htmlFor={field.name}>
										<div className="space-y-1">
											<Input
												size="sm"
												id={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
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

							<form.Field name="autoGenerateSlug">
								{(field) => (
									<AdminFieldRow label="Autogenerate Slug" htmlFor={field.name}>
										<div className="flex h-8 items-center">
											<Checkbox
												id={field.name}
												checked={field.state.value}
												onCheckedChange={(checked: boolean) => {
													field.handleChange(checked === true);
												}}
											/>
										</div>
									</AdminFieldRow>
								)}
							</form.Field>

							<form.Field name="slug">
								{(field) => (
									<AdminFieldRow label="Slug" htmlFor={field.name}>
										<div className="space-y-1">
											<Input
												size="sm"
												id={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												disabled={form.getFieldValue("autoGenerateSlug")}
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

							<form.Field name="logo">
								{(field) => (
									<AdminFieldRow label="Logo URL" htmlFor={field.name}>
										<div className="space-y-1">
											<Input
												size="sm"
												id={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder="https://example.com/logo.png"
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

							<form.Field name="description">
								{(field) => (
									<AdminFieldRow label="Deskripsi" htmlFor={field.name}>
										<Textarea
											size="sm"
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Deskripsi universitas..."
											rows={3}
										/>
									</AdminFieldRow>
								)}
							</form.Field>

							<form.Field name="location">
								{(field) => (
									<AdminFieldRow label="Lokasi" htmlFor={field.name}>
										<Input
											size="sm"
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Jakarta, Indonesia"
										/>
									</AdminFieldRow>
								)}
							</form.Field>

							<form.Field name="website">
								{(field) => (
									<AdminFieldRow label="Website" htmlFor={field.name}>
										<div className="space-y-1">
											<Input
												size="sm"
												id={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder="https://www.university.ac.id"
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

							<form.Field name="rank">
								{(field) => (
									<AdminFieldRow label="Peringkat" htmlFor={field.name}>
										<div className="space-y-1">
											<Input
												size="sm"
												id={field.name}
												type="number"
												value={field.state.value ?? ""}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.valueAsNumber)}
												placeholder="1"
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
						</div>
					</div>

					<DialogFooter className="shrink-0">
						<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
							{([canSubmit, isSubmitting]) => (
								<Button size="xs" isPending={isSubmitting} type="submit" disabled={!canSubmit || isSubmitting}>
									{"Tambah universitas"}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
