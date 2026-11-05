import { ArrowUpIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCount, formatRupiah } from "@/lib/formatter";
import { orpc } from "@/lib/orpc";

export function SectionCards() {
	const { data: stats, isLoading } = useQuery(orpc.admin.dashboard.stats.queryOptions());

	if (isLoading || !stats) {
		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{[1, 2, 3, 4].map((card) => (
					<Card key={card} className="@container/card">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<Skeleton className="h-4 w-24" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-32" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	const cards = [
		{
			title: "Total Pengguna",
			value: formatCount(stats.totalUsers),
			trend: stats.usersTrend,
		},
		{
			title: "Pengguna Premium",
			value: formatCount(stats.premiumUsers),
			trend: stats.premiumTrend,
		},
		{
			title: "Mata Pelajaran Aktif",
			value: formatCount(stats.activeSubjects),
			trend: stats.subjectsTrend,
		},
		{
			title: "Pendapatan Bulan Ini",
			value: formatRupiah(stats.monthlyRevenue),
			trend: stats.revenueTrend,
		},
	];

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{cards.map((card) => (
				<Card key={card.title} className="@container/card">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">{card.title}</CardTitle>
						{card.trend > 0 && <ArrowUpIcon className="size-4 text-green-500" />}
					</CardHeader>
					<CardContent className="mt-auto">
						<div className="mt-auto text-2xl font-bold">{card.value}</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
