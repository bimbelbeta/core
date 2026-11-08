import { CreditCardIcon } from "@phosphor-icons/react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
	AdminBackButton,
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderActions,
	AdminPageHeaderContent,
	AdminPageRoot,
	AdminSection,
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
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { formatDateTime } from "@/lib/format-date";
import { useUserDetail } from "../-hooks/use-user-detail";
import { EditRoleDialog } from "./edit-role-dialog";
import { GrantCreditsDialog } from "./grant-credits-dialog";
import { GrantPremiumDialog } from "./grant-premium-dialog";

export function UserDetailPage() {
	const { data, isLoading, refetch } = useUserDetail();
	const navigate = useNavigate({ from: "/admin/users/$userId" });
	const handleBack = () => navigate({ to: "/admin/users" });

	const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
	const [isGrantCreditsDialogOpen, setIsGrantCreditsDialogOpen] = useState(false);
	const [isGrantPremiumDialogOpen, setIsGrantPremiumDialogOpen] = useState(false);

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
						<Typography variant="title">User tidak ditemukan</Typography>
					</AdminPageHeaderContent>
				</AdminPageHeader>
			</AdminPageRoot>
		);
	}

	const { user, creditHistory } = data;

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<AdminBackButton onClick={handleBack}>Kembali ke pengguna</AdminBackButton>
					<Typography variant="title">{user.name}</Typography>
					<Typography variant="body" tone="muted">
						{user.email}
					</Typography>
				</AdminPageHeaderContent>
				<AdminPageHeaderActions>
					<EditRoleDialog
						userId={user.id}
						userName={user.name}
						currentRole={user.role}
						open={isEditRoleDialogOpen}
						onOpenChange={setIsEditRoleDialogOpen}
						onSuccess={() => refetch()}
					/>
					<GrantCreditsDialog
						userId={user.id}
						userName={user.name}
						currentCredits={user.tryoutCredits ?? 0}
						open={isGrantCreditsDialogOpen}
						onOpenChange={setIsGrantCreditsDialogOpen}
						onSuccess={() => refetch()}
					/>
					<GrantPremiumDialog
						userId={user.id}
						userName={user.name}
						currentPremiumExpiry={user.premiumExpiresAt}
						open={isGrantPremiumDialogOpen}
						onOpenChange={setIsGrantPremiumDialogOpen}
						onSuccess={() => refetch()}
					/>
				</AdminPageHeaderActions>
			</AdminPageHeader>

			<AdminPageContent>
				<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
					<AdminSection title="Informasi pengguna">
						<div className="bg-card text-meta flex flex-col gap-2 rounded-lg border p-3">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Role</span>
								<Badge variant="outline">{user.role}</Badge>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Email Verified</span>
								<Badge variant={user.emailVerified ? "default" : "secondary"}>
									{user.emailVerified ? "Verified" : "Not Verified"}
								</Badge>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Tryout Credits</span>
								<span className="font-semibold tabular-nums">{user.tryoutCredits} credits</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Premium Status</span>
								<Badge variant={user.isPremium ? "default" : "secondary"}>
									{user.isPremium ? "Premium" : "Non-Premium"}
								</Badge>
							</div>
							{user.premiumExpiresAt && (
								<div className="flex justify-between">
									<span className="text-muted-foreground">Premium Expired</span>
									<span className="font-semibold">{formatDateTime(user.premiumExpiresAt)}</span>
								</div>
							)}
							<div className="flex justify-between">
								<span className="text-muted-foreground">Dibuat</span>
								<span className="tabular-nums">{user.createdAt ? formatDateTime(user.createdAt) : "-"}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Diupdate</span>
								<span className="tabular-nums">{user.updatedAt ? formatDateTime(user.updatedAt) : "-"}</span>
							</div>
						</div>
					</AdminSection>

					<AdminSection title="Riwayat kredit">
						{creditHistory.length === 0 ? (
							<Empty className="bg-card min-h-48 rounded-lg border">
								<EmptyHeader>
									<EmptyMedia variant="icon">
										<CreditCardIcon />
									</EmptyMedia>
									<EmptyTitle>Belum ada transaksi kredit</EmptyTitle>
									<EmptyDescription>Kredit pembelian dan pemakaian tryout akan tampil di sini.</EmptyDescription>
								</EmptyHeader>
							</Empty>
						) : (
							<AdminTableRoot>
								<AdminTable>
									<AdminTableHeader>
										<AdminTableHead>Tanggal</AdminTableHead>
										<AdminTableHead>Jumlah</AdminTableHead>
										<AdminTableHead>Saldo Setelah</AdminTableHead>
										<AdminTableHead>Catatan</AdminTableHead>
									</AdminTableHeader>
									<AdminTableBody columns={4}>
										{creditHistory.map((tx) => (
											<AdminTableRow key={tx.id}>
												<AdminTableCell className="text-muted-foreground whitespace-nowrap tabular-nums">
													{formatDateTime(tx.createdAt)}
												</AdminTableCell>
												<AdminTableCell>
													<span className={tx.amount < 0 ? "text-destructive font-medium" : "font-medium"}>
														{tx.amount > 0 ? "+" : ""}
														{tx.amount}
													</span>
												</AdminTableCell>
												<AdminTableCell className="tabular-nums">{tx.balanceAfter}</AdminTableCell>
												<AdminTableCell className="max-w-50 truncate">{tx.note || "-"}</AdminTableCell>
											</AdminTableRow>
										))}
									</AdminTableBody>
								</AdminTable>
							</AdminTableRoot>
						)}
					</AdminSection>
				</div>
			</AdminPageContent>
		</AdminPageRoot>
	);
}
