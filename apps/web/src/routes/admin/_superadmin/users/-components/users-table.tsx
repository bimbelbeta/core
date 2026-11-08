import { DotsThreeIcon, PencilSimpleIcon, PlusIcon, StarIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { AdminChip, AdminMeta, AdminStatus } from "@/components/admin/admin-status";
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
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableRowStack, tableRowLinkClass } from "@/components/ui/table-row-stack";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateLong, formatDateMedium, formatDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { useUsersList } from "../-hooks/use-users-list";
import { useUsersPagination } from "../-hooks/use-users-pagination";
import { formatPremiumExpiry, isValidRole, roleConfig } from "../-utils";
import { EditRoleDialog } from "./edit-role-dialog";
import { GrantCreditsDialog } from "./grant-credits-dialog";
import { GrantPremiumDialog } from "./grant-premium-dialog";

export function UsersTable() {
	const { data, isLoading, refetch } = useUsersList();
	const pageInfo = data?.pageInfo;
	const { handleNext, handlePrevious } = useUsersPagination();
	const [editRoleUserId, setEditRoleUserId] = useState<string | null>(null);
	const [grantCreditsUserId, setGrantCreditsUserId] = useState<string | null>(null);
	const [grantPremiumUserId, setGrantPremiumUserId] = useState<string | null>(null);

	return (
		<AdminTableRoot>
			<AdminTable className="table-fixed">
				<AdminTableHeader>
					<AdminTableHead className="w-[46%] pl-3">Nama</AdminTableHead>
					<AdminTableHead className="w-[17%]">Role</AdminTableHead>
					<AdminTableHead className="hidden w-[11%] text-right sm:table-cell">Kredit</AdminTableHead>
					<AdminTableHead className="hidden w-[20%] text-right sm:table-cell">Diperbarui</AdminTableHead>
					<AdminTableHead className="w-[6%] pr-3 text-right">
						<span className="sr-only">Aksi</span>
					</AdminTableHead>
				</AdminTableHeader>
				<AdminTableBody
					isLoading={isLoading}
					isEmpty={!isLoading && data?.items.length === 0}
					emptyMessage="Tidak ada user ditemukan."
					columns={5}
				>
					<TooltipProvider delayDuration={200}>
						{data?.items.map((user) => {
							const roleInfo = isValidRole(user.role) ? roleConfig[user.role] : roleConfig.user;
							const premiumDate = user.premiumExpiresAt ? new Date(user.premiumExpiresAt) : null;
							const isPremiumExpired = premiumDate ? premiumDate.getTime() < Date.now() : false;
							const updatedDate = new Date(user.updatedAt);

							return (
								<AdminTableRow key={user.id}>
									<AdminTableCell className="pl-3">
										<TableRowStack
											title={
												<Link to="/admin/users/$userId" params={{ userId: user.id }} className={tableRowLinkClass}>
													{user.name}
												</Link>
											}
											subtitle={
												<>
													<span className="truncate">{user.email}</span>
													{user.isPremium && (
														<Tooltip>
															<TooltipTrigger asChild>
																<AdminStatus
																	tone="positive"
																	className={cn(isPremiumExpired && "line-through decoration-1")}
																>
																	Premium
																</AdminStatus>
															</TooltipTrigger>
															<TooltipContent>
																{premiumDate
																	? `Berakhir ${formatPremiumExpiry(premiumDate)} · ${formatDateTime(premiumDate)}`
																	: "Premium aktif"}
															</TooltipContent>
														</Tooltip>
													)}
												</>
											}
										/>
									</AdminTableCell>

									<AdminTableCell>
										{roleInfo.tone === "neutral" ? (
											<AdminMeta>{roleInfo.label}</AdminMeta>
										) : (
											<AdminChip tone="accent">{roleInfo.label}</AdminChip>
										)}
									</AdminTableCell>

									<AdminTableCell className="hidden text-right sm:table-cell">
										<span className={cn("tabular-nums", !user.tryoutCredits && "text-muted-foreground")}>
											{user.tryoutCredits || "—"}
										</span>
									</AdminTableCell>

									<AdminTableCell className="text-muted-foreground text-meta hidden text-right whitespace-nowrap sm:table-cell">
										<Tooltip>
											<TooltipTrigger asChild>
												<span>{formatDateMedium(updatedDate)}</span>
											</TooltipTrigger>
											<TooltipContent>{formatDateLong(updatedDate)}</TooltipContent>
										</Tooltip>
									</AdminTableCell>

									<AdminTableCell className="relative z-10 pr-3 text-right">
										<EditRoleDialog
											userId={user.id}
											userName={user.name}
											currentRole={user.role}
											open={editRoleUserId === user.id}
											onOpenChange={(open) => setEditRoleUserId(open ? user.id : null)}
											onSuccess={() => refetch()}
										/>
										<GrantCreditsDialog
											userId={user.id}
											userName={user.name}
											currentCredits={user.tryoutCredits}
											open={grantCreditsUserId === user.id}
											onOpenChange={(open) => setGrantCreditsUserId(open ? user.id : null)}
											onSuccess={() => refetch()}
										/>
										<GrantPremiumDialog
											userId={user.id}
											userName={user.name}
											currentPremiumExpiry={user.premiumExpiresAt}
											open={grantPremiumUserId === user.id}
											onOpenChange={(open) => setGrantPremiumUserId(open ? user.id : null)}
											onSuccess={() => refetch()}
										/>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon-xs" aria-label={`Aksi untuk ${user.name}`}>
													<DotsThreeIcon className="size-4" weight="bold" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onSelect={() => setEditRoleUserId(user.id)}>
													<PencilSimpleIcon className="size-4" /> Ubah role
												</DropdownMenuItem>
												<DropdownMenuItem onSelect={() => setGrantCreditsUserId(user.id)}>
													<PlusIcon className="size-4" /> Tambah kredit
												</DropdownMenuItem>
												<DropdownMenuItem onSelect={() => setGrantPremiumUserId(user.id)}>
													<StarIcon className="size-4" /> Beri premium
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
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
						totalCount={pageInfo?.totalCount}
					/>
				</AdminTablePaginationWrapper>
			)}
		</AdminTableRoot>
	);
}
