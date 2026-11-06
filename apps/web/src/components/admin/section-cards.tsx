import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah } from "@/lib/formatter";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";

const percentage = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
const number = new Intl.NumberFormat("id-ID");

function Trend({ value }: { value: number | null }) {
	if (value === null) return null;

	const direction = value > 0 ? "up" : value < 0 ? "down" : "flat";
	const Icon = direction === "up" ? ArrowUpRightIcon : direction === "down" ? ArrowDownRightIcon : MinusIcon;

	return (
		<span
			className={cn(
				"flex items-center gap-1 text-[11px] font-medium whitespace-nowrap",
				direction === "up" && "text-green-800",
				direction === "down" && "text-red-600",
				direction === "flat" && "text-muted-foreground",
			)}
		>
			<Icon className="size-3" weight="bold" />
			{direction === "flat" ? (
				"Stabil"
			) : (
				<>
					<span className="tabular-nums">
						{direction === "up" ? "+" : ""}
						{percentage.format(value)}%
					</span>
					<span className="text-muted-foreground font-normal">vs bulan lalu</span>
				</>
			)}
		</span>
	);
}

function Stat({
	label,
	value,
	meta,
	trend,
}: {
	label: ReactNode;
	value: ReactNode;
	meta?: string;
	trend?: number | null;
}) {
	return (
		<div className="px-4 py-3">
			<div className="flex items-start justify-between gap-3">
				<p className="text-muted-foreground text-xs leading-tight">{label}</p>
				{trend !== undefined && <Trend value={trend} />}
			</div>
			<p className="text-foreground mt-2 text-2xl leading-none font-semibold tracking-tight tabular-nums">{value}</p>
			{meta && <p className="text-muted-foreground mt-1 text-xs tabular-nums">{meta}</p>}
		</div>
	);
}

export function SectionCards() {
	const { data: stats, isLoading } = useQuery(orpc.admin.dashboard.stats.queryOptions());

	if (isLoading || !stats) {
		return (
			<div className="bg-card rounded-xl border">
				<div className="grid gap-px sm:grid-cols-3">
					{[1, 2, 3].map((item) => (
						<div key={item} className="px-4 py-3">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="mt-2 h-5 w-20" />
							<Skeleton className="mt-1 h-3 w-36" />
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="bg-card rounded-xl border">
			<div className="grid gap-px sm:grid-cols-3">
				<Stat
					label="Total pengguna terdaftar"
					value={number.format(stats.totalUsers)}
					trend={stats.usersTrend}
					meta={
						stats.totalUsers > 0
							? `${number.format(stats.premiumUsers)} pengguna premium`
							: "Belum ada pengguna terdaftar"
					}
				/>
				<Stat
					label="Total soal"
					value={number.format(stats.totalQuestions)}
					meta={
						stats.totalQuestions > 0
							? `${number.format(stats.totalQuestions - stats.essayQuestions)} pilihan ganda · ${number.format(stats.essayQuestions)} esai`
							: "Belum ada soal"
					}
				/>
				<Stat
					label="Pendapatan bulan ini"
					value={formatRupiah(stats.monthlyRevenue)}
					trend={stats.revenueTrend}
					meta={stats.monthlyRevenue > 0 ? "Dari transaksi sukses bulan berjalan" : "Belum ada transaksi bulan ini"}
				/>
			</div>
		</div>
	);
}
