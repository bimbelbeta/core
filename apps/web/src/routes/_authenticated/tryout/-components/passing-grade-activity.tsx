import { SmileySadIcon } from "@phosphor-icons/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDebounceValue } from "@/hooks/use-debounce-value";
import { orpc } from "@/utils/orpc";

export function PassingGradeActivity() {
	const [searchQuery, setSearchQuery] = useState("");
	const debouncedSearchQuery = useDebounceValue(searchQuery, 1500);
	const scrollRef = useRef<HTMLDivElement>(null);

	const { data, isPending, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery(
		orpc.university.listPrograms.infiniteOptions({
			input: (pageParam) => ({
				after: pageParam,
				limit: 20,
				search: debouncedSearchQuery || undefined,
			}),
			getNextPageParam: (lastPage) => (lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.endCursor : undefined),
			initialPageParam: undefined as string | undefined,
		}),
	);

	const universities = data?.pages.flatMap((page) => page.items) ?? [];

	const handleScroll = useCallback(() => {
		const el = scrollRef.current;
		if (!el || isFetchingNextPage || !hasNextPage) return;
		if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
			fetchNextPage();
		}
	}, [isFetchingNextPage, hasNextPage, fetchNextPage]);

	return (
		<div>
			<Input
				type="text"
				placeholder="Filter"
				value={searchQuery}
				onChange={(e) => setSearchQuery(e.target.value)}
				className="mb-4 max-w-md bg-white"
			/>

			<div
				ref={scrollRef}
				onScroll={handleScroll}
				className="max-h-[600px] overflow-auto overflow-clip rounded-sm border border-input"
			>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Universitas</TableHead>
							<TableHead>Rank</TableHead>
							<TableHead>Skor</TableHead>
							<TableHead>Prodi</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isPending ? (
							<TableRow>
								<TableCell colSpan={4} className="text-center text-muted-foreground">
									<Skeleton className="h-8 w-full" />
								</TableCell>
							</TableRow>
						) : universities.length === 0 ? (
							<TableRow>
								<TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
									Gagal menemukan Prodi/Universitas. Silahkan coba kata kunci lain. <SmileySadIcon className="inline" />
								</TableCell>
							</TableRow>
						) : (
							<>
								{universities.map((university) => (
									<TableRow key={`${university.id}-${university.studyProgram}`}>
										<TableCell>{university.name}</TableCell>
										<TableCell>{university.rank}</TableCell>
										<TableCell>{university.score}</TableCell>
										<TableCell>{university.studyProgram}</TableCell>
									</TableRow>
								))}
								{isFetchingNextPage && (
									<TableRow>
										<TableCell colSpan={4} className="text-center text-muted-foreground">
											<Skeleton className="mx-auto h-4 w-32" />
										</TableCell>
									</TableRow>
								)}
							</>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
