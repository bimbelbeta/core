import { CalendarDotsIcon, ClockIcon, CreditCardIcon, CrownIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
	AdminTable,
	AdminTableBody,
	AdminTableCell,
	AdminTableHead,
	AdminTableHeader,
	AdminTableRoot,
	AdminTableRow,
} from "@/components/admin/admin-table";
import { AdminTablePaginationWrapper } from "@/components/admin/admin-table-toolbar";
import { PaginationButtons } from "@/components/admin/pagination-buttons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useUsersList } from "../-hooks/use-users-list";
import { useUsersNavigation } from "../-hooks/use-users-navigation";
import { useUsersSelection } from "../-hooks/use-users-selection";
import { formatPremiumExpiry, formatRelativeDate, getInitials, isValidRole, roleConfig } from "../-utils";
import { EditRoleDialog } from "./edit-role-dialog";
import { GrantCreditsDialog } from "./grant-credits-dialog";
import { GrantPremiumDialog } from "./grant-premium-dialog";

export function UsersTable() {
	const { data, isLoading, refetch } = useUsersList();
	const pageInfo = data?.pageInfo;
	const { handleNext, handlePrevious } = useUsersNavigation();
	const { selectedIds, allSelected, someSelected, toggleSelectAll, toggleSelectOne } = useUsersSelection();
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

	return (
		<AdminTableRoot className="mt-3">
			<AdminTable>
				<AdminTableHeader>
					<AdminTableHead className="w-12 pl-4">
						<Checkbox
							checked={someSelected ? "indeterminate" : allSelected}
							onCheckedChange={toggleSelectAll}
							aria-label="Select all"
						/>
					</AdminTableHead>
					<AdminTableHead>Nama</AdminTableHead>
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
					columns={7}
				>
					<TooltipProvider delayDuration={200}>
						{data?.items.map((user) => {
							const roleInfo = isValidRole(user.role) ? roleConfig[user.role] : roleConfig.user;
							const RoleIcon = roleInfo.icon;
							const premiumDate = user.premiumExpiresAt ? new Date(user.premiumExpiresAt) : null;
							const isPremiumExpired = premiumDate ? premiumDate.getTime() < Date.now() : false;
							const createdDate = user.createdAt ? new Date(user.createdAt) : null;

							return (
								<AdminTableRow key={user.id}>
									<AdminTableCell className="pl-4">
										<Checkbox
											checked={selectedIds.includes(user.id)}
											onCheckedChange={() => toggleSelectOne(user.id)}
											aria-label={`Select user ${user.id}`}
										/>
									</AdminTableCell>
									<AdminTableCell>
										<div className="flex items-center gap-3">
											<Avatar className="ring-border size-9 rounded-full ring-2">
												<AvatarImage src={user.image ?? undefined} alt={user.name} />
												<AvatarFallback className="bg-primary-100 text-primary-700 text-xs font-semibold">
													{getInitials(user.name)}
												</AvatarFallback>
											</Avatar>
											<div className="flex flex-col">
												<Link
													to="/admin/users/$userId"
													params={{ userId: user.id }}
													className="text-foreground hover:text-primary leading-tight font-semibold transition-colors"
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
											className={cn("gap-1 py-0.5 text-[11px] font-semibold", roleInfo.className)}
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
													"text-sm font-semibold tabular-nums",
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
													<span className="text-xs font-bold tracking-wide text-amber-700">PREMIUM</span>
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
											<span className="text-muted-foreground flex items-center gap-1.5 text-xs">
												<span className="inline-block size-1.5 rounded-full bg-neutral-400" />
												Non-Premium
											</span>
										)}
									</AdminTableCell>

									<AdminTableCell>
										{createdDate ? (
											<Tooltip>
												<TooltipTrigger asChild>
													<span className="text-muted-foreground flex items-center gap-1.5 text-xs">
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
										<div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
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
	);
}
