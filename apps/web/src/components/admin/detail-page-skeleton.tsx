import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DetailPageSkeletonProps {
	variant: "question" | "tryout";
}

export function DetailPageSkeleton({ variant }: DetailPageSkeletonProps) {
	if (variant === "tryout") {
		return (
			<div className="flex h-full flex-col gap-6 p-6">
				<div className="flex items-center gap-4">
					<Skeleton className="size-10" />
					<Skeleton className="h-8 w-48" />
				</div>

				<div className="grid gap-6 lg:grid-cols-2">
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-40" />
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-6 w-full" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-6 w-full" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-6 w-32" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-6 w-32" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-4 w-28" />
								<Skeleton className="h-6 w-48" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-4 w-28" />
								<Skeleton className="h-6 w-48" />
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<Skeleton className="h-6 w-24" />
							<Skeleton className="h-9 w-32" />
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	// Question variant
	return (
		<div className="flex h-full flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Skeleton className="size-10" />
					<Skeleton className="h-8 w-48" />
				</div>
				<Skeleton className="h-9 w-20" />
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<Skeleton className="h-6 w-40" />
						<Skeleton className="h-6 w-24" />
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-2">
						<Skeleton className="h-4 w-28" />
						<Skeleton className="h-32 w-full" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-32" />
						<div className="space-y-3">
							<Skeleton className="h-16 w-full" />
							<Skeleton className="h-16 w-full" />
							<Skeleton className="h-16 w-full" />
							<Skeleton className="h-16 w-full" />
						</div>
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-24 w-full" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-16" />
						<div className="flex gap-2">
							<Skeleton className="h-6 w-20" />
							<Skeleton className="h-6 w-24" />
							<Skeleton className="h-6 w-16" />
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
