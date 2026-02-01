import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export function PremiumSkeleton() {
	return (
		<Container className="space-y-8">
			{/* Header Skeleton */}
			<div className="relative overflow-hidden rounded-default bg-neutral-200">
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

			{/* Packages Section Skeleton */}
			<div className="space-y-6">
				<div className="text-center">
					<Skeleton className="mx-auto mb-2 h-8 w-48" />
					<Skeleton className="mx-auto h-4 w-full max-w-lg" />
				</div>

				{/* Premium Cards Skeleton - 2 columns */}
				<div className="grid gap-4 md:grid-cols-2">
					{[1, 2].map((i) => (
						<div key={i} className="flex h-full flex-col rounded-default border border-neutral-200 bg-neutral-100 p-6">
							<Skeleton className="mb-4 h-6 w-24" />
							<Skeleton className="mb-4 h-8 w-32" />
							<Skeleton className="mb-4 h-4 w-full" />
							<Skeleton className="mb-4 h-4 w-3/4" />
							<Skeleton className="mt-auto h-10 w-full rounded-lg" />
						</div>
					))}
				</div>

				{/* Credits Cards Skeleton - 4 columns */}
				<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
					{[1, 2, 3, 4].map((i) => (
						<div key={i} className="flex h-full flex-col rounded-default border border-neutral-200 bg-neutral-100 p-5">
							<Skeleton className="mb-2 h-5 w-28" />
							<Skeleton className="mb-4 h-6 w-24" />
							<Skeleton className="mb-2 h-4 w-full" />
							<Skeleton className="mb-4 h-4 w-3/4" />
							<Skeleton className="mt-auto h-9 w-full rounded-lg" />
						</div>
					))}
				</div>
			</div>

			{/* Credit Balance Card Skeleton */}
			<Card className="border-amber-200 bg-amber-50 p-6">
				<div className="flex items-center gap-4">
					<Skeleton className="h-12 w-12 shrink-0 rounded-full" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-5 w-40" />
						<Skeleton className="h-4 w-full max-w-sm" />
					</div>
				</div>
			</Card>
		</Container>
	);
}
