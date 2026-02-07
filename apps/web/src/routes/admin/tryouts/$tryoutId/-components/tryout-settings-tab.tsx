import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { type } from "arktype";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { orpc } from "@/utils/orpc";

interface TryoutSettingsTabProps {
	tryout: {
		id: number;
		title: string;
		description: string | null;
		category: "sd" | "smp" | "sma" | "utbk";
		status: "draft" | "published" | "archived";
		startsAt: Date | null;
		endsAt: Date | null;
	};
	onUpdate: () => void;
}

export function TryoutSettingsTab({ tryout, onUpdate }: TryoutSettingsTabProps) {
	const formValues = useMemo(
		() => ({
			title: tryout.title,
			description: tryout.description ?? "",
			category: tryout.category,
			status: tryout.status,
			startsAt: tryout.startsAt ? new Date(tryout.startsAt).toISOString().slice(0, 16) : "",
			endsAt: tryout.endsAt ? new Date(tryout.endsAt).toISOString().slice(0, 16) : "",
		}),
		[tryout.category, tryout.description, tryout.endsAt, tryout.startsAt, tryout.status, tryout.title],
	);

	const updateMutation = useMutation(
		orpc.admin.tryout.updateTryout.mutationOptions({
			onSuccess: () => {
				toast.success("Tryout berhasil diperbarui");
				onUpdate();
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const form = useForm({
		defaultValues: formValues,
		onSubmit: async ({ value }) => {
			await updateMutation.mutateAsync({
				id: tryout.id,
				title: value.title,
				description: value.description || undefined,
				category: value.category,
				status: value.status,
				startsAt: value.startsAt || undefined,
				endsAt: value.endsAt || undefined,
			});
		},
		validators: {
			onChange: type({
				title: "string >= 1",
				"description?": "string",
				category: "'sd' | 'smp' | 'sma' | 'utbk'",
				status: "'draft' | 'published' | 'archived'",
				"startsAt?": "string",
				"endsAt?": "string",
			}),
		},
	});

	useEffect(() => {
		form.reset(formValues);
	}, [form, formValues]);

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Informasi Umum</CardTitle>
					<CardDescription>Atur informasi dasar mengenai tryout ini.</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
						className="space-y-4"
					>
						<form.Field name="title">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Judul</Label>
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
							)}
						</form.Field>

						<form.Field name="description">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Deskripsi</Label>
									<Textarea
										id={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										rows={4}
									/>
								</div>
							)}
						</form.Field>

						<div className="grid gap-4 md:grid-cols-2">
							<form.Field name="category">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Kategori</Label>
										<Select
											value={field.state.value}
											onValueChange={(val) => field.handleChange(val as typeof field.state.value)}
										>
											<SelectTrigger id={field.name}>
												<SelectValue placeholder="Pilih kategori" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="sd">SD</SelectItem>
												<SelectItem value="smp">SMP</SelectItem>
												<SelectItem value="sma">SMA</SelectItem>
												<SelectItem value="utbk">UTBK</SelectItem>
											</SelectContent>
										</Select>
									</div>
								)}
							</form.Field>

							<form.Field name="status">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Status</Label>
										<Select
											value={field.state.value}
											onValueChange={(val) => field.handleChange(val as typeof field.state.value)}
										>
											<SelectTrigger id={field.name}>
												<SelectValue placeholder="Pilih status" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="draft">Draft</SelectItem>
												<SelectItem value="published">Published</SelectItem>
												<SelectItem value="archived">Archived</SelectItem>
											</SelectContent>
										</Select>
									</div>
								)}
							</form.Field>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<form.Field name="startsAt">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Tanggal Mulai</Label>
										<Input
											id={field.name}
											type="datetime-local"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
									</div>
								)}
							</form.Field>

							<form.Field name="endsAt">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Tanggal Selesai</Label>
										<Input
											id={field.name}
											type="datetime-local"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
									</div>
								)}
							</form.Field>
						</div>

						<div className="flex justify-end pt-4">
							<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
								{([canSubmit, isSubmitting]) => (
									<Button type="submit" disabled={!canSubmit || isSubmitting}>
										{isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
									</Button>
								)}
							</form.Subscribe>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
