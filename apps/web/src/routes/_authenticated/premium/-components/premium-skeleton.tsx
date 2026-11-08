import { Skeleton } from "@/components/ui/skeleton";

export function PremiumSkeleton() {
	return (
		<div className="flex flex-col gap-8">
			{/* Header Skeleton */}
			<div className="rounded-default relative overflow-hidden bg-neutral-200">
				<div className="grid grid-cols-1 gap-6 px-6 pt-8 pb-0 sm:grid-cols-2 sm:items-center sm:px-10 sm:py-10">
					<div className="space-y-4">
						<Skeleton className="h-8 w-64 sm:h-10" />
						<Skeleton className="h-4 w-full max-w-md" />
						<Skeleton className="h-4 w-48" />
					</div>
					<div className="hidden sm:block">
						<Skeleton className="ml-auto h-40 w-40 rounded-full" />
					</div>
				</div>
			</div>

			{/* Plan Table Skeleton */}
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

			{/* Referral Skeleton */}
			<div className="bg-card flex flex-col gap-3 rounded-xl border p-4">
				<div className="flex flex-col gap-1">
					<Skeleton className="h-4 w-36" />
					<Skeleton className="h-3 w-64" />
				</div>
				<Skeleton className="h-10 w-full max-w-md rounded-md" />
			</div>
		</div>
	);
}
