import { ClockIcon, FileTextIcon, FolderIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { type } from "arktype";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
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

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
	draft: { label: "Draft", className: "bg-gray-100 text-gray-700 border-gray-200" },
	published: { label: "Published", className: "bg-green-100 text-green-700 border-green-200" },
	archived: { label: "Archived", className: "bg-red-100 text-red-700 border-red-200" },
};

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
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
			className="space-y-6"
		>
			{/* Basic Information */}
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2">
						<FileTextIcon className="size-4 text-muted-foreground" />
						<CardTitle className="text-base">Informasi Dasar</CardTitle>
					</div>
					<CardDescription>Judul dan deskripsi tryout</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<form.Field name="title">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Judul</Label>
								<Input
									id={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Masukkan judul tryout"
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
									placeholder="Deskripsikan tryout ini (opsional)"
									rows={4}
								/>
							</div>
						)}
					</form.Field>
				</CardContent>
			</Card>

			{/* Classification & Status */}
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2">
						<FolderIcon className="size-4 text-muted-foreground" />
						<CardTitle className="text-base">Klasifikasi & Status</CardTitle>
					</div>
					<CardDescription>Kategori dan status publikasi</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-6 md:grid-cols-2">
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
									<p className="text-muted-foreground text-xs">Menentukan target jenjang pendidikan</p>
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
										<SelectTrigger id={field.name} className="gap-2">
											<SelectValue placeholder="Pilih status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="draft">
												<div className="flex items-center gap-2">
													<div className="size-2 rounded-full bg-gray-400" />
													Draft
												</div>
											</SelectItem>
											<SelectItem value="published">
												<div className="flex items-center gap-2">
													<div className="size-2 rounded-full bg-green-500" />
													Published
												</div>
											</SelectItem>
											<SelectItem value="archived">
												<div className="flex items-center gap-2">
													<div className="size-2 rounded-full bg-red-500" />
													Archived
												</div>
											</SelectItem>
										</SelectContent>
									</Select>
									<div className="flex items-center gap-2">
										<div
											className={cn(
												"rounded border px-2 py-1 font-medium text-xs",
												STATUS_CONFIG[field.state.value].className,
											)}
										>
											{STATUS_CONFIG[field.state.value].label}
										</div>
										<span className="text-muted-foreground text-xs">
											{field.state.value === "published"
												? "Tryout terlihat oleh pengguna"
												: field.state.value === "archived"
													? "Tryout disembunyikan sementara"
													: "Tryout masih dalam pengembangan"}
										</span>
									</div>
								</div>
							)}
						</form.Field>
					</div>
				</CardContent>
			</Card>

			{/* Scheduling */}
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2">
						<ClockIcon className="size-4 text-muted-foreground" />
						<CardTitle className="text-base">Jadwal</CardTitle>
					</div>
					<CardDescription>Atur kapan tryout tersedia untuk dikerjakan</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-6 md:grid-cols-2">
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
									<p className="text-muted-foreground text-xs">Kosongkan untuk membuat tryout tersedia segera</p>
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
									<p className="text-muted-foreground text-xs">
										Kosongkan untuk membuat tryout tersedia tanpa batas waktu
									</p>
								</div>
							)}
						</form.Field>
					</div>
				</CardContent>
			</Card>
		</form>
	);
}
