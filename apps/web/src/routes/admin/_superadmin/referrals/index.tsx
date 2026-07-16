import { PaginationInputSchema } from "@bimbelbeta/contract/common/pagination";
import { ArrowRightIcon, CheckCircleIcon, PlusIcon, ProhibitIcon, XCircleIcon } from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { type } from "arktype";
import { useState } from "react";
import { toast } from "sonner";
import {
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderActions,
	AdminPageHeaderContent,
	AdminPageRoot,
	AdminPageTitle,
} from "@/components/admin/admin-page";
import {
	AdminTable,
	AdminTableBody,
	AdminTableCell,
	AdminTableHead,
	AdminTableHeader,
	AdminTableRoot,
	AdminTableRow,
} from "@/components/admin/admin-table";
import {
	AdminTableBulkActions,
	AdminTablePaginationWrapper,
	AdminTableToolbar,
} from "@/components/admin/admin-table-toolbar";
import { PaginationButtons } from "@/components/admin/pagination-buttons";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePaginationNavigation } from "@/hooks/use-pagination-navigation";
import { orpc } from "@/lib/orpc";

const searchSchema = type({
	"...": PaginationInputSchema,
	"search?": "string",
});

export const Route = createFileRoute("/admin/_superadmin/referrals/")({
	staticData: { breadcrumb: "Referral Codes" },
	component: ReferralListPage,
	validateSearch: searchSchema,
});

function formatDate(date: Date | string | null | undefined) {
	if (!date) return "-";
	return new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function CreateReferralDialog({ onSuccess }: { onSuccess: () => void }) {
	const [open, setOpen] = useState(false);
	const [code, setCode] = useState("");
	const [premiumDays, setPremiumDays] = useState("");
	const [maxUsages, setMaxUsages] = useState("");
	const [validUntil, setValidUntil] = useState("");

	const createMutation = useMutation(
		orpc.admin.referral.create.mutationOptions({
			onSuccess: () => {
				toast.success("Kode referal berhasil dibuat.");
				setOpen(false);
				setCode("");
				setPremiumDays("");
				setMaxUsages("");
				setValidUntil("");
				onSuccess();
			},
			onError: (err) => toast.error(err.message),
		}),
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const days = Number.parseInt(premiumDays, 10);
		if (!premiumDays || Number.isNaN(days) || days < 1) {
			toast.error("Durasi premium harus lebih dari 0 hari.");
			return;
		}
		if (code && !/^[A-Z0-9]+$/i.test(code)) {
			toast.error("Kode hanya boleh mengandung huruf dan angka.");
			return;
		}
		createMutation.mutate({
			code: code.toUpperCase() || undefined,
			premiumDays: days,
			maxUsages: maxUsages ? Number.parseInt(maxUsages, 10) : null,
			validUntil: validUntil ? new Date(validUntil) : null,
		});
	};

	return (
		<>
			<Button onClick={() => setOpen(true)} size="sm" id="create-referral-btn">
				<PlusIcon className="mr-1 size-4" />
				Buat Kode Referal
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Buat Kode Referal</DialogTitle>
						<DialogDescription>
							Kosongkan kolom "Kode" untuk auto-generate. Hanya huruf dan angka (A-Z, 0-9).
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-1.5">
							<Label htmlFor="ref-code">Kode (opsional — auto-generate jika kosong)</Label>
							<Input
								id="ref-code"
								placeholder="Contoh: PREM30DAYS"
								value={code}
								onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="ref-premium-days">Durasi Premium (hari) *</Label>
							<Input
								id="ref-premium-days"
								type="number"
								min={1}
								placeholder="30"
								value={premiumDays}
								onChange={(e) => setPremiumDays(e.target.value)}
								required
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="ref-max-usages">Maks. Penggunaan (kosong = tak terbatas)</Label>
							<Input
								id="ref-max-usages"
								type="number"
								min={1}
								placeholder="Tak terbatas"
								value={maxUsages}
								onChange={(e) => setMaxUsages(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="ref-valid-until">Berlaku Hingga (kosong = selamanya)</Label>
							<Input
								id="ref-valid-until"
								type="datetime-local"
								value={validUntil}
								onChange={(e) => setValidUntil(e.target.value)}
							/>
						</div>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => setOpen(false)}>
								Batal
							</Button>
							<Button type="submit" disabled={createMutation.isPending} id="submit-create-referral-btn">
								{createMutation.isPending ? "Membuat..." : "Buat Kode"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}

function ReferralListPage() {
	const navigate = Route.useNavigate();
	const { after, before, limit = 10, search } = Route.useSearch();

	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

	const { data, isLoading, refetch } = useQuery(
		orpc.admin.referral.list.queryOptions({
			input: { after, before, limit, search },
		}),
	);

	const pageInfo = data?.pageInfo;

	const baseSearchParams = {
		...(search && { search }),
		limit,
	};

	const { handleNext, handlePrevious } = usePaginationNavigation(navigate, pageInfo, baseSearchParams);

	const toggleStatusMutation = useMutation(
		orpc.admin.referral.updateStatus.mutationOptions({
			onSuccess: (res) => {
				toast.success(res.message);
				refetch();
			},
			onError: (err) => toast.error(err.message),
		}),
	);

	const bulkDeactivateMutation = useMutation(
		orpc.admin.referral.bulkDeactivate.mutationOptions({
			onSuccess: (res) => {
				toast.success(res.message);
				setSelectedIds([]);
				setBulkDialogOpen(false);
				refetch();
			},
			onError: (err) => toast.error(err.message),
		}),
	);

	const toggleSelectAll = () => {
		if (selectedIds.length === (data?.items.length ?? 0)) {
			setSelectedIds([]);
		} else {
			setSelectedIds(data?.items.map((c) => c.id) ?? []);
		}
	};

	const toggleSelectOne = (id: string) => {
		setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
	};

	const allSelected = selectedIds.length === (data?.items.length ?? 0) && (data?.items.length ?? 0) > 0;
	const someSelected = selectedIds.length > 0 && selectedIds.length < (data?.items.length ?? 0);

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<AdminPageTitle>Referral Codes</AdminPageTitle>
				</AdminPageHeaderContent>
				<AdminPageHeaderActions>
					<CreateReferralDialog onSuccess={() => refetch()} />
				</AdminPageHeaderActions>
			</AdminPageHeader>

			<AdminPageContent>
				<AdminTableToolbar
					searchValue={search ?? ""}
					onSearchChange={(v) => navigate({ search: v ? { search: v, limit } : baseSearchParams })}
					searchPlaceholder="Cari kode referal..."
				/>

				{selectedIds.length > 0 && (
					<AdminTableBulkActions selectedCount={selectedIds.length}>
						<AlertDialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
							<AlertDialogTrigger asChild>
								<Button variant="destructive" size="sm">
									<ProhibitIcon className="mr-2 size-4" />
									Nonaktifkan Terpilih
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Nonaktifkan Kode Referal</AlertDialogTitle>
									<AlertDialogDescription>
										{selectedIds.length} kode akan dinonaktifkan. Pengguna tidak dapat lagi menukarkan kode ini.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Batal</AlertDialogCancel>
									<AlertDialogAction
										onClick={() => bulkDeactivateMutation.mutate({ codeIds: selectedIds })}
										className="bg-red-600 hover:bg-red-700"
									>
										Nonaktifkan
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</AdminTableBulkActions>
				)}

				<AdminTableRoot className="mt-3">
					<AdminTable>
						<AdminTableHeader>
							<AdminTableHead className="w-12 pl-4">
								<Checkbox
									checked={someSelected ? "indeterminate" : allSelected}
									onCheckedChange={toggleSelectAll}
									aria-label="Select all"
								/>
							</AdminTableHead>
							<AdminTableHead>Status</AdminTableHead>
							<AdminTableHead>Kode</AdminTableHead>
							<AdminTableHead>Penggunaan</AdminTableHead>
							<AdminTableHead>Berlaku Hingga</AdminTableHead>
							<AdminTableHead>Durasi Premium</AdminTableHead>
							<AdminTableHead className="pr-4 text-right">Aksi</AdminTableHead>
						</AdminTableHeader>
						<AdminTableBody
							isLoading={isLoading}
							isEmpty={!isLoading && data?.items.length === 0}
							emptyMessage="Belum ada kode referal."
							columns={7}
						>
							{data?.items.map((item) => {
								const isExpired = item.validUntil ? new Date(item.validUntil) < new Date() : false;
								const isFull = item.maxUsages !== null && item.usageCount >= item.maxUsages;
								return (
									<AdminTableRow key={item.id}>
										<AdminTableCell className="pl-4">
											<Checkbox
												checked={selectedIds.includes(item.id)}
												onCheckedChange={() => toggleSelectOne(item.id)}
												aria-label={`Select ${item.code}`}
											/>
										</AdminTableCell>
										<AdminTableCell>
											{item.status && !isExpired && !isFull ? (
												<Badge
													className="gap-1 border-green-200 bg-green-50 text-[11px] text-green-700"
													variant="outline"
												>
													<CheckCircleIcon className="size-3" weight="fill" />
													Aktif
												</Badge>
											) : (
												<Badge className="gap-1 border-red-200 bg-red-50 text-[11px] text-red-700" variant="outline">
													<XCircleIcon className="size-3" weight="fill" />
													{!item.status ? "Nonaktif" : isExpired ? "Kedaluwarsa" : "Kuota Habis"}
												</Badge>
											)}
										</AdminTableCell>
										<AdminTableCell>
											<code className="rounded bg-muted px-2 py-0.5 font-mono font-semibold text-sm tracking-wide">
												{item.code}
											</code>
										</AdminTableCell>
										<AdminTableCell>
											<span className="text-sm tabular-nums">
												{item.usageCount}
												{item.maxUsages !== null ? ` / ${item.maxUsages}` : " / ∞"}
											</span>
										</AdminTableCell>
										<AdminTableCell>
											<span className={`text-sm ${isExpired ? "text-red-600" : "text-muted-foreground"}`}>
												{formatDate(item.validUntil)}
											</span>
										</AdminTableCell>
										<AdminTableCell>
											<span className="text-sm">{item.premiumDays} hari</span>
										</AdminTableCell>
										<AdminTableCell className="pr-4 text-right">
											<div className="flex items-center justify-end gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
												<Button
													variant="ghost"
													size="icon"
													className="size-8"
													onClick={() => toggleStatusMutation.mutate({ codeId: item.id, status: !item.status })}
													title={item.status ? "Nonaktifkan" : "Aktifkan"}
													id={`toggle-status-${item.id}`}
												>
													{item.status ? (
														<ProhibitIcon className="size-4 text-destructive" />
													) : (
														<CheckCircleIcon className="size-4 text-green-600" />
													)}
												</Button>
												<Link to="/admin/referrals/$codeId" params={{ codeId: item.id }}>
													<Button variant="ghost" size="icon" className="size-8" title="Lihat detail">
														<ArrowRightIcon className="size-4" />
													</Button>
												</Link>
											</div>
										</AdminTableCell>
									</AdminTableRow>
								);
							})}
						</AdminTableBody>
					</AdminTable>

					{data && (
						<AdminTablePaginationWrapper>
							<PaginationButtons
								onPrevious={handlePrevious}
								onNext={handleNext}
								hasPrevious={!!pageInfo?.hasPreviousPage}
								hasNext={!!pageInfo?.hasNextPage}
							/>
						</AdminTablePaginationWrapper>
					)}
				</AdminTableRoot>
			</AdminPageContent>
		</AdminPageRoot>
	);
}
