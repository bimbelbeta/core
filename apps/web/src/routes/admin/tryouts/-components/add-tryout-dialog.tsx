import { CalendarIcon, PlusIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { type } from "arktype";
import { useState } from "react";
import { toast } from "sonner";
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
import { cn } from "@/lib/utils";

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
		status: TryoutStatus;
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
				<Button className="bg-primary text-primary-foreground hover:bg-primary/90 ml-auto h-9">
					<PlusIcon className="size-4" />
					Tambah tryout
				</Button>
			</DialogTrigger>
			<DialogContent className="flex max-h-[85vh] flex-col sm:max-w-125">
				<DialogHeader className="shrink-0">
					<DialogTitle>Tambah Tryout</DialogTitle>
					<DialogDescription>Tambahkan tryout baru ke dalam sistem. Isi form di bawah ini.</DialogDescription>
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
							<form.Field name="title">
								{(field) => (
									<div className="grid grid-cols-4 items-start gap-4">
										<Label htmlFor={field.name} className="mt-2 text-right">
											Judul
										</Label>
										<div className="col-span-3 space-y-1">
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
											placeholder="Deskripsi tryout..."
											className="col-span-3"
											rows={3}
										/>
									</div>
								)}
							</form.Field>

							<form.Field name="category">
								{(field) => (
									<div className="grid grid-cols-4 items-start gap-4">
										<Label htmlFor={field.name} className="mt-2 text-right">
											Kategori
										</Label>
										<div className="col-span-3">
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
										</div>
									</div>
								)}
							</form.Field>

							<form.Field name="status">
								{(field) => (
									<div className="grid grid-cols-4 items-start gap-4">
										<Label htmlFor={field.name} className="mt-2 text-right">
											Status
										</Label>
										<div className="col-span-3">
											<Select
												value={field.state.value}
												onValueChange={(val) => field.handleChange(tryoutStatusSchema.assert(val))}
											>
												<SelectTrigger id={field.name} className="w-full">
													<SelectValue placeholder="Pilih status" />
												</SelectTrigger>
												<SelectContent>
													{Object.entries(TRYOUT_STATUS_BADGE).map(([value, status]) => (
														<SelectItem key={value} value={value}>
															<div className="flex items-center gap-2">
																<status.icon className={cn("size-4", status.iconClassName)} />
																<span>{status.label}</span>
															</div>
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</div>
								)}
							</form.Field>

							<div className="grid grid-cols-4 items-start gap-4">
								<Label className="mt-2 text-left">Periode Tryout</Label>
								<div className="col-span-3">
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
								</div>
							</div>
						</div>
					</div>

					<DialogFooter className="shrink-0">
						<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
							{([canSubmit, isSubmitting]) => (
								<Button isPending={isSubmitting} type="submit" disabled={!canSubmit || isSubmitting}>
									{"Tambah Tryout"}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
