import { ArchiveIcon, CalendarIcon, EyeIcon, FileIcon, PlusIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { type } from "arktype";
import { format } from "date-fns";
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
import { orpc } from "@/utils/orpc";

export function AddTryoutDialog({
	open,
	onOpenChange,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}) {
	const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
		from: undefined,
		to: undefined,
	});

	const form = useForm({
		defaultValues: {
			title: "",
			description: "",
			category: "utbk" as "sd" | "smp" | "sma" | "utbk",
			duration: 60,
			status: "draft" as "draft" | "published" | "archived",
			startsAt: "",
			endsAt: "",
		},
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
				category: "'sd' | 'smp' | 'sma' | 'utbk'",
				duration: "1 <= number <= 500",
				status: "'draft' | 'published' | 'archived'",
			}),
		},
	});

	const createMutation = useMutation(
		orpc.admin.tryout.createTryout.mutationOptions({
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
				<Button className="ml-auto">
					<PlusIcon className="mr-2 size-4" />
					Tambah Tryout
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
												onValueChange={(val) => field.handleChange(val as typeof field.state.value)}
											>
												<SelectTrigger id={field.name} className="w-full">
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
												onValueChange={(val) => field.handleChange(val as typeof field.state.value)}
											>
												<SelectTrigger id={field.name} className="w-full">
													<SelectValue placeholder="Pilih status" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="draft">
														<div className="flex items-center gap-2">
															<FileIcon className="size-4 text-muted-foreground" />
															<span>Draft</span>
														</div>
													</SelectItem>
													<SelectItem value="published">
														<div className="flex items-center gap-2">
															<EyeIcon className="size-4 text-green-600" />
															<span>Published</span>
														</div>
													</SelectItem>
													<SelectItem value="archived">
														<div className="flex items-center gap-2">
															<ArchiveIcon className="size-4 text-orange-600" />
															<span>Archived</span>
														</div>
													</SelectItem>
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
															{format(dateRange.from, "PPP")} - {format(dateRange.to, "PPP")}
														</>
													) : (
														format(dateRange.from, "PPP")
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
								<Button type="submit" disabled={!canSubmit || isSubmitting}>
									{isSubmitting ? "Menambahkan..." : "Tambah Tryout"}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
