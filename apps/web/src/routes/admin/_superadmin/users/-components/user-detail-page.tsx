import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderActions,
	AdminPageHeaderContent,
	AdminPageRoot,
} from "@/components/admin/admin-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="icon" aria-label="Kembali" onClick={handleBack}>
							<ArrowLeftIcon className="size-4" />
						</Button>
						<Typography variant="title">{user.name}</Typography>
					</div>
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
				<div className="grid gap-6 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Informasi User</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
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
						</CardContent>
					</Card>

					<Card className="md:col-span-1">
						<CardHeader>
							<CardTitle>Credit History</CardTitle>
						</CardHeader>
						<CardContent>
							{creditHistory.length === 0 ? (
								<Typography tone="muted" className="py-8 text-center">
									Tidak ada transaksi kredit
								</Typography>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Tanggal</TableHead>
											<TableHead>Jumlah</TableHead>
											<TableHead>Saldo Setelah</TableHead>
											<TableHead>Catatan</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{creditHistory.map((tx) => (
											<TableRow key={tx.id}>
												<TableCell className="text-muted-foreground whitespace-nowrap tabular-nums">
													{formatDateTime(tx.createdAt)}
												</TableCell>
												<TableCell>
													<span className={tx.amount < 0 ? "text-destructive font-medium" : "font-medium"}>
														{tx.amount > 0 ? "+" : ""}
														{tx.amount}
													</span>
												</TableCell>
												<TableCell className="tabular-nums">{tx.balanceAfter}</TableCell>
												<TableCell className="max-w-50 truncate">{tx.note || "-"}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</div>
			</AdminPageContent>
		</AdminPageRoot>
	);
}
