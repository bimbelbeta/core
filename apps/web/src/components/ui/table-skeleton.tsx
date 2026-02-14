import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

interface TableSkeletonProps {
	columns: number;
	rows?: number;
}

export function TableSkeleton({ columns, rows = 5 }: TableSkeletonProps) {
	return (
		<>
			{Array.from({ length: rows }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: simple skeleton loader
				<TableRow key={i} className="hover:bg-transparent">
					{Array.from({ length: columns }).map((_, j) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: simple skeleton loader
						<TableCell key={`skeleton-cell-${i}-${j}`}>
							<Skeleton className="h-6 w-full" />
						</TableCell>
					))}
				</TableRow>
			))}
		</>
	);
}
