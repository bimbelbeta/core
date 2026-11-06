import { CalendarIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { type } from "arktype";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { formatDateMedium } from "@/lib/format-date";
import { orpc } from "@/lib/orpc";
import {
	SUBJECT_CATEGORY_LABELS,
	type SubjectCategory,
	subjectCategorySchema,
	TRYOUT_STATUS_BADGE,
	type TryoutStatus,
	tryoutStatusSchema,
} from "@/lib/schemas";
import { FormStateNotifier, type TryoutSettingsFormState } from "./form-state";

interface TryoutSettingsTabProps {
	tryout: {
		id: number;
		title: string;
		description: string | null;
		category: SubjectCategory;
		status: TryoutStatus;
		startsAt: Date | null;
		endsAt: Date | null;
	};
	onUpdate: () => void;
	onFormStateChange?: (state: TryoutSettingsFormState) => void;
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
		orpc.admin.tryout.update.mutationOptions({
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
				category: subjectCategorySchema,
				status: tryoutStatusSchema,
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
									<Typography variant="caption" tone="destructive" key={error?.message}>
										{error?.message}
									</Typography>
								))}
							</div>
						)}
					</form.Field>

					<form.Field name="description">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>
									Deskripsi <span className="text-muted-foreground font-normal">(Opsional)</span>
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
									<Typography variant="caption" tone="destructive" key={error?.message}>
										{error?.message}
									</Typography>
								))}
							</div>
						)}
					</form.Field>

					<div className="border-border border-t" />

					<form.Field name="category">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Kategori</Label>
								<Select
									value={field.state.value}
									onValueChange={(val) => field.handleChange(subjectCategorySchema.assert(val))}
								>
									<SelectTrigger id={field.name} className="w-full max-w-xs">
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
								<Typography variant="caption" tone="muted">
									Menentukan target jenjang pendidikan
								</Typography>
								{field.state.meta.errors.map((error) => (
									<Typography variant="caption" tone="destructive" key={error?.message}>
										{error?.message}
									</Typography>
								))}
							</div>
						)}
					</form.Field>

					<form.Field name="status">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Status</Label>
								<Select
									value={field.state.value}
									onValueChange={(val) => field.handleChange(tryoutStatusSchema.assert(val))}
								>
									<SelectTrigger id={field.name} className="w-full max-w-xs gap-2">
										<SelectValue placeholder="Pilih status" />
									</SelectTrigger>
									<SelectContent>
										{Object.entries(TRYOUT_STATUS_BADGE).map(([value, status]) => (
											<SelectItem key={value} value={value}>
												<div className="flex items-center gap-2">
													<div className={`size-2 rounded-full ${status.dotClassName}`} />
													{status.label}
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<div className="flex items-center gap-2">
									<Badge variant={TRYOUT_STATUS_BADGE[field.state.value].variant}>
										{TRYOUT_STATUS_BADGE[field.state.value].label}
									</Badge>
									<span className="text-muted-foreground text-xs">
										{field.state.value === "published"
											? "Tryout terlihat oleh pengguna"
											: field.state.value === "archived"
												? "Tryout disembunyikan sementara"
												: "Tryout masih dalam pengembangan"}
									</span>
								</div>
								{field.state.meta.errors.map((error) => (
									<Typography variant="caption" tone="destructive" key={error?.message}>
										{error?.message}
									</Typography>
								))}
							</div>
						)}
					</form.Field>

					<div className="border-border border-t" />

					<div className="space-y-2">
						<Label>
							Periode Tryout <span className="text-muted-foreground font-normal">(Opsional)</span>
						</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="input"
									data-empty={!dateRange.from}
									className="data-[empty=true]:text-muted-foreground w-full max-w-sm"
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
						<Typography variant="caption" tone="muted">
							Kosongkan untuk membuat tryout tersedia segera/tanpa batas waktu
						</Typography>
					</div>
				</CardContent>
				<CardFooter className="border-border gap-2 border-t">
					<Button type="submit" size="sm" className="h-9" disabled={!form.state.isDirty || form.state.isSubmitting}>
						Simpan perubahan
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="h-9"
						disabled={!form.state.isDirty}
						onClick={() => form.reset()}
					>
						Batalkan perubahan
					</Button>
				</CardFooter>
			</Card>
		</form>
	);
}
