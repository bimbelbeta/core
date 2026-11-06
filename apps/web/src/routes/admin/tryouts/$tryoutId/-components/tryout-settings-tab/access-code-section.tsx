import { CopyIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
					<Button
						isPending={createAccessCodeMutation.isPending}
						onClick={handleCreate}
						disabled={createAccessCodeMutation.isPending}
					>
						{"Buat Kode Akses"}
					</Button>
				</div>

				<Separator />

				<div className="space-y-3">
					<Typography variant="body" className="font-medium">
						Daftar Kode
					</Typography>
					{accessCodesQuery.isPending ? (
						<Typography variant="body" tone="muted">
							Memuat kode akses...
						</Typography>
					) : accessCodesQuery.data && accessCodesQuery.data.length > 0 ? (
						<div className="space-y-2">
							{accessCodesQuery.data.map((accessCodeItem) => (
								<div
									key={accessCodeItem.id}
									className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
								>
									<div className="space-y-1">
										<div className="flex items-center gap-2">
											<Typography variant="body" className="font-medium">
												{accessCodeItem.label || "Tanpa Label"}
											</Typography>
											<Badge variant={accessCodeItem.isActive ? "default" : "outline"}>
												{accessCodeItem.isActive ? "Aktif" : "Nonaktif"}
											</Badge>
										</div>
										<div className="flex items-center gap-1">
											<Typography variant="caption" tone="default" className="tabular-nums">
												{accessCodeItem.codePreview}
											</Typography>
											<Button
												type="button"
												size="icon"
												variant="ghost"
												aria-label={`Salin pratinjau kode akses ${accessCodeItem.label ?? accessCodeItem.codePreview}`}
												onClick={() => {
													navigator.clipboard.writeText(accessCodeItem.codePreview);
													toast.success("Kode disalin!");
												}}
											>
												<CopyIcon size={12} />
											</Button>
										</div>
										<Typography variant="caption" tone="muted">
											Digunakan {accessCodeItem.usedCount}
											{accessCodeItem.maxUses ? ` / ${accessCodeItem.maxUses}` : " kali"}
										</Typography>
										{accessCodeItem.expiresAt ? (
											<Typography variant="caption" tone="muted">
												Kadaluarsa {formatDateTime(accessCodeItem.expiresAt)}
											</Typography>
										) : null}
									</div>
									<div className="flex items-center gap-2">
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
								</div>
							))}
						</div>
					) : (
						<Typography variant="body" tone="muted">
							Belum ada kode akses untuk tryout ini.
						</Typography>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
