import { Skeleton } from "@/components/ui/skeleton";
import { AdminPageContent, AdminPageHeader, AdminPageHeaderContent, AdminPageRoot } from "./admin-page";

export function DetailPageSkeleton() {
	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-7 w-48" />
				</AdminPageHeaderContent>
			</AdminPageHeader>
			<AdminPageContent>
				<div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_14rem]">
					<div className="flex flex-col gap-5">
						<div className="flex flex-col gap-4">
							<Skeleton className="h-4 w-28" />
							<Skeleton className="h-24 w-full" />
						</div>
						<div className="flex flex-col gap-4">
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
						<div className="flex flex-col gap-4">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-20 w-full" />
						</div>
					</div>
					<div className="flex flex-col gap-5">
						<div className="flex flex-col gap-4">
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-16 w-full" />
						</div>
						<div className="flex flex-col gap-4">
							<Skeleton className="h-4 w-12" />
							<Skeleton className="h-6 w-full" />
						</div>
					</div>
				</div>
			</AdminPageContent>
		</AdminPageRoot>
	);
}
