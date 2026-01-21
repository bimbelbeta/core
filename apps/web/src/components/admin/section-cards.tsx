import { ArrowUpIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orpc } from "@/utils/orpc";

export function SectionCards() {
	const { data: stats, isLoading } = useQuery(orpc.admin.dashboard.stats.queryOptions());

	if (isLoading || !stats) {
		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{[1, 2, 3, 4].map((card) => (
					<Card key={card} className="@container/card">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="font-medium text-sm">Loading...</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">...</div>
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	const cards = [
		{
			title: "Total Pengguna",
			value: stats.totalUsers.toLocaleString(),
			trend: stats.usersTrend,
		},
		{
			title: "Pengguna Premium",
			value: stats.premiumUsers.toLocaleString(),
			trend: stats.premiumTrend,
		},
		{
			title: "Mata Pelajaran Aktif",
			value: stats.activeSubjects.toLocaleString(),
			trend: stats.subjectsTrend,
		},
		{
			title: "Pendapatan Bulan Ini",
			value: `Rp ${stats.monthlyRevenue.toLocaleString("id-ID")}`,
			trend: stats.revenueTrend,
		},
	];

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{cards.map((card) => (
				<Card key={card.title} className="@container/card">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">{card.title}</CardTitle>
						{card.trend > 0 && <ArrowUpIcon className="size-4 text-green-500" />}
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{card.value}</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
