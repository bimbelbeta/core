import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { orpc } from "@/utils/orpc";

export function DataTable() {
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState<"all" | "premium" | "subject" | "tryout">("all");
	const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

	const { data: activities, isLoading } = useQuery(
		orpc.admin.dashboard.recentActivity.queryOptions({
			input: {
				search: search || undefined,
				type: filter === "all" ? undefined : filter,
				limit: pagination.pageSize,
				cursor: pagination.pageIndex * pagination.pageSize,
			},
		}),
	);

	const filteredActivities = activities?.data ?? [];

	return (
		<div className="rounded-lg border bg-card shadow-sm">
			<div className="flex items-center justify-between p-4">
				<div className="flex items-center gap-4">
					<Input
						placeholder="Cari aktivitas..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-64"
					/>
					<Select value={filter} onValueChange={(val) => setFilter(val as typeof filter)}>
						<SelectTrigger className="w-40">
							<SelectValue placeholder="Semua" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua</SelectItem>
							<SelectItem value="premium">Premium</SelectItem>
							<SelectItem value="subject">Mata Pelajaran</SelectItem>
							<SelectItem value="tryout">Tryout</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={pagination.pageIndex === 0}
						onClick={() => setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex - 1 }))}
					>
						Prev
					</Button>
					<span className="text-muted-foreground text-sm">Halaman {pagination.pageIndex + 1}</span>
					<Button
						variant="outline"
						size="sm"
						disabled={!activities || filteredActivities.length < pagination.pageSize}
						onClick={() => setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex + 1 }))}
					>
						Next
					</Button>
				</div>
			</div>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Jenis</TableHead>
						<TableHead>Deskripsi</TableHead>
						<TableHead>User</TableHead>
						<TableHead>Tanggal</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{isLoading ? (
						<TableRow>
							<TableCell colSpan={4} className="h-24 text-center">
								Memuat...
							</TableCell>
						</TableRow>
					) : filteredActivities.length === 0 ? (
						<TableRow>
							<TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
								Belum ada aktivitas.
							</TableCell>
						</TableRow>
					) : (
						filteredActivities.map((activity) => (
							<TableRow key={activity.id}>
								<TableCell>
									<span
										className={`rounded px-2 py-1 font-medium text-xs ${
											activity.type === "user"
												? "bg-blue-100 text-blue-700"
												: activity.type === "premium"
													? "bg-yellow-100 text-yellow-700"
													: activity.type === "subject"
														? "bg-green-100 text-green-700"
														: "bg-purple-100 text-purple-700"
										}`}
									>
										{activity.type === "user" && "Pengguna"}
										{activity.type === "premium" && "Premium"}
										{activity.type === "subject" && "Mata Pelajaran"}
										{activity.type === "tryout" && "Tryout"}
									</span>
								</TableCell>
								<TableCell>{activity.description}</TableCell>
								<TableCell>{activity.userName}</TableCell>
								<TableCell>{new Date(activity.date).toLocaleDateString("id-ID")}</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</div>
	);
}
