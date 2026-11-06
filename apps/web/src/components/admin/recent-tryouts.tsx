import { CaretRightIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
	AdminTable,
	AdminTableBody,
	AdminTableCell,
	AdminTableHead,
	AdminTableHeader,
	AdminTableRoot,
	AdminTableRow,
} from "@/components/admin/admin-table";
import { TryoutStatus } from "@/components/admin/tryout-status";
import { Button } from "@/components/ui/button";
import { formatDateMedium } from "@/lib/format-date";
import { orpc } from "@/lib/orpc";

export function RecentTryouts() {
	const { data, isLoading, isError } = useQuery(orpc.admin.dashboard.stats.queryOptions());
	const tryouts = data?.recentTryouts ?? [];

	return (
		<section>
			<header className="flex min-h-8 flex-wrap items-center justify-between gap-3 pb-4">
				<h2 className="text-section-title">Tryout terbaru</h2>
				<Button variant="ghost" size="sm" className="text-muted-foreground text-meta h-9 gap-1.5 px-2.5" asChild>
					<Link to="/admin/tryouts">
						Lihat semua tryout
						<CaretRightIcon className="size-3" />
					</Link>
				</Button>
			</header>

			<AdminTableRoot>
				<AdminTable>
					<AdminTableHeader>
						<AdminTableHead>Judul</AdminTableHead>
						<AdminTableHead className="hidden w-28 sm:table-cell">Kategori</AdminTableHead>
						<AdminTableHead className="w-28">Status</AdminTableHead>
						<AdminTableHead className="hidden w-32 sm:table-cell">Diperbarui</AdminTableHead>
					</AdminTableHeader>
					<AdminTableBody
						isLoading={isLoading}
						isError={isError}
						isEmpty={!isLoading && !isError && tryouts.length === 0}
						emptyMessage="Belum ada tryout."
						emptyAction={
							<Button size="sm" className="h-9" asChild>
								<Link to="/admin/tryouts">Buka daftar tryout</Link>
							</Button>
						}
						columns={4}
					>
						{tryouts.map((tryout) => (
							<AdminTableRow key={tryout.id}>
								<AdminTableCell>
									<Link
										to="/admin/tryouts/$tryoutId"
										params={{ tryoutId: tryout.id.toString() }}
										className="text-row-title text-foreground hover:text-primary focus-visible:ring-ring/50 block truncate rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-2"
									>
										{tryout.title}
									</Link>
								</AdminTableCell>
								<AdminTableCell className="text-muted-foreground text-meta hidden tracking-wide uppercase sm:table-cell">
									{tryout.category}
								</AdminTableCell>
								<AdminTableCell>
									<TryoutStatus status={tryout.status} />
								</AdminTableCell>
								<AdminTableCell className="text-muted-foreground text-meta hidden sm:table-cell">
									{tryout.updatedAt ? formatDateMedium(new Date(tryout.updatedAt)) : "—"}
								</AdminTableCell>
							</AdminTableRow>
						))}
					</AdminTableBody>
				</AdminTable>
			</AdminTableRoot>
		</section>
	);
}
