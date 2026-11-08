import { CalendarDotsIcon, ChartBarIcon, TimerIcon, UserIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useState } from "react";
import { AdminSection } from "@/components/admin/admin-page";
import {
	AdminTable,
	AdminTableBody,
	AdminTableCell,
	AdminTableHead,
	AdminTableHeader,
	AdminTableRoot,
	AdminTableRow,
} from "@/components/admin/admin-table";
import { PaginationButtons } from "@/components/admin/pagination-buttons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateTime, formatRelativeDate } from "@/lib/format-date";
import { getInitials } from "@/lib/formatter";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";

interface TryoutAttemptsTabProps {
	subtests: {
		id: number;
		name: string;
	}[];
}

export const TryoutAttemptsTab = ({ subtests }: TryoutAttemptsTabProps) => {
	const { tryoutId: id } = useParams({ from: "/admin/tryouts/$tryoutId/" });

	const [after, setAfter] = useState<string | undefined>();
	const [before, setBefore] = useState<string | undefined>();

	const { data, isPending } = useQuery(
		orpc.admin.tryout.attempts.list.queryOptions({
			input: {
				id: Number(id),
				after,
				before,
				limit: 10,
			},
		}),
	);

	const pageInfo = data?.pageInfo;
	const tableColumnCount = 5 + subtests.length;

	const getStatusConfig = (status: string) => {
		switch (status) {
			case "finished":
				return {
					variant: "default" as const,
					label: "Selesai",
					className: "bg-green-100 text-green-800 border-green-200",
				};
			case "ongoing":
				return {
					variant: "secondary" as const,
					label: "Berlangsung",
					className: "bg-yellow-100 text-yellow-800 border-yellow-300/70",
				};
			default:
				return { variant: "outline" as const, label: "Belum Mulai", className: "" };
		}
	};

	const handleNext = () => {
		if (!pageInfo?.endCursor) return;
		setAfter(pageInfo.endCursor);
		setBefore(undefined);
	};

	const handlePrevious = () => {
		if (!pageInfo?.startCursor) return;
		setBefore(pageInfo.startCursor);
		setAfter(undefined);
	};

	const isEmpty = !isPending && data?.items.length === 0;

	return (
		<AdminSection title="Daftar percobaan" description="Riwayat pengerjaan tryout oleh peserta">
			{isEmpty ? (
				<AdminTableRoot>
					<Empty className="min-h-48">
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<UserIcon />
							</EmptyMedia>
							<EmptyTitle>Belum ada percobaan</EmptyTitle>
							<EmptyDescription>
								Belum ada peserta yang mengerjakan tryout ini. Bagikan kode akses agar peserta bisa mulai.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				</AdminTableRoot>
			) : (
				<AdminTableRoot>
					<AdminTable>
						<AdminTableHeader>
							<AdminTableHead>User</AdminTableHead>
							<AdminTableHead className="w-28">Status</AdminTableHead>
							<AdminTableHead className="w-24">Skor</AdminTableHead>
							{subtests.map((subtest) => (
								<AdminTableHead key={subtest.id} className="min-w-28">
									{subtest.name}
								</AdminTableHead>
							))}
							<AdminTableHead className="w-36">Mulai</AdminTableHead>
							<AdminTableHead className="w-36 pr-3">Selesai</AdminTableHead>
						</AdminTableHeader>
						<AdminTableBody columns={tableColumnCount}>
							{isPending ? (
								<TableSkeleton columns={tableColumnCount} />
							) : (
								<TooltipProvider delayDuration={200}>
									{data?.items.map(({ attempt, user, subtestAttempts }) => {
										const statusConfig = getStatusConfig(attempt.status);
										const startedAt = attempt.startedAt ? new Date(attempt.startedAt) : null;
										const completedAt = attempt.completedAt ? new Date(attempt.completedAt) : null;
										const subtestScoreMap = new Map(
											subtestAttempts.map((subtestAttempt) => [subtestAttempt.subtestId, subtestAttempt.score]),
										);

										return (
											<AdminTableRow key={attempt.id}>
												<AdminTableCell>
													<div className="flex items-center gap-3">
														<Avatar className="ring-border size-8 rounded-full ring-2">
															<AvatarImage src={user.image ?? undefined} alt={user.name} />
															<AvatarFallback className="bg-primary-100 text-primary-800 text-meta font-semibold">
																{getInitials(user.name)}
															</AvatarFallback>
														</Avatar>
														<div className="flex flex-col">
															<span className="text-foreground leading-tight font-semibold">{user.name}</span>
															<span className="text-muted-foreground text-meta leading-tight">{user.email}</span>
														</div>
													</div>
												</AdminTableCell>

												<AdminTableCell>
													<Badge
														variant={statusConfig.variant}
														className={cn("text-meta font-medium", statusConfig.className)}
													>
														{statusConfig.label}
													</Badge>
												</AdminTableCell>

												<AdminTableCell>
													<div className="flex items-center gap-1.5">
														<ChartBarIcon className="text-muted-foreground size-3.5" />
														<span
															className={cn(
																"text-row-title tabular-nums",
																attempt.score == null ? "text-muted-foreground" : "text-foreground",
															)}
														>
															{attempt.score ?? "-"}
														</span>
													</div>
												</AdminTableCell>

												{subtests.map((subtest) => {
													const subtestScore = subtestScoreMap.get(subtest.id);
													return (
														<AdminTableCell key={subtest.id}>
															<span
																className={cn(
																	"text-row-title tabular-nums",
																	subtestScore == null ? "text-muted-foreground" : "text-foreground",
																)}
															>
																{subtestScore ?? "-"}
															</span>
														</AdminTableCell>
													);
												})}

												<AdminTableCell>
													{startedAt ? (
														<Tooltip>
															<TooltipTrigger asChild>
																<span className="text-muted-foreground text-meta flex items-center gap-1.5">
																	<CalendarDotsIcon className="size-3.5" />
																	{formatRelativeDate(startedAt)}
																</span>
															</TooltipTrigger>
															<TooltipContent>{formatDateTime(startedAt)}</TooltipContent>
														</Tooltip>
													) : (
														<span className="text-muted-foreground text-meta">-</span>
													)}
												</AdminTableCell>

												<AdminTableCell className="pr-3">
													{completedAt ? (
														<Tooltip>
															<TooltipTrigger asChild>
																<span className="text-muted-foreground text-meta flex items-center gap-1.5">
																	<TimerIcon className="size-3.5" />
																	{formatRelativeDate(completedAt)}
																</span>
															</TooltipTrigger>
															<TooltipContent>{formatDateTime(completedAt)}</TooltipContent>
														</Tooltip>
													) : (
														<span className="text-muted-foreground text-meta">-</span>
													)}
												</AdminTableCell>
											</AdminTableRow>
										);
									})}
								</TooltipProvider>
							)}
						</AdminTableBody>
					</AdminTable>
				</AdminTableRoot>
			)}

			{data && (
				<PaginationButtons
					onPrevious={handlePrevious}
					onNext={handleNext}
					hasPrevious={!!pageInfo?.hasPreviousPage}
					hasNext={!!pageInfo?.hasNextPage}
				/>
			)}
		</AdminSection>
	);
};
