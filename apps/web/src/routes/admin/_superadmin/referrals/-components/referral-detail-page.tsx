import { CrownIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
	AdminBackButton,
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderContent,
	AdminPageRoot,
	AdminSection,
} from "@/components/admin/admin-page";
import { AdminStatus } from "@/components/admin/admin-status";
import {
	AdminTable,
	AdminTableBody,
	AdminTableCell,
	AdminTableHead,
	AdminTableHeader,
	AdminTableRoot,
	AdminTableRow,
} from "@/components/admin/admin-table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { orpc } from "@/lib/orpc";
import { formatDate, formatTimestamp } from "../-utils";

export function ReferralDetailPage() {
	const { codeId } = useParams({ from: "/admin/_superadmin/referrals/$codeId" });
	const navigate = useNavigate({ from: "/admin/referrals/$codeId" });
	const { data, isLoading } = useQuery(
		orpc.admin.referral.getUsages.queryOptions({
			input: { codeId, limit: 50 },
		}),
	);
	const handleBack = () => navigate({ to: "/admin/referrals" });

	if (isLoading) {
		return (
			<AdminPageRoot>
				<AdminPageHeader>
					<AdminPageHeaderContent>
						<Skeleton className="h-7 w-48" />
					</AdminPageHeaderContent>
				</AdminPageHeader>
				<AdminPageContent className="max-w-none">
					<Skeleton className="h-96 w-full" />
				</AdminPageContent>
			</AdminPageRoot>
		);
	}

	if (!data) {
		return (
			<AdminPageRoot>
				<AdminPageHeader>
					<AdminPageHeaderContent>
						<Typography variant="title">Kode tidak ditemukan</Typography>
					</AdminPageHeaderContent>
				</AdminPageHeader>
			</AdminPageRoot>
		);
	}

	const { referralCode, items } = data;
	const isExpired = referralCode.validUntil ? new Date(referralCode.validUntil) < new Date() : false;
	const isFull = referralCode.maxUsages !== null && referralCode.usageCount >= referralCode.maxUsages;
	const isActive = referralCode.status && !isExpired && !isFull;

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<AdminBackButton onClick={handleBack}>Kembali ke referral</AdminBackButton>
					<div className="flex flex-wrap items-center gap-2">
						<Typography variant="title">{referralCode.code}</Typography>
						{isActive ? (
							<AdminStatus tone="positive">Aktif</AdminStatus>
						) : !referralCode.status ? (
							<AdminStatus tone="neutral">Nonaktif</AdminStatus>
						) : isExpired ? (
							<AdminStatus tone="danger">Kedaluwarsa</AdminStatus>
						) : (
							<AdminStatus tone="warning">Kuota habis</AdminStatus>
						)}
					</div>
					<Typography variant="body" tone="muted">
						Dibuat {formatDate(referralCode.createdAt)}
					</Typography>
				</AdminPageHeaderContent>
			</AdminPageHeader>

			<AdminPageContent>
				<div className="grid gap-4 md:grid-cols-2">
					<AdminSection title="Informasi Kode">
						<div className="bg-card text-meta flex flex-col gap-2 rounded-lg border p-3">
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
								<span className="tabular-nums">{formatTimestamp(referralCode.validUntil)}</span>
							</div>
						</div>
					</AdminSection>

					<AdminSection title="Ringkasan">
						<div className="bg-card text-meta flex flex-col gap-2 rounded-lg border p-3">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Total pengguna</span>
								<span className="font-semibold tabular-nums">{items.length}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Pengguna premium aktif</span>
								<span className="font-semibold tabular-nums">{items.filter((u) => u.isPremium).length}</span>
							</div>
						</div>
					</AdminSection>
				</div>

				<AdminSection title="Pengguna yang Menukarkan Kode">
					{items.length === 0 ? (
						<div className="bg-card flex min-h-48 items-center justify-center rounded-lg border">
							<Typography tone="muted">Belum ada pengguna yang menukarkan kode ini.</Typography>
						</div>
					) : (
						<AdminTableRoot>
							<AdminTable>
								<AdminTableHeader>
									<AdminTableHead className="pl-3">Nama</AdminTableHead>
									<AdminTableHead>Email</AdminTableHead>
									<AdminTableHead>Status Premium</AdminTableHead>
									<AdminTableHead>Premium Berakhir</AdminTableHead>
									<AdminTableHead className="pr-3">Ditukar Pada</AdminTableHead>
								</AdminTableHeader>
								<AdminTableBody columns={5}>
									{items.map((item) => (
										<AdminTableRow key={item.usageId}>
											<AdminTableCell className="pl-3">
												<Link
													to="/admin/users/$userId"
													params={{ userId: item.userId }}
													className="hover:text-primary font-medium hover:underline"
												>
													{item.userName}
												</Link>
											</AdminTableCell>
											<AdminTableCell className="text-muted-foreground">{item.userEmail}</AdminTableCell>
											<AdminTableCell>
												{item.isPremium ? (
													<Badge className="gap-1" variant="outline">
														<CrownIcon className="size-3" weight="fill" />
														Premium
													</Badge>
												) : (
													<Badge variant="secondary" className="text-meta">
														Non-Premium
													</Badge>
												)}
											</AdminTableCell>
											<AdminTableCell className="text-muted-foreground tabular-nums">
												{formatTimestamp(item.premiumExpiresAt)}
											</AdminTableCell>
											<AdminTableCell className="text-muted-foreground pr-3 tabular-nums">
												{formatTimestamp(item.claimedAt)}
											</AdminTableCell>
										</AdminTableRow>
									))}
								</AdminTableBody>
							</AdminTable>
						</AdminTableRoot>
					)}
				</AdminSection>
			</AdminPageContent>
		</AdminPageRoot>
	);
}
