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
import { Button } from "@/components/ui/button";
import { TableRowStack, tableRowLinkClass } from "@/components/ui/table-row-stack";
import { Typography } from "@/components/ui/typography";
import { extractTextFromTiptap } from "@/lib/content-text";
import { formatDateMedium } from "@/lib/format-date";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
	multiple_choice: "Pilihan ganda",
	multiple_choice_complex: "PG kompleks",
	essay: "Esai",
};

export function RecentQuestions() {
	const { data, isLoading, isError } = useQuery(orpc.admin.tryout.questions.list.queryOptions({ input: { limit: 6 } }));
	const questions = data?.items ?? [];

	return (
		<section>
			<header className="flex min-h-8 flex-wrap items-center justify-between gap-3 pb-3">
				<Typography variant="subtitle4" as="h2">
					Soal terbaru
				</Typography>
				<Button variant="ghost" size="xs" className="text-muted-foreground text-meta gap-1.5 px-2.5" asChild>
					<Link to="/admin/questions">
						Lihat semua soal
						<CaretRightIcon className="size-3" />
					</Link>
				</Button>
			</header>

			<AdminTableRoot>
				<AdminTable>
					<AdminTableHeader>
						<AdminTableHead>Soal</AdminTableHead>
						<AdminTableHead className="w-10">
							<span className="sr-only">Buka</span>
						</AdminTableHead>
					</AdminTableHeader>
					<AdminTableBody
						isLoading={isLoading}
						isError={isError}
						isEmpty={!isLoading && !isError && questions.length === 0}
						emptyMessage="Belum ada soal."
						emptyAction={
							<Button size="xs" asChild>
								<Link to="/admin/questions/create">Tambah soal</Link>
							</Button>
						}
						columns={2}
					>
						{questions.map((question) => (
							<AdminTableRow key={question.id}>
								<AdminTableCell className="w-full max-w-0">
									<TableRowStack
										title={
											<Link
												to="/admin/questions/$questionId"
												params={{ questionId: question.id.toString() }}
												className={cn(tableRowLinkClass, "line-clamp-2")}
											>
												{extractTextFromTiptap(question.content) || "(Konten kosong)"}
											</Link>
										}
										subtitle={
											<>
												<span className="font-mono">#{question.id}</span>
												<span aria-hidden>·</span>
												{TYPE_LABELS[question.type] ?? question.type}
												{question.createdAt && (
													<>
														<span aria-hidden>·</span>
														{formatDateMedium(new Date(question.createdAt))}
													</>
												)}
											</>
										}
									/>
								</AdminTableCell>
								<AdminTableCell className="text-muted-foreground hidden sm:table-cell">
									<CaretRightIcon className="size-3.5" />
								</AdminTableCell>
							</AdminTableRow>
						))}
					</AdminTableBody>
				</AdminTable>
			</AdminTableRoot>
		</section>
	);
}
