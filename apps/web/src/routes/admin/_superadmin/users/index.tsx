import { PaginationInputSchema } from "@bimbelbeta/contract/common/pagination";
import { CalendarDotsIcon, ClockIcon, CreditCardIcon, CrownIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { type } from "arktype";
import { useState } from "react";
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
import { AdminTablePaginationWrapper, AdminTableToolbar } from "@/components/admin/admin-table-toolbar";
import { PaginationButtons } from "@/components/admin/pagination-buttons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePaginationNavigation } from "@/hooks/use-pagination-navigation";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";
import { EditRoleDialog } from "./-components/edit-role-dialog";
import { GrantCreditsDialog } from "./-components/grant-credits-dialog";
import { GrantPremiumDialog } from "./-components/grant-premium-dialog";
import { formatPremiumExpiry, formatRelativeDate, getInitials, roleConfig } from "./-utils";

const searchSchema = type({
	"...": PaginationInputSchema,
	"search?": "string",
	"role?": "'user' | 'admin' | 'superadmin'",
	"isPremium?": "boolean",
});

export const Route = createFileRoute("/admin/_superadmin/users/")({
	component: UsersListPage,
	validateSearch: searchSchema,
});

function UsersListPage() {
	const navigate = Route.useNavigate();
	const { after, before, limit = 10, search, role, isPremium } = Route.useSearch();

	const [searchInput, setSearchInput] = useState(search ?? "");

	const { data, isLoading, refetch } = useQuery(
		orpc.admin.users.list.queryOptions({
			input: {
				after,
				before,
				limit,
				search: search ?? undefined,
				role,
				isPremium,
			},
		}),
	);

	const pageInfo = data?.pageInfo;

	const [editRoleUser, setEditRoleUser] = useState<{
		userId: string;
		userName: string;
		currentRole: string | null;
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

	const baseSearchParams = {
		...(search && { search }),
		...(role && { role }),
		...(isPremium !== undefined && { isPremium }),
		limit,
	};

	const handleSearch = (value: string) => {
		setSearchInput(value);
		navigate({
			search: value
				? {
						search: value,
						...(role && { role }),
						...(isPremium !== undefined && { isPremium }),
						limit,
					}
				: baseSearchParams,
		});
	};

	const handleRoleChange = (value: string) => {
		navigate({
			search:
				value !== "all"
					? {
							role: value as "user" | "admin" | "superadmin",
							...(search && { search }),
							...(isPremium !== undefined && { isPremium }),
							limit,
						}
					: {
							...(search && { search }),
							...(isPremium !== undefined && { isPremium }),
							limit,
						},
		});
	};

	const handlePremiumChange = (value: string) => {
		navigate({
			search:
				value !== "all"
					? {
							isPremium: value === "true",
							...(search && { search }),
							...(role && { role }),
							limit,
						}
					: {
							...(search && { search }),
							...(role && { role }),
							limit,
						},
		});
	};

	const { handleNext, handlePrevious } = usePaginationNavigation(navigate, pageInfo, baseSearchParams);

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<AdminPageTitle>User Management</AdminPageTitle>
				</AdminPageHeaderContent>
				<AdminPageHeaderActions />
			</AdminPageHeader>

			<AdminPageContent>
				<AdminTableToolbar
					searchValue={searchInput}
					onSearchChange={handleSearch}
					searchPlaceholder="Cari nama atau email..."
				>
					<Select value={role ?? "all"} onValueChange={handleRoleChange}>
						<SelectTrigger className="w-full sm:w-40">
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
						<SelectTrigger className="w-full sm:w-40">
							<SelectValue placeholder="Semua Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua Status</SelectItem>
							<SelectItem value="true">Premium</SelectItem>
							<SelectItem value="false">Non-Premium</SelectItem>
						</SelectContent>
					</Select>
				</AdminTableToolbar>

				<AdminTableRoot className="mt-3">
					<AdminTable>
						<AdminTableHeader>
							<AdminTableHead className="pl-4">Nama</AdminTableHead>
							<AdminTableHead>Role</AdminTableHead>
							<AdminTableHead>Credits</AdminTableHead>
							<AdminTableHead className="min-w-45">Premium</AdminTableHead>
							<AdminTableHead className="min-w-32.5">Dibuat</AdminTableHead>
							<AdminTableHead className="pr-4 text-right">Aksi</AdminTableHead>
						</AdminTableHeader>
						<AdminTableBody
							isLoading={isLoading}
							isEmpty={!isLoading && data?.items.length === 0}
							emptyMessage="Tidak ada user ditemukan."
							columns={6}
						>
							<TooltipProvider delayDuration={200}>
								{data?.items.map((user) => {
									const roleInfo = roleConfig[user.role as keyof typeof roleConfig] ?? roleConfig.user;
									const RoleIcon = roleInfo.icon;
									const premiumDate = user.premiumExpiresAt ? new Date(user.premiumExpiresAt) : null;
									const isPremiumExpired = premiumDate ? premiumDate.getTime() < Date.now() : false;
									const createdDate = user.createdAt ? new Date(user.createdAt) : null;

									return (
										<AdminTableRow key={user.id}>
											<AdminTableCell className="pl-4">
												<div className="flex items-center gap-3">
													<Avatar className="size-9 rounded-full ring-2 ring-border">
														<AvatarImage src={user.image ?? undefined} alt={user.name} />
														<AvatarFallback className="bg-primary-100 font-semibold text-primary-700 text-xs">
															{getInitials(user.name)}
														</AvatarFallback>
													</Avatar>
													<div className="flex flex-col">
														<Link
															to="/admin/users/$userId"
															params={{ userId: user.id }}
															className="font-semibold text-foreground leading-tight transition-colors hover:text-primary"
														>
															{user.name}
														</Link>
														<span className="text-muted-foreground text-xs leading-tight">{user.email}</span>
													</div>
												</div>
											</AdminTableCell>

											<AdminTableCell>
												<Badge
													variant="outline"
													className={cn("gap-1 py-0.5 font-semibold text-[11px]", roleInfo.className)}
												>
													<RoleIcon className="size-3" />
													{roleInfo.label}
												</Badge>
											</AdminTableCell>

											<AdminTableCell>
												<div className="flex items-center gap-1.5">
													<div
														className={cn(
															"flex size-6 items-center justify-center rounded-md",
															(user.tryoutCredits ?? 0) > 0
																? "bg-green-100 text-green-200"
																: "bg-neutral-200 text-neutral-500",
														)}
													>
														<CreditCardIcon className="size-3.5" />
													</div>
													<span
														className={cn(
															"font-semibold text-sm tabular-nums",
															(user.tryoutCredits ?? 0) > 0 ? "text-foreground" : "text-muted-foreground",
														)}
													>
														{user.tryoutCredits ?? 0}
													</span>
												</div>
											</AdminTableCell>

											<AdminTableCell>
												{user.isPremium ? (
													<div className="flex flex-col justify-center gap-2">
														<div className="flex w-fit items-center gap-1.5 rounded-full border border-amber-200 bg-linear-to-r from-amber-50 to-yellow-50 px-2.5 py-1 shadow-xs">
															<CrownIcon className="size-3.5 text-amber-500" weight="fill" />
															<span className="font-bold text-amber-700 text-xs tracking-wide">PREMIUM</span>
														</div>
														{premiumDate && (
															<Tooltip>
																<TooltipTrigger asChild>
																	<span
																		className={cn(
																			"flex items-center gap-1 text-[11px]",
																			isPremiumExpired ? "text-red-100" : "text-amber-600",
																		)}
																	>
																		<ClockIcon className="size-3" />
																		{formatPremiumExpiry(premiumDate)}
																	</span>
																</TooltipTrigger>
																<TooltipContent>
																	{premiumDate.toLocaleDateString("id-ID", {
																		day: "numeric",
																		month: "long",
																		year: "numeric",
																		hour: "2-digit",
																		minute: "2-digit",
																	})}
																</TooltipContent>
															</Tooltip>
														)}
													</div>
												) : (
													<span className="flex items-center gap-1.5 text-muted-foreground text-xs">
														<span className="inline-block size-1.5 rounded-full bg-neutral-400" />
														Non-Premium
													</span>
												)}
											</AdminTableCell>

											<AdminTableCell>
												{createdDate ? (
													<Tooltip>
														<TooltipTrigger asChild>
															<span className="flex items-center gap-1.5 text-muted-foreground text-xs">
																<CalendarDotsIcon className="size-3.5" />
																{formatRelativeDate(createdDate)}
															</span>
														</TooltipTrigger>
														<TooltipContent>
															{createdDate.toLocaleDateString("id-ID", {
																day: "numeric",
																month: "long",
																year: "numeric",
															})}
														</TooltipContent>
													</Tooltip>
												) : (
													<span className="text-muted-foreground text-xs">-</span>
												)}
											</AdminTableCell>

											<AdminTableCell className="pr-4 text-right">
												<div className="flex items-center justify-end gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
													<EditRoleDialog
														userId={user.id}
														userName={user.name}
														currentRole={user.role}
														open={editRoleUser?.userId === user.id}
														onOpenChange={(open) =>
															setEditRoleUser(
																open ? { userId: user.id, userName: user.name, currentRole: user.role } : null,
															)
														}
														onSuccess={() => refetch()}
													/>
													<GrantCreditsDialog
														userId={user.id}
														userName={user.name}
														currentCredits={user.tryoutCredits}
														open={grantCreditsUser?.userId === user.id}
														onOpenChange={(open) =>
															setGrantCreditsUser(
																open
																	? {
																			userId: user.id,
																			userName: user.name,
																			currentCredits: user.tryoutCredits,
																		}
																	: null,
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
																	? {
																			userId: user.id,
																			userName: user.name,
																			currentPremiumExpiry: user.premiumExpiresAt,
																		}
																	: null,
															)
														}
														onSuccess={() => refetch()}
													/>
												</div>
											</AdminTableCell>
										</AdminTableRow>
									);
								})}
							</TooltipProvider>
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
