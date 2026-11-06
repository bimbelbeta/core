import { CalendarIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { type } from "arktype";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AdminFieldRow, AdminSection } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
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
			<AdminSection title="Pengaturan tryout" description="Kelola informasi dasar, klasifikasi, dan jadwal tryout">
				<div className="space-y-5">
					<form.Field name="title">
						{(field) => (
							<AdminFieldRow label="Judul" htmlFor={field.name}>
								<div className="space-y-1.5">
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
							</AdminFieldRow>
						)}
					</form.Field>

					<form.Field name="description">
						{(field) => (
							<AdminFieldRow label="Deskripsi" htmlFor={field.name} optional>
								<div className="space-y-1.5">
									<Textarea
										id={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Deskripsikan tryout ini"
										rows={3}
									/>
									{field.state.meta.errors.map((error) => (
										<Typography variant="caption" tone="destructive" key={error?.message}>
											{error?.message}
										</Typography>
									))}
								</div>
							</AdminFieldRow>
						)}
					</form.Field>

					<form.Field name="category">
						{(field) => (
							<AdminFieldRow label="Kategori" htmlFor={field.name} hint="Menentukan target jenjang pendidikan">
								<div className="space-y-1.5">
									<Select
										value={field.state.value}
										onValueChange={(val) => field.handleChange(subjectCategorySchema.assert(val))}
									>
										<SelectTrigger id={field.name} className="w-full sm:max-w-xs">
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
									{field.state.meta.errors.map((error) => (
										<Typography variant="caption" tone="destructive" key={error?.message}>
											{error?.message}
										</Typography>
									))}
								</div>
							</AdminFieldRow>
						)}
					</form.Field>

					<form.Field name="status">
						{(field) => (
							<AdminFieldRow
								label="Status"
								htmlFor={field.name}
								hint={
									field.state.value === "published"
										? "Tryout terlihat oleh pengguna"
										: field.state.value === "archived"
											? "Tryout disembunyikan sementara"
											: "Tryout masih dalam pengembangan"
								}
							>
								<div className="space-y-1.5">
									<Select
										value={field.state.value}
										onValueChange={(val) => field.handleChange(tryoutStatusSchema.assert(val))}
									>
										<SelectTrigger id={field.name} className="w-full gap-2 sm:max-w-xs">
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
									{field.state.meta.errors.map((error) => (
										<Typography variant="caption" tone="destructive" key={error?.message}>
											{error?.message}
										</Typography>
									))}
								</div>
							</AdminFieldRow>
						)}
					</form.Field>

					<AdminFieldRow
						label="Periode tryout"
						optional
						hint="Kosongkan untuk membuat tryout tersedia segera atau tanpa batas waktu"
					>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="input"
									data-empty={!dateRange.from}
									className="data-[empty=true]:text-muted-foreground w-full sm:max-w-xs"
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
					</AdminFieldRow>
				</div>

				<div className="flex items-center justify-end gap-2">
					<Button type="submit" disabled={!form.state.isDirty || form.state.isSubmitting}>
						Simpan perubahan
					</Button>
					<Button type="button" variant="ghost" disabled={!form.state.isDirty} onClick={() => form.reset()}>
						Batalkan perubahan
					</Button>
				</div>
			</AdminSection>
		</form>
	);
}
