import { Skeleton } from "@/components/ui/skeleton";

export function PlanTableSkeleton() {
	return (
		<div className="bg-card overflow-hidden rounded-xl border">
			<div className="grid grid-cols-4">
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className="flex flex-col gap-2 border-b border-l px-4 py-3 first:border-l-0">
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-6 w-24" />
						<Skeleton className="h-3 w-28" />
						<Skeleton className="mt-2 h-8 w-full rounded-md" />
					</div>
				))}
			</div>

			<div className="bg-muted/40 border-b px-4 py-2">
				<Skeleton className="h-4 w-32" />
			</div>

			{[1, 2, 3, 4, 5].map((row) => (
				<div key={row} className="grid grid-cols-4">
					<div className="border-b px-4 py-2">
						<Skeleton className="h-4 w-28" />
					</div>
					{[1, 2, 3].map((col) => (
						<div key={col} className="flex items-center justify-center border-b border-l px-4 py-2">
							<Skeleton className="size-3.5 rounded-full" />
						</div>
					))}
				</div>
			))}
		</div>
	);
}
