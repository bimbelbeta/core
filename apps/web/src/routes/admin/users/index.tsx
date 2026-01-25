import { CaretLeftIcon, CaretRightIcon, UserIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { type } from "arktype";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { BodyOutputs } from "@/utils/orpc";
import { orpc } from "@/utils/orpc";
import { EditUserDialog } from "./-components/edit-user-dialog";
import { GrantCreditsDialog } from "./-components/grant-credits-dialog";
import { GrantPremiumDialog } from "./-components/grant-premium-dialog";

type UserListItem = NonNullable<BodyOutputs["admin"]["users"]["listUsers"]["users"][number]>;

const searchSchema = type({
	page: "number = 1",
	"search?": "string",
	"role?": "'user' | 'admin' | 'superadmin'",
	"isPremium?": "boolean",
});

export const Route = createFileRoute("/admin/users/")({
	component: UsersListPage,
	validateSearch: searchSchema,
});

function UsersListPage() {
	const navigate = Route.useNavigate();
	const { page = 1, search, role, isPremium } = Route.useSearch();

	const [searchInput, setSearchInput] = useState(search ?? "");

	const { data, isLoading, refetch } = useQuery(
		orpc.admin.users.listUsers.queryOptions({
			input: {
				page,
				limit: 10,
				search: search ?? undefined,
				role,
				isPremium: isPremium === undefined ? undefined : isPremium,
			},
		}),
	);

	const [editDialogUser, setEditDialogUser] = useState<{
		id: string;
		name: string;
		email: string;
		role: string | null;
		isPremium: boolean | null;
		premiumExpiresAt: Date | null;
	} | null>(null);
	const [grantCreditsUser, setGrantCreditsUser] = useState<{
		userId: string;
		userName: string;
		currentCredits: number | null;
	} | null>(null);
	const [grantPremiumUser, setGrantPremiumUser] = useState<{
		userId: string;
		userName: string;
		currentPremiumExpiry: Date | null;
	} | null>(null);

	const handleSearch = (value: string) => {
		setSearchInput(value);
		navigate({
			search: { search: value || undefined, page: 1, role, isPremium },
		});
	};

	const handleRoleChange = (value: string) => {
		navigate({
			search: {
				role: value === "all" ? undefined : (value as "user" | "admin" | "superadmin"),
				page: 1,
				search,
				isPremium,
			},
		});
	};

	const handlePremiumChange = (value: string) => {
		navigate({
			search: {
				isPremium: value === "all" ? undefined : value === "true",
				page: 1,
				search,
				role,
			},
		});
	};

	const handlePageChange = (newPage: number) => {
		navigate({
			search: { page: newPage, search, role, isPremium },
		});
	};

	return (
		<div className="flex h-full flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<h1 className="font-bold text-2xl text-primary-navy-900">User Management</h1>
			</div>

			<div className="flex items-center justify-between gap-4">
				<SearchInput
					value={searchInput}
					onChange={handleSearch}
					placeholder="Cari nama atau email..."
					className="max-w-md"
				/>
				<div className="flex items-center gap-2">
					<Select value={role ?? "all"} onValueChange={handleRoleChange}>
						<SelectTrigger className="w-40">
							<SelectValue placeholder="Semua Role" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua Role</SelectItem>
							<SelectItem value="user">User</SelectItem>
							<SelectItem value="admin">Admin</SelectItem>
							<SelectItem value="superadmin">Superadmin</SelectItem>
						</SelectContent>
					</Select>
					<Select
						value={isPremium === undefined ? "all" : isPremium ? "true" : "false"}
						onValueChange={handlePremiumChange}
					>
						<SelectTrigger className="w-40">
							<SelectValue placeholder="Semua Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua Status</SelectItem>
							<SelectItem value="true">Premium</SelectItem>
							<SelectItem value="false">Non-Premium</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="rounded-lg border bg-white shadow-sm">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-12.5">No</TableHead>
							<TableHead>Nama</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>Credits</TableHead>
							<TableHead>Premium</TableHead>
							<TableHead>Dibuat</TableHead>
							<TableHead className="text-right">Aksi</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={8} className="h-24 text-center">
									Memuat data...
								</TableCell>
							</TableRow>
						) : data?.users.length === 0 ? (
							<TableRow>
								<TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
									Tidak ada user ditemukan.
								</TableCell>
							</TableRow>
						) : (
							data?.users.map((user, index) => (
								<TableRow key={user.id}>
									<TableCell>{(page - 1) * 10 + index + 1}</TableCell>
									<TableCell className="font-medium">{user.name}</TableCell>
									<TableCell>{user.email}</TableCell>
									<TableCell>
										<Badge variant="outline">{user.role}</Badge>
									</TableCell>
									<TableCell>{user.tryoutCredits} credits</TableCell>
									<TableCell>
										{user.isPremium ? (
											<div className="flex flex-col gap-0.5">
												<Badge variant="default">Premium</Badge>
												{user.premiumExpiresAt && (
													<span className="text-muted-foreground text-xs">
														{new Date(user.premiumExpiresAt).toLocaleDateString("id-ID")}
													</span>
												)}
											</div>
										) : (
											<Badge variant="secondary">Non-Premium</Badge>
										)}
									</TableCell>
									<TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString("id-ID") : "-"}</TableCell>
									<TableCell className="text-right">
										<div className="flex items-center justify-end gap-2">
											<Button variant="ghost" size="icon" asChild>
												<Link to="/admin/users/$userId" params={{ userId: user.id }}>
													<UserIcon className="size-4" />
												</Link>
											</Button>
											<EditUserDialog
												user={user as UserListItem}
												open={editDialogUser?.id === user.id}
												onOpenChange={(open) => setEditDialogUser(open ? (user as UserListItem) : null)}
												onSuccess={() => refetch()}
											/>
											<GrantCreditsDialog
												userId={user.id}
												userName={user.name}
												currentCredits={user.tryoutCredits}
												open={grantCreditsUser?.userId === user.id}
												onOpenChange={(open) =>
													setGrantCreditsUser(
														open ? { userId: user.id, userName: user.name, currentCredits: user.tryoutCredits } : null,
													)
												}
												onSuccess={() => refetch()}
											/>
											<GrantPremiumDialog
												userId={user.id}
												userName={user.name}
												currentPremiumExpiry={user.premiumExpiresAt}
												open={grantPremiumUser?.userId === user.id}
												onOpenChange={(open) =>
													setGrantPremiumUser(
														open
															? { userId: user.id, userName: user.name, currentPremiumExpiry: user.premiumExpiresAt }
															: null,
													)
												}
												onSuccess={() => refetch()}
											/>
										</div>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>

				{data && (
					<div className="flex items-center justify-end gap-2 border-t p-4">
						<Button variant="outline" size="sm" disabled={page <= 1} onClick={() => handlePageChange(page - 1)}>
							<CaretLeftIcon className="mr-2 size-4" />
							Previous
						</Button>
						<span className="mx-2 text-muted-foreground text-sm">
							Page {page} of {Math.ceil(data.total / data.limit)}
						</span>
						<Button
							variant="outline"
							size="sm"
							disabled={page >= Math.ceil(data.total / data.limit)}
							onClick={() => handlePageChange(page + 1)}
						>
							Next
							<CaretRightIcon className="ml-2 size-4" />
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
