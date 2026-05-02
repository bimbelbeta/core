import { CalendarIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type } from "arktype";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatDateMedium } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { orpc } from "@/lib/orpc";

function AccessCodeSection({ tryoutId }: { tryoutId: number }) {
	const queryClient = useQueryClient();
	const [label, setLabel] = useState("");
	const [code, setCode] = useState("");
	const [maxUses, setMaxUses] = useState("");
	const [expiresAt, setExpiresAt] = useState("");

	const accessCodesQuery = useQuery(
		orpc.admin.tryout.listAccessCodes.queryOptions({
			input: { id: tryoutId },
		}),
	);

	const createAccessCodeMutation = useMutation(
		orpc.admin.tryout.createAccessCode.mutationOptions({
			onSuccess: (data) => {
				toast.success(`Kode akses berhasil dibuat: ${data.code}`);
				setLabel("");
				setCode("");
				setMaxUses("");
				setExpiresAt("");
				queryClient.invalidateQueries({
					queryKey: orpc.admin.tryout.listAccessCodes.queryKey({ input: { id: tryoutId } }),
				});
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const toggleAccessCodeMutation = useMutation(
		orpc.admin.tryout.updateAccessCodeStatus.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.admin.tryout.listAccessCodes.queryKey({ input: { id: tryoutId } }),
				});
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const handleCreate = () => {
		const parsedMaxUses = maxUses.trim() ? Number(maxUses) : undefined;

		if (parsedMaxUses !== undefined && (Number.isNaN(parsedMaxUses) || parsedMaxUses <= 0)) {
			toast.error("Maksimal penggunaan harus berupa angka lebih dari 0");
			return;
		}

		createAccessCodeMutation.mutate({
			id: tryoutId,
			label: label.trim() || undefined,
			code: code.trim() || undefined,
			maxUses: parsedMaxUses,
			expiresAt: expiresAt || undefined,
		});
	};

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-base">Access Code</CardTitle>
				<CardDescription>Kelola kode akses per tryout untuk membuka akses tanpa bukti pembayaran</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="access-code-label">Label</Label>
						<Input
							id="access-code-label"
							value={label}
							onChange={(e) => setLabel(e.target.value)}
							placeholder="Contoh: Gelombang 1"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="access-code-value">Kode</Label>
						<Input
							id="access-code-value"
							value={code}
							onChange={(e) => setCode(e.target.value.toUpperCase())}
							placeholder="Kosongkan untuk generate otomatis"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="access-code-max-uses">Maksimal Penggunaan</Label>
						<Input
							id="access-code-max-uses"
							type="number"
							min={1}
							value={maxUses}
							onChange={(e) => setMaxUses(e.target.value)}
							placeholder="Tanpa batas"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="access-code-expires-at">Kadaluarsa</Label>
						<Input
							id="access-code-expires-at"
							type="datetime-local"
							value={expiresAt}
							onChange={(e) => setExpiresAt(e.target.value)}
						/>
					</div>
				</div>

				<div className="flex justify-end">
					<Button onClick={handleCreate} disabled={createAccessCodeMutation.isPending}>
						{createAccessCodeMutation.isPending ? "Membuat..." : "Buat Kode Akses"}
					</Button>
				</div>

				<Separator />

				<div className="space-y-3">
					<p className="font-medium text-sm">Daftar Kode</p>
					{accessCodesQuery.isPending ? (
						<p className="text-muted-foreground text-sm">Memuat kode akses...</p>
					) : accessCodesQuery.data && accessCodesQuery.data.length > 0 ? (
						<div className="space-y-2">
							{accessCodesQuery.data.map((accessCodeItem) => (
								<div
									key={accessCodeItem.id}
									className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
								>
									<div className="space-y-1">
										<div className="flex items-center gap-2">
											<p className="font-medium text-sm">{accessCodeItem.label || "Tanpa Label"}</p>
											<Badge variant={accessCodeItem.isActive ? "default" : "outline"}>
												{accessCodeItem.isActive ? "Aktif" : "Nonaktif"}
											</Badge>
										</div>
										<p className="text-muted-foreground text-xs">{accessCodeItem.codePreview}</p>
										<p className="text-muted-foreground text-xs">
											Digunakan {accessCodeItem.usedCount}
											{accessCodeItem.maxUses ? ` / ${accessCodeItem.maxUses}` : " kali"}
										</p>
										{accessCodeItem.expiresAt ? (
											<p className="text-muted-foreground text-xs">
												Kadaluarsa {new Date(accessCodeItem.expiresAt).toLocaleString("id-ID")}
											</p>
										) : null}
									</div>
									<div className="flex items-center gap-2">
										<span className="text-muted-foreground text-xs">
											{accessCodeItem.isActive ? "Aktif" : "Nonaktif"}
										</span>
										<Switch
											checked={accessCodeItem.isActive}
											onCheckedChange={(checked) => {
												toggleAccessCodeMutation.mutate({
													id: tryoutId,
													accessCodeId: accessCodeItem.id,
													isActive: checked,
												});
											}}
											disabled={toggleAccessCodeMutation.isPending}
										/>
									</div>
								</div>
							))}
						</div>
					) : (
						<p className="text-muted-foreground text-sm">Belum ada kode akses untuk tryout ini.</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

export interface TryoutSettingsFormState {
	isDirty: boolean;
	canSubmit: boolean;
	isSubmitting: boolean;
}

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
	onFormStateChange?: (state: TryoutSettingsFormState) => void;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
	draft: { label: "Draft", className: "bg-gray-100 text-gray-700 border-gray-200" },
	published: { label: "Published", className: "bg-green-100 text-green-700 border-green-200" },
	archived: { label: "Archived", className: "bg-red-100 text-red-700 border-red-200" },
};

function FormStateNotifier({
	state,
	onFormStateChange,
}: {
	state: { isDirty: boolean; canSubmit: boolean; isSubmitting: boolean };
	onFormStateChange?: (state: TryoutSettingsFormState) => void;
}) {
	const prevStateRef = useRef(state);

	useEffect(() => {
		const prev = prevStateRef.current;
		if (
			prev.isDirty !== state.isDirty ||
			prev.canSubmit !== state.canSubmit ||
			prev.isSubmitting !== state.isSubmitting
		) {
			prevStateRef.current = state;
			onFormStateChange?.(state);
		}
	}, [state, onFormStateChange]);

	return null;
}

export function TryoutSettingsTab({ tryout, onUpdate, onFormStateChange }: TryoutSettingsTabProps) {
	const formValues = useMemo(
		() => ({
			title: tryout.title,
			description: tryout.description ?? "",
			category: tryout.category,
			status: tryout.status,
		}),
		[tryout.category, tryout.description, tryout.status, tryout.title],
	);

	const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
		from: tryout.startsAt ? new Date(tryout.startsAt) : undefined,
		to: tryout.endsAt ? new Date(tryout.endsAt) : undefined,
	});

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
				startsAt: dateRange.from ? dateRange.from.toISOString() : undefined,
				endsAt: dateRange.to ? dateRange.to.toISOString() : undefined,
			});
		},
		validators: {
			onChange: type({
				title: "string >= 1",
				"description?": "string",
				category: "'sd' | 'smp' | 'sma' | 'utbk'",
				status: "'draft' | 'published' | 'archived'",
			}),
		},
	});

	const prevFormValuesRef = useRef(formValues);

	useEffect(() => {
		const prev = prevFormValuesRef.current;
		const hasChanged =
			prev.title !== formValues.title ||
			prev.description !== formValues.description ||
			prev.category !== formValues.category ||
			prev.status !== formValues.status;

		if (hasChanged) {
			prevFormValuesRef.current = formValues;
			form.reset(formValues);
		}
	}, [form, formValues]);

	return (
		<>
			<form
				id="tryout-settings-form"
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<form.Subscribe
					selector={(state) => ({
						isDirty: state.isDirty,
						canSubmit: state.canSubmit,
						isSubmitting: state.isSubmitting,
					})}
				>
					{(state) => <FormStateNotifier state={state} onFormStateChange={onFormStateChange} />}
				</form.Subscribe>
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-base">Pengaturan Tryout</CardTitle>
						<CardDescription>Kelola informasi dasar, klasifikasi, dan jadwal tryout</CardDescription>
					</CardHeader>
					<CardContent className="space-y-8">
						{/* Title */}
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
										<p key={error?.message} className="text-destructive text-xs">
											{error?.message}
										</p>
									))}
								</div>
							)}
						</form.Field>

						{/* Description */}
						<form.Field name="description">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>
										Deskripsi <span className="font-normal text-muted-foreground">(Opsional)</span>
									</Label>
									<Textarea
										id={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Deskripsikan tryout ini"
										rows={4}
									/>
									{field.state.meta.errors.map((error) => (
										<p key={error?.message} className="text-destructive text-xs">
											{error?.message}
										</p>
									))}
								</div>
							)}
						</form.Field>

						<div className="border-border border-t" />

						{/* Category */}
						<form.Field name="category">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Kategori</Label>
									<Select
										value={field.state.value}
										onValueChange={(val) => field.handleChange(val as typeof field.state.value)}
									>
										<SelectTrigger id={field.name} className="w-full max-w-xs">
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
									{field.state.meta.errors.map((error) => (
										<p key={error?.message} className="text-destructive text-xs">
											{error?.message}
										</p>
									))}
								</div>
							)}
						</form.Field>

						{/* Status */}
						<form.Field name="status">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Status</Label>
									<Select
										value={field.state.value}
										onValueChange={(val) => field.handleChange(val as typeof field.state.value)}
									>
										<SelectTrigger id={field.name} className="w-full max-w-xs gap-2">
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
									{field.state.meta.errors.map((error) => (
										<p key={error?.message} className="text-destructive text-xs">
											{error?.message}
										</p>
									))}
								</div>
							)}
						</form.Field>

						<div className="border-border border-t" />

						<div className="space-y-2">
							<Label>
								Periode Tryout <span className="font-normal text-muted-foreground">(Opsional)</span>
							</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="input"
										data-empty={!dateRange.from}
										className="w-full max-w-sm data-[empty=true]:text-muted-foreground"
									>
										<CalendarIcon className="mr-2 size-4" />
										{dateRange.from ? (
											dateRange.to ? (
												<>
													{formatDateMedium(dateRange.from)} - {formatDateMedium(dateRange.to)}
												</>
											) : (
												formatDateMedium(dateRange.from)
											)
										) : (
											<span>Pilih rentang tanggal</span>
										)}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar
										mode="range"
										selected={{
											from: dateRange.from,
											to: dateRange.to,
										}}
										onSelect={(range) => {
											setDateRange({
												from: range?.from,
												to: range?.to,
											});
										}}
										numberOfMonths={2}
									/>
								</PopoverContent>
							</Popover>
							<p className="text-muted-foreground text-xs">
								Kosongkan untuk membuat tryout tersedia segera/tanpa batas waktu
							</p>
						</div>
					</CardContent>
				</Card>
			</form>
			<AccessCodeSection tryoutId={tryout.id} />
		</>
	);
}
