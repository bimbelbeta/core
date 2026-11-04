import { ArrowLeftIcon, CrownIcon, XCircleIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Typography } from "@/components/ui/typography";
import { useReferralDetail } from "../-hooks/use-referral-detail";
import { formatDateTime } from "../-utils";

export function ReferralDetailPage() {
	const { data, isLoading, handleBack } = useReferralDetail();

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Typography tone="muted">Memuat data...</Typography>
			</div>
		);
	}

	if (!data) {
		return (
			<div className="flex h-full items-center justify-center">
				<Typography tone="muted">Kode tidak ditemukan.</Typography>
			</div>
		);
	}

	const { referralCode, items } = data;
	const isExpired = referralCode.validUntil ? new Date(referralCode.validUntil) < new Date() : false;
	const isFull = referralCode.maxUsages !== null && referralCode.usageCount >= referralCode.maxUsages;
	const isActive = referralCode.status && !isExpired && !isFull;

	return (
		<div className="flex flex-col gap-6 p-6">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" onClick={handleBack}>
					<ArrowLeftIcon className="size-5" />
				</Button>
				<div>
					<Typography variant="title">
						<code className="bg-muted rounded px-3 py-1 font-mono text-xl tracking-widest">{referralCode.code}</code>
					</Typography>
					<Typography tone="muted" className="mt-1">
						Detail kode referal
					</Typography>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Informasi Kode</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Status</span>
							{isActive ? (
								<Badge className="gap-1 border-green-200 bg-green-50 text-green-700" variant="outline">
									Aktif
								</Badge>
							) : (
								<Badge className="gap-1 border-red-200 bg-red-50 text-red-700" variant="outline">
									<XCircleIcon className="size-3" />
									{!referralCode.status ? "Nonaktif" : isExpired ? "Kedaluwarsa" : "Kuota Habis"}
								</Badge>
							)}
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Penggunaan</span>
							<span className="font-semibold tabular-nums">
								{referralCode.usageCount} / {referralCode.maxUsages ?? "∞"}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Durasi Premium</span>
							<span className="font-semibold">{referralCode.premiumDays} hari</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Berlaku Hingga</span>
							<span>{formatDateTime(referralCode.validUntil)}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Dibuat</span>
							<span>{formatDateTime(referralCode.createdAt)}</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-base">Ringkasan</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Total pengguna</span>
							<span className="text-lg font-bold">{items.length}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Pengguna premium aktif</span>
							<span className="font-semibold text-amber-600">{items.filter((u) => u.isPremium).length}</span>
						</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Pengguna yang Menukarkan Kode</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					{items.length === 0 ? (
						<Typography tone="muted" className="py-10 text-center">
							Belum ada pengguna yang menukarkan kode ini.
						</Typography>
					) : (
						<div className="overflow-auto rounded-b-lg">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="pl-6">Nama</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Status Premium</TableHead>
										<TableHead>Premium Berakhir</TableHead>
										<TableHead className="pr-6">Ditukar Pada</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{items.map((item) => (
										<TableRow key={item.usageId}>
											<TableCell className="pl-6">
												<Link
													to="/admin/users/$userId"
													params={{ userId: item.userId }}
													className="hover:text-primary font-medium hover:underline"
												>
													{item.userName}
												</Link>
											</TableCell>
											<TableCell className="text-muted-foreground">{item.userEmail}</TableCell>
											<TableCell>
												{item.isPremium ? (
													<Badge
														className="gap-1 border-amber-200 bg-amber-50 text-[11px] text-amber-700"
														variant="outline"
													>
														<CrownIcon className="size-3" weight="fill" />
														Premium
													</Badge>
												) : (
													<Badge variant="secondary" className="text-[11px]">
														Non-Premium
													</Badge>
												)}
											</TableCell>
											<TableCell className="text-muted-foreground text-sm">
												{formatDateTime(item.premiumExpiresAt)}
											</TableCell>
											<TableCell className="text-muted-foreground pr-6 text-sm">
												{formatDateTime(item.claimedAt)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
