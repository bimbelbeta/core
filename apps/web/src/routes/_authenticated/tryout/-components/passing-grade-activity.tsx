import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function PassingGradeActivity() {
	const [searchQuery, setSearchQuery] = useState("");

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
						<TableRow>
							<TableCell colSpan={4} className="text-center text-muted-foreground">
								No data available
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
