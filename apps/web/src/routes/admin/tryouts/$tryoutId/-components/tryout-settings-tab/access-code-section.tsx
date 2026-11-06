import { CopyIcon, KeyIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AdminSection } from "@/components/admin/admin-page";
import {
	AdminTable,
	AdminTableBody,
	AdminTableCell,
	AdminTableHead,
	AdminTableHeader,
	AdminTableRoot,
	AdminTableRow,
} from "@/components/admin/admin-table";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";
import { formatDateTime } from "@/lib/format-date";
import { orpc } from "@/lib/orpc";

export function AccessCodeSection({ tryoutId }: { tryoutId: number }) {
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
		<div className="space-y-8">
			<AdminSection title="Buat kode akses" description="Kode akses membuka tryout tanpa bukti pembayaran.">
				<div className="grid gap-4 sm:grid-cols-2">
					<div className="space-y-1.5">
						<Label htmlFor="access-code-label">Label</Label>
						<Input
							id="access-code-label"
							value={label}
							onChange={(e) => setLabel(e.target.value)}
							placeholder="Contoh: Gelombang 1"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="access-code-value">Kode</Label>
						<Input
							id="access-code-value"
							value={code}
							onChange={(e) => setCode(e.target.value.toUpperCase())}
							placeholder="Kosongkan untuk generate otomatis"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="access-code-max-uses">Maksimal penggunaan</Label>
						<Input
							id="access-code-max-uses"
							type="number"
							min={1}
							value={maxUses}
							onChange={(e) => setMaxUses(e.target.value)}
							placeholder="Tanpa batas"
						/>
					</div>
					<div className="space-y-1.5">
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
					<Button
						isPending={createAccessCodeMutation.isPending}
						onClick={handleCreate}
						disabled={createAccessCodeMutation.isPending}
					>
						Buat kode akses
					</Button>
				</div>
			</AdminSection>

			<AdminSection title="Daftar kode" description="Kode yang sudah dibuat untuk tryout ini.">
				{accessCodesQuery.isPending ? (
					<Typography variant="body" tone="muted">
						Memuat kode akses...
					</Typography>
				) : accessCodesQuery.data && accessCodesQuery.data.length > 0 ? (
					<AdminTableRoot>
						<AdminTable>
							<AdminTableHeader>
								<AdminTableHead>Label</AdminTableHead>
								<AdminTableHead className="w-44">Kode</AdminTableHead>
								<AdminTableHead className="w-32">Penggunaan</AdminTableHead>
								<AdminTableHead className="w-44">Kadaluarsa</AdminTableHead>
								<AdminTableHead className="w-28 text-right">Status</AdminTableHead>
							</AdminTableHeader>
							<AdminTableBody columns={5}>
								{accessCodesQuery.data.map((accessCodeItem) => (
									<AdminTableRow key={accessCodeItem.id}>
										<AdminTableCell className="text-row-title">{accessCodeItem.label || "Tanpa label"}</AdminTableCell>
										<AdminTableCell>
											<div className="flex items-center gap-1">
												<span className="text-meta font-mono tabular-nums">{accessCodeItem.codePreview}</span>
												<Button
													type="button"
													size="icon"
													variant="ghost"
													className="size-6"
													aria-label={`Salin pratinjau kode akses ${accessCodeItem.label ?? accessCodeItem.codePreview}`}
													onClick={() => {
														navigator.clipboard.writeText(accessCodeItem.codePreview);
														toast.success("Kode disalin!");
													}}
												>
													<CopyIcon size={12} />
												</Button>
											</div>
										</AdminTableCell>
										<AdminTableCell className="text-meta tabular-nums">
											{accessCodeItem.usedCount}
											{accessCodeItem.maxUses ? ` / ${accessCodeItem.maxUses}` : ""}
										</AdminTableCell>
										<AdminTableCell className="text-meta">
											{accessCodeItem.expiresAt ? formatDateTime(accessCodeItem.expiresAt) : "—"}
										</AdminTableCell>
										<AdminTableCell className="text-right">
											<div className="flex items-center justify-end gap-2">
												<span className="text-muted-foreground text-xs">
													{accessCodeItem.isActive ? "Aktif" : "Nonaktif"}
												</span>
												<Switch
													aria-label={`Aktifkan kode akses ${accessCodeItem.label ?? accessCodeItem.codePreview}`}
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
										</AdminTableCell>
									</AdminTableRow>
								))}
							</AdminTableBody>
						</AdminTable>
					</AdminTableRoot>
				) : (
					<AdminTableRoot>
						<Empty className="min-h-40">
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<KeyIcon />
								</EmptyMedia>
								<EmptyTitle>Belum ada kode akses</EmptyTitle>
								<EmptyDescription>Kode akses yang dibuat akan muncul di sini.</EmptyDescription>
							</EmptyHeader>
						</Empty>
					</AdminTableRoot>
				)}
			</AdminSection>
		</div>
	);
}
