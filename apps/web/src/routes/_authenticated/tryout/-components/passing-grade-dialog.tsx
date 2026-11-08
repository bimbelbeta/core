import { GraduationCapIcon, MedalIcon, SmileySadIcon } from "@phosphor-icons/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { SearchInput } from "@/components/ui/search-input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableRowStack } from "@/components/ui/table-row-stack";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";

const RANK_MEDALS: Partial<Record<number, string>> = {
	1: "text-amber-500",
	2: "text-neutral-400",
	3: "text-amber-700",
};

export function PassingGradeDialog({ className }: { className?: string }) {
	const [searchQuery, setSearchQuery] = useState("");
	const scrollRef = useRef<HTMLDivElement>(null);

	const { data, isPending, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery(
		orpc.university.listPrograms.infiniteOptions({
			input: (pageParam) => ({
				after: pageParam,
				limit: 20,
				search: searchQuery || undefined,
			}),
			getNextPageParam: (lastPage) => (lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.endCursor : undefined),
			initialPageParam: undefined as string | undefined,
		}),
	);

	const programs = data?.pages.flatMap((page) => page.items) ?? [];

	const handleScroll = useCallback(() => {
		const el = scrollRef.current;
		if (!el || isFetchingNextPage || !hasNextPage) return;
		if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
			fetchNextPage();
		}
	}, [isFetchingNextPage, hasNextPage, fetchNextPage]);

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm" className={className}>
					<GraduationCapIcon weight="bold" />
					Cek Passing Grade
				</Button>
			</DialogTrigger>

			<DialogContent size="lg" className="flex h-[85vh] flex-col sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>Passing Grade</DialogTitle>
					<DialogDescription>Referensi skor terakhir untuk universitas dan prodi tujuanmu.</DialogDescription>
				</DialogHeader>

				<SearchInput
					value={searchQuery}
					onChange={setSearchQuery}
					placeholder="Cari universitas atau prodi..."
					aria-label="Cari universitas atau prodi"
					debounceMs={300}
					autoFocus
				/>

				<div
					ref={scrollRef}
					onScroll={handleScroll}
					className="border-input min-h-0 flex-1 overflow-auto rounded-xl border bg-white"
				>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="text-meta h-9 px-3">Universitas</TableHead>
								<TableHead className="text-meta h-9 px-3">Rank</TableHead>
								<TableHead className="text-meta h-9 px-3">Skor</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isPending ? (
								<TableSkeleton columns={3} />
							) : programs.length === 0 ? (
								<TableRow>
									<TableCell colSpan={3} className="text-muted-foreground h-20 text-center">
										Gagal menemukan Prodi/Universitas. Silakan coba kata kunci lain.{" "}
										<SmileySadIcon className="inline" />
									</TableCell>
								</TableRow>
							) : (
								<>
									{programs.map((program) => (
										<TableRow key={`${program.id}-${program.studyProgram}`}>
											<TableCell className="px-3 py-1.5">
												<TableRowStack title={program.name} subtitle={program.studyProgram} />
											</TableCell>
											<TableCell className="px-3 py-1.5">
												<div className="flex items-center gap-1.5 tabular-nums">
													<MedalIcon
														weight="fill"
														className={cn("size-4", RANK_MEDALS[program.rank ?? 0] ?? "invisible")}
													/>
													{program.rank}
												</div>
											</TableCell>
											<TableCell className="px-3 py-1.5 tabular-nums">{program.score}</TableCell>
										</TableRow>
									))}
									{isFetchingNextPage && <TableSkeleton columns={3} rows={2} />}
								</>
							)}
						</TableBody>
					</Table>
				</div>
			</DialogContent>
		</Dialog>
	);
}
