import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { BodyOutputs } from "@/utils/orpc";
import { orpc } from "@/utils/orpc";
import { EditUserDialog } from "./-components/edit-user-dialog";
import { GrantCreditsDialog } from "./-components/grant-credits-dialog";
import { GrantPremiumDialog } from "./-components/grant-premium-dialog";

type UserDetail = NonNullable<BodyOutputs["admin"]["users"]["getUser"]["user"]>;

export const Route = createFileRoute("/admin/_superadmin/users/$userId")({
	component: UserDetailPage,
}) as any;

function UserDetailPage() {
	const { userId } = Route.useParams();
	const navigate = Route.useNavigate();

	const handleBack = () => {
		navigate({
			to: "/admin/_superadmin/users",
		});
	};

	const { data, isLoading, refetch } = useQuery(
		orpc.admin.users.getUser.queryOptions({
			input: { userId },
		}),
	);

	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isGrantCreditsDialogOpen, setIsGrantCreditsDialogOpen] = useState(false);
	const [isGrantPremiumDialogOpen, setIsGrantPremiumDialogOpen] = useState(false);

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<p>Memuat data...</p>
			</div>
		);
	}

	if (!data) {
		return (
			<div className="flex h-full items-center justify-center">
				<p>User tidak ditemukan</p>
			</div>
		);
	}

	const { user, creditHistory } = data;

	return (
		<div className="flex h-full flex-col gap-6 p-6">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" onClick={handleBack}>
					<ArrowLeftIcon className="size-5" />
				</Button>
				<div>
					<h1 className="font-bold text-2xl text-primary-navy-900">{user.name}</h1>
					<p className="text-muted-foreground">{user.email}</p>
				</div>
				<div className="ml-auto flex gap-2">
					<EditUserDialog
						user={user as UserDetail}
						open={isEditDialogOpen}
						onOpenChange={setIsEditDialogOpen}
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
				</div>
			</div>

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
							<span className="font-semibold">{user.tryoutCredits} credits</span>
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
								<span className="font-semibold">{new Date(user.premiumExpiresAt).toLocaleString("id-ID")}</span>
							</div>
						)}
						<div className="flex justify-between">
							<span className="text-muted-foreground">Dibuat</span>
							<span>{user.createdAt ? new Date(user.createdAt).toLocaleString("id-ID") : "-"}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Diupdate</span>
							<span>{user.updatedAt ? new Date(user.updatedAt).toLocaleString("id-ID") : "-"}</span>
						</div>
					</CardContent>
				</Card>

				<Card className="md:col-span-1">
					<CardHeader>
						<CardTitle>Credit History</CardTitle>
					</CardHeader>
					<CardContent>
						{creditHistory.length === 0 ? (
							<p className="py-8 text-center text-muted-foreground">Tidak ada transaksi kredit</p>
						) : (
							<div className="rounded-md border">
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
												<TableCell className="whitespace-nowrap">
													{new Date(tx.createdAt).toLocaleString("id-ID")}
												</TableCell>
												<TableCell>
													<span className={tx.amount >= 0 ? "text-green-600" : "text-red-600"}>
														{tx.amount > 0 ? "+" : ""}
														{tx.amount}
													</span>
												</TableCell>
												<TableCell>{tx.balanceAfter}</TableCell>
												<TableCell className="max-w-50 truncate">{tx.note || "-"}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
