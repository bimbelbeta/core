import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Item } from "@/components/ui/item";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { orpc } from "@/lib/orpc";

interface SearchProgramTabProps {
	onProgramSelect: (program: { id: number; name: string }) => void;
}

export function SearchProgramTab({ onProgramSelect }: SearchProgramTabProps) {
	const [searchProgram, setSearchProgram] = useState("");

	const { data: searchResults, isLoading: isSearchLoading } = useQuery(
		orpc.admin.university.studyPrograms.list.queryOptions({
			input: {
				search: searchProgram,
				limit: 20,
			},
		}),
	);

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-3">
			<SearchInput
				value={searchProgram}
				onChange={setSearchProgram}
				placeholder="Cari program studi..."
				className="shrink-0"
				autoFocus
			/>
			<div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
				{isSearchLoading ? (
					Array.from({ length: 8 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: skeleton items
						<div key={i} className="flex items-center gap-3 rounded-md border px-3 py-2">
							<Skeleton className="h-4 flex-1" />
							<Skeleton className="h-4 w-16 shrink-0" />
						</div>
					))
				) : searchResults?.items?.length === 0 ? (
					<div className="flex flex-col items-center gap-2 py-8 text-center">
						<div className="bg-muted flex size-10 items-center justify-center rounded-lg">
							<MagnifyingGlassIcon className="text-muted-foreground size-5" />
						</div>
						<div>
							<Typography variant="body" className="font-medium">
								Tidak ditemukan
							</Typography>
							<Typography variant="caption">Coba kata kunci lain atau buat program studi baru.</Typography>
						</div>
					</div>
				) : searchResults?.items ? (
					searchResults.items.map((prog) => (
						<Item
							asChild
							key={prog.id}
							variant="outline"
							size="sm"
							className="group hover:border-primary/30 hover:bg-primary/5 w-full flex-nowrap gap-3 rounded-md px-3 py-2 text-left"
						>
							<button type="button" onClick={() => onProgramSelect({ id: prog.id, name: prog.name })}>
								<div className="min-w-0 flex-1">
									<Typography variant="body" as="span" className="block truncate font-medium">
										{prog.name}
									</Typography>
									{prog.description && (
										<Typography variant="caption" as="span" className="block truncate">
											{prog.description}
										</Typography>
									)}
								</div>
								<Badge variant="outline" className="text-meta shrink-0">
									{prog.category}
								</Badge>
							</button>
						</Item>
					))
				) : !searchProgram ? (
					<div className="flex flex-col items-center gap-2 py-8 text-center">
						<div className="bg-muted flex size-10 items-center justify-center rounded-lg">
							<MagnifyingGlassIcon className="text-muted-foreground size-5" />
						</div>
						<div>
							<Typography variant="body" className="font-medium">
								Cari program studi
							</Typography>
							<Typography variant="caption">Ketik nama program untuk mencari.</Typography>
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}
