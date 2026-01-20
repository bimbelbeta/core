import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { orpc } from "@/utils/orpc";
import { SmileySadIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export function PassingGradeActivity() {
	const [searchQuery, setSearchQuery] = useState("");
	const { data: universities, isPending } = useQuery(
		orpc.university.list.queryOptions({
			input: {
				search: searchQuery,
			},
		}),
	);

	return (
		<div>
			<Input
				type="text"
				placeholder="Filter"
				value={searchQuery}
				onChange={(e) => setSearchQuery(e.target.value)}
				className="mb-4 max-w-md selection:bg-background"
			/>

			<div className="overflow-clip rounded-sm border border-input">
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
						) : universities?.data.length === 0 ? (
							<TableRow>
								<TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
									Belum terdapat data Passing Grade. <SmileySadIcon className="inline" />
								</TableCell>
							</TableRow>
						) : (
							universities?.data.map((university) => (
								<TableRow key={`${university.id}-${university.studyProgram}`}>
									<TableCell>{university.name}</TableCell>
									<TableCell>{university.rank}</TableCell>
									<TableCell>{university.score}</TableCell>
									<TableCell>{university.studyProgram}</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
