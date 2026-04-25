import { CalendarDotsIcon, ChartBarIcon, TimerIcon, UserIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useState } from "react";
import { PaginationButtons } from "@/components/admin/pagination-buttons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

function getInitials(name: string) {
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

function formatRelativeDate(date: Date) {
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));

	if (days === 0) {
		const hours = Math.floor(diff / (1000 * 60 * 60));
		if (hours === 0) {
			const minutes = Math.floor(diff / (1000 * 60));
			return minutes === 0 ? "Baru saja" : `${minutes} menit lalu`;
		}
		return `${hours} jam lalu`;
	}
	if (days === 1) return "Kemarin";
	if (days < 7) return `${days} hari lalu`;
	return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

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
	const tableColumnCount = 6 + subtests.length;

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
					className: "bg-amber-100 text-amber-800 border-amber-200",
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

	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-center gap-2">
					<UserIcon className="size-4 text-muted-foreground" />
					<CardTitle className="text-base">Daftar Attempts</CardTitle>
				</div>
				<CardDescription>Riwayat pengerjaan tryout oleh user</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="overflow-clip rounded-lg border bg-white shadow-sm">
					<Table>
						<TableHeader>
							<TableRow className="bg-muted/30">
								<TableHead className="w-12 pl-4 text-center">No</TableHead>
								<TableHead>User</TableHead>
								<TableHead className="w-28">Status</TableHead>
								<TableHead className="w-24">Skor</TableHead>
								{subtests.map((subtest) => (
									<TableHead key={subtest.id} className="min-w-28">
										{subtest.name}
									</TableHead>
								))}
								<TableHead className="w-36">Mulai</TableHead>
								<TableHead className="w-36 pr-4">Selesai</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isPending ? (
								<TableSkeleton columns={tableColumnCount} />
							) : data?.items.length === 0 ? (
								<TableRow>
									<TableCell colSpan={tableColumnCount} className="h-48">
										<Empty>
											<EmptyHeader>
												<EmptyMedia variant="icon">
													<UserIcon />
												</EmptyMedia>
												<EmptyTitle>Belum ada attempt</EmptyTitle>
												<EmptyDescription>Belum ada user yang mengerjakan tryout ini.</EmptyDescription>
											</EmptyHeader>
										</Empty>
									</TableCell>
								</TableRow>
							) : (
								<TooltipProvider delayDuration={200}>
									{data?.items.map(({ attempt, user, subtestAttempts }, index) => {
										const statusConfig = getStatusConfig(attempt.status);
										const startedAt = attempt.startedAt ? new Date(attempt.startedAt) : null;
										const completedAt = attempt.completedAt ? new Date(attempt.completedAt) : null;
										const subtestScoreMap = new Map(
											subtestAttempts.map((subtestAttempt) => [subtestAttempt.subtestId, subtestAttempt.score]),
										);

										return (
											<TableRow key={attempt.id} className="hover:bg-muted/30">
												<TableCell className="pl-4 text-center">
													<div className="mx-auto flex size-6 items-center justify-center rounded-full bg-muted font-medium font-mono text-xs">
														{index + 1}
													</div>
												</TableCell>

												<TableCell>
													<div className="flex items-center gap-3">
														<Avatar className="size-9 rounded-full ring-2 ring-border">
															<AvatarImage src={user.image ?? undefined} alt={user.name} />
															<AvatarFallback className="bg-primary-100 font-semibold text-primary-700 text-xs">
																{getInitials(user.name)}
															</AvatarFallback>
														</Avatar>
														<div className="flex flex-col">
															<span className="font-semibold text-foreground leading-tight">{user.name}</span>
															<span className="text-muted-foreground text-xs leading-tight">{user.email}</span>
														</div>
													</div>
												</TableCell>

												<TableCell>
													<Badge
														variant={statusConfig.variant}
														className={cn("font-medium text-xs", statusConfig.className)}
													>
														{statusConfig.label}
													</Badge>
												</TableCell>

												<TableCell>
													<div className="flex items-center gap-1.5">
														<ChartBarIcon className="size-3.5 text-muted-foreground" />
														<span
															className={cn(
																"font-semibold text-sm tabular-nums",
																attempt.score == null ? "text-muted-foreground" : "text-foreground",
															)}
														>
															{attempt.score ?? "-"}
														</span>
													</div>
												</TableCell>

												{subtests.map((subtest) => {
													const subtestScore = subtestScoreMap.get(subtest.id);
													return (
														<TableCell key={subtest.id}>
															<span
																className={cn(
																	"font-semibold text-sm tabular-nums",
																	subtestScore == null ? "text-muted-foreground" : "text-foreground",
																)}
															>
																{subtestScore ?? "-"}
															</span>
														</TableCell>
													);
												})}

												<TableCell>
													{startedAt ? (
														<Tooltip>
															<TooltipTrigger asChild>
																<span className="flex items-center gap-1.5 text-muted-foreground text-xs">
																	<CalendarDotsIcon className="size-3.5" />
																	{formatRelativeDate(startedAt)}
																</span>
															</TooltipTrigger>
															<TooltipContent>
																{startedAt.toLocaleString("id-ID", {
																	day: "numeric",
																	month: "long",
																	year: "numeric",
																	hour: "2-digit",
																	minute: "2-digit",
																})}
															</TooltipContent>
														</Tooltip>
													) : (
														<span className="text-muted-foreground text-xs">-</span>
													)}
												</TableCell>

												<TableCell className="pr-4">
													{completedAt ? (
														<Tooltip>
															<TooltipTrigger asChild>
																<span className="flex items-center gap-1.5 text-muted-foreground text-xs">
																	<TimerIcon className="size-3.5" />
																	{formatRelativeDate(completedAt)}
																</span>
															</TooltipTrigger>
															<TooltipContent>
																{completedAt.toLocaleString("id-ID", {
																	day: "numeric",
																	month: "long",
																	year: "numeric",
																	hour: "2-digit",
																	minute: "2-digit",
																})}
															</TooltipContent>
														</Tooltip>
													) : (
														<span className="text-muted-foreground text-xs">-</span>
													)}
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
					<div className="mt-4">
						<PaginationButtons
							onPrevious={handlePrevious}
							onNext={handleNext}
							hasPrevious={!!pageInfo?.hasPreviousPage}
							hasNext={!!pageInfo?.hasNextPage}
						/>
					</div>
				)}
			</CardContent>
		</Card>
	);
};
