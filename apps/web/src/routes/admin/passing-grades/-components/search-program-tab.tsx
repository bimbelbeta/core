import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
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
		<div className="grid gap-4 py-4">
			<SearchInput value={searchProgram} onChange={setSearchProgram} placeholder="Cari program studi..." autoFocus />
			<div className="flex max-h-75 flex-col gap-2 overflow-y-auto">
				{isSearchLoading ? (
					<p className="p-2 text-center text-muted-foreground text-sm">Mencari...</p>
				) : searchResults?.data?.length === 0 ? (
					<p className="p-2 text-center text-muted-foreground text-sm">Tidak ada program ditemukan.</p>
				) : (
					searchResults?.data?.map((prog) => (
						<Button
							key={prog.id}
							variant="outline"
							className="h-auto justify-start py-3 text-left"
							onClick={() => onProgramSelect({ id: prog.id, name: prog.name })}
						>
							<div className="flex flex-col">
								<span className="font-medium">{prog.name}</span>
								<span className="text-muted-foreground text-xs">{prog.category}</span>
							</div>
						</Button>
					))
				)}
				{!searchProgram && (
					<p className="p-2 text-center text-muted-foreground text-sm">Ketik untuk mencari program.</p>
				)}
			</div>
		</div>
	);
}
