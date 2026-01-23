import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/utils/orpc";

export function ChartAreaInteractive() {
	const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

	const { data: analytics, isLoading } = useQuery(
		orpc.admin.dashboard.analytics.queryOptions({
			input: { days: timeRange === "90d" ? 90 : timeRange === "30d" ? 30 : 7 },
		}),
	);

	if (isLoading || !analytics) {
		return (
			<Card className="@container/card">
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Pendapatan</CardTitle>
						<Select value={timeRange} onValueChange={(val) => setTimeRange(val as typeof timeRange)}>
							<SelectTrigger className="w-40">
								<SelectValue placeholder="30 hari" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="7d">7 hari</SelectItem>
								<SelectItem value="30d">30 hari</SelectItem>
								<SelectItem value="90d">90 hari</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardHeader>
				<CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
					<Skeleton className="h-[250px] w-full" />
				</CardContent>
			</Card>
		);
	}

	if (analytics.revenueData.length === 0) {
		return (
			<Card className="@container/card">
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Pendapatan</CardTitle>
						<Select value={timeRange} onValueChange={(val) => setTimeRange(val as typeof timeRange)}>
							<SelectTrigger className="w-40">
								<SelectValue placeholder="30 hari" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="7d">7 hari</SelectItem>
								<SelectItem value="30d">30 hari</SelectItem>
								<SelectItem value="90d">90 hari</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardHeader>
				<CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
					<div className="flex h-[250px] items-center justify-center text-muted-foreground">
						Tidak ada data pendapatan
					</div>
				</CardContent>
			</Card>
		);
	}

	const maxRevenue = Math.max(...analytics.revenueData.map((d) => d.value), 1);
	const dataLength = analytics.revenueData.length;

	return (
		<Card className="@container/card">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>Pendapatan</CardTitle>
					<Select value={timeRange} onValueChange={(val) => setTimeRange(val as typeof timeRange)}>
						<SelectTrigger className="w-40">
							<SelectValue placeholder="30 hari" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="7d">7 hari</SelectItem>
							<SelectItem value="30d">30 hari</SelectItem>
							<SelectItem value="90d">90 hari</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</CardHeader>
			<CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
				<div className="relative h-[250px] w-full">
					{analytics.revenueData.map((data, index) => {
						const prevValue = index > 0 ? analytics.revenueData[index - 1].value : data.value;
						const isUp = data.value >= prevValue;

						return (
							<div
								key={data.date}
								className="absolute bottom-0"
								style={{
									left: dataLength > 1 ? `${(index / (dataLength - 1)) * 100}%` : "0%",
									width: `${100 / dataLength}%`,
								}}
							>
								<div
									className="h-full transition-all"
									style={{
										height: `${(data.value / maxRevenue) * 100}%`,
									}}
								/>
								<div
									className={`absolute -top-6 -left-4 flex items-center gap-1 text-xs ${
										isUp ? "text-green-500" : "text-red-500"
									}`}
								>
									{isUp ? "↑" : "↓"}
									<span className="font-medium">Rp {data.value.toLocaleString("id-ID")}</span>
								</div>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
