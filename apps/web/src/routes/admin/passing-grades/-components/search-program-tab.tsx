import { BookOpenIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/utils/orpc";

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
					Array.from({ length: 3 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: skeleton items
						<div key={i} className="flex items-center gap-3 rounded-lg border px-4 py-3">
							<Skeleton className="size-8 shrink-0 rounded-md" />
							<div className="flex-1 space-y-1.5">
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-3 w-1/3" />
							</div>
						</div>
					))
				) : searchResults?.data?.length === 0 ? (
					<div className="flex flex-col items-center gap-2 py-8 text-center">
						<div className="flex size-10 items-center justify-center rounded-lg bg-muted">
							<MagnifyingGlassIcon className="size-5 text-muted-foreground" />
						</div>
						<div>
							<p className="font-medium text-sm">Tidak ditemukan</p>
							<p className="text-muted-foreground text-xs">Coba kata kunci lain atau buat program studi baru.</p>
						</div>
					</div>
				) : searchResults?.data ? (
					searchResults.data.map((prog) => (
						<button
							key={prog.id}
							type="button"
							className="group flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
							onClick={() => onProgramSelect({ id: prog.id, name: prog.name })}
						>
							<div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted transition-colors group-hover:bg-primary/10">
								<BookOpenIcon className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate font-medium text-sm">{prog.name}</p>
								{prog.description && <p className="truncate text-muted-foreground text-xs">{prog.description}</p>}
							</div>
							<Badge variant="outline" className="shrink-0 text-[10px]">
								{prog.category}
							</Badge>
						</button>
					))
				) : !searchProgram ? (
					<div className="flex flex-col items-center gap-2 py-8 text-center">
						<div className="flex size-10 items-center justify-center rounded-lg bg-muted">
							<BookOpenIcon className="size-5 text-muted-foreground" />
						</div>
						<div>
							<p className="font-medium text-sm">Cari program studi</p>
							<p className="text-muted-foreground text-xs">Ketik nama program untuk mencari.</p>
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}
