import { CalendarIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { type } from "arktype";
import { useState } from "react";
import { toast } from "sonner";
import { AdminFieldRow } from "@/components/admin/admin-page";
import { TryoutStatus } from "@/components/admin/tryout-status";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
	type TryoutStatus as TryoutStatusValue,
	tryoutStatusSchema,
} from "@/lib/schemas";

export function AddTryoutDialog({
	open,
	onOpenChange,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}) {
	type TryoutFormValues = {
		title: string;
		description: string;
		category: SubjectCategory;
		duration: number;
		status: TryoutStatusValue;
		startsAt: string;
		endsAt: string;
	};

	const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
		from: undefined,
		to: undefined,
	});

	const defaultValues: TryoutFormValues = {
		title: "",
		description: "",
		category: "utbk",
		duration: 60,
		status: "draft",
		startsAt: "",
		endsAt: "",
	};

	const form = useForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			createMutation.mutate({
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
				category: subjectCategorySchema,
				duration: "1 <= number <= 500",
				status: tryoutStatusSchema,
			}),
		},
	});

	const createMutation = useMutation(
		orpc.admin.tryout.create.mutationOptions({
			onSuccess: () => {
				toast.success("Tryout berhasil dibuat");
				form.reset();
				setDateRange({ from: undefined, to: undefined });
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
					Tambah tryout
				</Button>
			</DialogTrigger>
			<DialogContent size="lg" className="flex max-h-[85vh] flex-col">
				<DialogHeader className="shrink-0">
					<DialogTitle className="text-base">Tambah tryout</DialogTitle>
					<DialogDescription>Tambahkan tryout baru ke dalam sistem. Isi form di bawah ini.</DialogDescription>
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
							<form.Field name="title">
								{(field) => (
									<AdminFieldRow label="Judul" htmlFor={field.name}>
										<div className="space-y-1">
											<Input
												id={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												placeholder="Judul Tryoutmu..."
												onChange={(e) => field.handleChange(e.target.value)}
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
									<AdminFieldRow label="Deskripsi" htmlFor={field.name}>
										<Textarea
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Deskripsi tryout..."
											rows={3}
										/>
									</AdminFieldRow>
								)}
							</form.Field>

							<form.Field name="category">
								{(field) => (
									<AdminFieldRow label="Kategori" htmlFor={field.name}>
										<Select
											value={field.state.value}
											onValueChange={(val) => field.handleChange(subjectCategorySchema.assert(val))}
										>
											<SelectTrigger id={field.name} className="w-full">
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
									</AdminFieldRow>
								)}
							</form.Field>

							<form.Field name="status">
								{(field) => (
									<AdminFieldRow label="Status" htmlFor={field.name}>
										<Select
											value={field.state.value}
											onValueChange={(val) => field.handleChange(tryoutStatusSchema.assert(val))}
										>
											<SelectTrigger id={field.name} className="w-full">
												<SelectValue placeholder="Pilih status">
													<TryoutStatus status={field.state.value} />
												</SelectValue>
											</SelectTrigger>
											<SelectContent>
												{Object.keys(TRYOUT_STATUS_BADGE).map((value) => (
													<SelectItem key={value} value={value}>
														<TryoutStatus status={tryoutStatusSchema.assert(value)} />
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</AdminFieldRow>
								)}
							</form.Field>

							<AdminFieldRow label="Periode Tryout">
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="input"
											data-empty={!dateRange.from}
											className="data-[empty=true]:text-muted-foreground"
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
					</div>

					<DialogFooter className="shrink-0">
						<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
							{([canSubmit, isSubmitting]) => (
								<Button size="xs" isPending={isSubmitting} type="submit" disabled={!canSubmit || isSubmitting}>
									{"Tambah tryout"}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
