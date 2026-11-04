import { BookOpenIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
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
				limit: 5,
			},
		}),
	);

	return (
		<div className="space-y-3">
			<SearchInput value={searchProgram} onChange={setSearchProgram} placeholder="Cari program studi..." autoFocus />
			<div className="flex max-h-[280px] flex-col gap-1.5 overflow-y-auto">
				{isSearchLoading ? (
					Array.from({ length: 5 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: skeleton items
						<div key={i} className="flex items-center gap-3 rounded-lg border px-4 py-3">
							<Skeleton className="size-8 shrink-0 rounded-md" />
							<div className="flex-1 space-y-1.5">
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-3 w-1/3" />
							</div>
						</div>
					))
				) : searchResults?.items?.length === 0 ? (
					<div className="flex flex-col items-center gap-2 py-8 text-center">
						<div className="bg-muted flex size-10 items-center justify-center rounded-lg">
							<MagnifyingGlassIcon className="text-muted-foreground size-5" />
						</div>
						<div>
							<p className="text-sm font-medium">Tidak ditemukan</p>
							<p className="text-muted-foreground text-xs">Coba kata kunci lain atau buat program studi baru.</p>
						</div>
					</div>
				) : searchResults?.items ? (
					searchResults.items.map((prog) => (
						<button
							key={prog.id}
							type="button"
							className="group hover:border-primary/30 hover:bg-primary/5 flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors"
							onClick={() => onProgramSelect({ id: prog.id, name: prog.name })}
						>
							<div className="bg-muted group-hover:bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-md transition-colors">
								<BookOpenIcon className="text-muted-foreground group-hover:text-primary size-4 transition-colors" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium">{prog.name}</p>
								{prog.description && <p className="text-muted-foreground truncate text-xs">{prog.description}</p>}
							</div>
							<Badge variant="outline" className="shrink-0 text-[10px]">
								{prog.category}
							</Badge>
						</button>
					))
				) : !searchProgram ? (
					<div className="flex flex-col items-center gap-2 py-8 text-center">
						<div className="bg-muted flex size-10 items-center justify-center rounded-lg">
							<BookOpenIcon className="text-muted-foreground size-5" />
						</div>
						<div>
							<p className="text-sm font-medium">Cari program studi</p>
							<p className="text-muted-foreground text-xs">Ketik nama program untuk mencari.</p>
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}
