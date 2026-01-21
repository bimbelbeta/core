import { PlusIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { type } from "arktype";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { generateSlug } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

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
				<Button className="ml-auto">
					<PlusIcon className="mr-2 size-4" />
					Tambah Universitas
				</Button>
			</DialogTrigger>
			<DialogContent className="flex max-h-[85vh] flex-col sm:max-w-125">
				<DialogHeader className="shrink-0">
					<DialogTitle>Tambah Universitas</DialogTitle>
					<DialogDescription>Tambahkan universitas baru ke dalam sistem. Isi form di bawah ini.</DialogDescription>
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

							<form.Field name="logo">
								{(field) => (
									<div className="grid grid-cols-4 items-start gap-4">
										<Label htmlFor={field.name} className="mt-2 text-right">
											Logo URL
										</Label>
										<div className="col-span-3 space-y-1">
											<Input
												id={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder="https://example.com/logo.png"
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
											placeholder="Deskripsi universitas..."
											className="col-span-3"
											rows={3}
										/>
									</div>
								)}
							</form.Field>

							<form.Field name="location">
								{(field) => (
									<div className="grid grid-cols-4 items-center gap-4">
										<Label htmlFor={field.name} className="text-right">
											Lokasi
										</Label>
										<Input
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Jakarta, Indonesia"
											className="col-span-3"
										/>
									</div>
								)}
							</form.Field>

							<form.Field name="website">
								{(field) => (
									<div className="grid grid-cols-4 items-start gap-4">
										<Label htmlFor={field.name} className="mt-2 text-right">
											Website
										</Label>
										<div className="col-span-3 space-y-1">
											<Input
												id={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder="https://www.university.ac.id"
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

							<form.Field name="rank">
								{(field) => (
									<div className="grid grid-cols-4 items-start gap-4">
										<Label htmlFor={field.name} className="mt-2 text-right">
											Peringkat
										</Label>
										<div className="col-span-3 space-y-1">
											<Input
												id={field.name}
												type="number"
												value={field.state.value ?? ""}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.valueAsNumber)}
												placeholder="1"
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
						</div>
					</div>

					<DialogFooter className="shrink-0">
						<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
							{([canSubmit, isSubmitting]) => (
								<Button type="submit" disabled={!canSubmit || isSubmitting}>
									{isSubmitting ? (
										<>
											<Spinner />
											Menambahkan...
										</>
									) : (
										"Tambah Universitas"
									)}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
