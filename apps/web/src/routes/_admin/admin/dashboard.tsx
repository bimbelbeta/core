import { Package, Question, Users } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_admin/admin/dashboard")({
	component: AdminDashboard,
});

function AdminDashboard() {
	const { data: stats, isLoading } = useQuery(orpc.admin.practicePack.getStatistics.queryOptions());

	return (
		<main className="flex-1 p-4 pt-20 lg:ml-64 lg:p-8 lg:pt-8">
			<div className="mb-6 sm:mb-8">
				<h1 className="font-bold text-2xl tracking-tight sm:text-3xl">Admin Dashboard</h1>
				<p className="text-muted-foreground text-sm sm:text-base">Selamat datang di panel admin bimbelbeta</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
				<StatsCard
					title="Total Users"
					value={stats?.totalUsers}
					isLoading={isLoading}
					icon={Users}
					className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background"
					iconClassName="text-blue-500"
				/>
				<StatsCard
					title="Practice Packs"
					value={stats?.totalPracticePacks}
					isLoading={isLoading}
					icon={Package}
					className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background"
					iconClassName="text-purple-500"
				/>
				<StatsCard
					title="Total Questions"
					value={stats?.totalQuestions}
					isLoading={isLoading}
					icon={Question}
					className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background"
					iconClassName="text-orange-500"
				/>
			</div>
		</main>
	);
}

function StatsCard({
	title,
	value,
	isLoading,
	icon: Icon,
	className,
	iconClassName,
}: {
	title: string;
	value?: number;
	isLoading: boolean;
	icon: React.ElementType;
	className?: string;
	iconClassName?: string;
}) {
	return (
		<Card className={`overflow-hidden transition-all hover:shadow-md ${className}`}>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="font-medium text-muted-foreground text-sm">{title}</CardTitle>
				<Icon className={`size-4 ${iconClassName}`} weight="bold" />
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<Skeleton className="h-8 w-20" />
				) : (
					<div className="font-bold text-2xl sm:text-3xl">{value?.toLocaleString() || 0}</div>
				)}
			</CardContent>
		</Card>
	);
}
