import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { type } from "arktype";
import { CalendarDays, Clock, CreditCard, Crown } from "lucide-react";
import { useCallback, useState } from "react";
import {
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderActions,
	AdminPageHeaderContent,
	AdminPageRoot,
	AdminPageTitle,
} from "@/components/admin/admin-page";
import { PaginationButtons } from "@/components/admin/pagination-buttons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";
import { EditRoleDialog } from "./-components/edit-role-dialog";
import { GrantCreditsDialog } from "./-components/grant-credits-dialog";
import { GrantPremiumDialog } from "./-components/grant-premium-dialog";
import { formatPremiumExpiry, formatRelativeDate, getInitials, roleConfig } from "./-utils";

const searchSchema = type({
	"cursor?": "string",
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
	const { cursor, search, role, isPremium } = Route.useSearch();

	const [searchInput, setSearchInput] = useState(search ?? "");
	const [cursorStack, setCursorStack] = useState<string[]>([]);

	const { data, isLoading, refetch } = useQuery(
		orpc.admin.users.list.queryOptions({
			input: {
				cursor,
				limit: 10,
				search: search ?? undefined,
				role,
				isPremium,
			},
		}),
	);

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

	const buildSearch = useCallback(
		(newCursor?: string) => ({
			...(newCursor && { cursor: newCursor }),
			...(search && { search }),
			...(role && { role }),
			...(isPremium !== undefined && { isPremium }),
		}),
		[search, role, isPremium],
	);

	const handleSearch = (value: string) => {
		setSearchInput(value);
		setCursorStack([]);
		navigate({
			search: {
				...(value && { search: value }),
				...(role && { role }),
				...(isPremium !== undefined && { isPremium }),
			},
		});
	};

	const handleRoleChange = (value: string) => {
		setCursorStack([]);
		navigate({
			search: {
				...(search && { search }),
				...(value !== "all" && { role: value as "user" | "admin" | "superadmin" }),
				...(isPremium !== undefined && { isPremium }),
			},
		});
	};

	const handlePremiumChange = (value: string) => {
		setCursorStack([]);
		navigate({
			search: {
				...(search && { search }),
				...(role && { role }),
				...(value !== "all" && { isPremium: value === "true" }),
			},
		});
	};

	const handleNext = () => {
		if (!data?.nextCursor) return;
		setCursorStack((prev) => [...prev, cursor ?? ""]);
		navigate({ search: buildSearch(data.nextCursor) });
	};

	const handlePrevious = () => {
		if (cursorStack.length === 0) return;
		const prev = [...cursorStack];
		const previousCursor = prev.pop()!;
		setCursorStack(prev);
		navigate({ search: buildSearch(previousCursor || undefined) });
	};

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<AdminPageTitle>User Management</AdminPageTitle>
				</AdminPageHeaderContent>
				<AdminPageHeaderActions />
			</AdminPageHeader>

			<AdminPageContent>
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<SearchInput
						value={searchInput}
						onChange={handleSearch}
						placeholder="Cari nama atau email..."
						className="w-full sm:max-w-sm md:max-w-md"
					/>
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
					</div>
				</div>

				<div className="overflow-clip rounded-lg border bg-white shadow-sm">
					<div className="">
						<Table>
							<TableHeader>
								<TableRow className="bg-muted/30">
									<TableHead className="pl-4">Nama</TableHead>
									<TableHead>Role</TableHead>
									<TableHead>Credits</TableHead>
									<TableHead className="min-w-45">Premium</TableHead>
									<TableHead className="min-w-32.5">Dibuat</TableHead>
									<TableHead className="pr-4 text-right">Aksi</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading ? (
									<TableSkeleton columns={6} />
								) : data?.users.length === 0 ? (
									<TableRow>
										<TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
											Tidak ada user ditemukan.
										</TableCell>
									</TableRow>
								) : (
									<TooltipProvider delayDuration={200}>
										{data?.users.map((user) => {
											const roleInfo = roleConfig[user.role as keyof typeof roleConfig] ?? roleConfig.user;
											const RoleIcon = roleInfo.icon;
											const premiumDate = user.premiumExpiresAt ? new Date(user.premiumExpiresAt) : null;
											const isPremiumExpired = premiumDate ? premiumDate.getTime() < Date.now() : false;
											const createdDate = user.createdAt ? new Date(user.createdAt) : null;

											return (
												<TableRow key={user.id} className="group hover:bg-muted/30">
													{/* Name + Email cell */}
													<TableCell className="pl-4">
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
													</TableCell>

													{/* Role cell */}
													<TableCell>
														<Badge
															variant="outline"
															className={cn("gap-1 py-0.5 font-semibold text-[11px]", roleInfo.className)}
														>
															<RoleIcon className="size-3" />
															{roleInfo.label}
														</Badge>
													</TableCell>

													{/* Credits cell */}
													<TableCell>
														<div className="flex items-center gap-1.5">
															<div
																className={cn(
																	"flex size-6 items-center justify-center rounded-md",
																	(user.tryoutCredits ?? 0) > 0
																		? "bg-green-100 text-green-200"
																		: "bg-neutral-200 text-neutral-500",
																)}
															>
																<CreditCard className="size-3.5" />
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
													</TableCell>

													{/* Premium cell */}
													<TableCell>
														{user.isPremium ? (
															<div className="flex flex-col justify-center gap-2">
																<div className="flex w-fit items-center gap-1.5 rounded-full border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 px-2.5 py-1 shadow-xs">
																	<Crown className="size-3.5 text-amber-500" />
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
																				<Clock className="size-3" />
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
													</TableCell>

													{/* Created date cell */}
													<TableCell>
														{createdDate ? (
															<Tooltip>
																<TooltipTrigger asChild>
																	<span className="flex items-center gap-1.5 text-muted-foreground text-xs">
																		<CalendarDays className="size-3.5" />
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
													</TableCell>

													{/* Actions cell */}
													<TableCell className="pr-4 text-right">
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
													</TableCell>
												</TableRow>
											);
										})}
									</TooltipProvider>
								)}
							</TableBody>
						</Table>
					</div>

					{data && (
						<div className="border-t p-4">
							<PaginationButtons
								onPrevious={handlePrevious}
								onNext={handleNext}
								hasPrevious={cursorStack.length > 0}
								hasNext={!!data.nextCursor}
								showPageInfo={false}
							/>
						</div>
					)}
				</div>
			</AdminPageContent>
		</AdminPageRoot>
	);
}
