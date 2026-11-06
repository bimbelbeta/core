import { CaretRightIcon, PlusIcon } from "@phosphor-icons/react";
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
import { extractTextFromTiptap } from "@/lib/content-text";
import { formatDateMedium } from "@/lib/format-date";
import { orpc } from "@/lib/orpc";

const TYPE_LABELS: Record<string, string> = {
	multiple_choice: "Pilihan ganda",
	multiple_choice_complex: "PG kompleks",
	essay: "Esai",
};

export function RecentQuestions() {
	const { data, isLoading, isError } = useQuery(orpc.admin.tryout.questions.list.queryOptions({ input: { limit: 4 } }));
	const questions = data?.items ?? [];

	return (
		<section>
			<header className="flex min-h-8 flex-wrap items-center justify-between gap-3 pb-4">
				<h2 className="text-section-title">Soal terbaru</h2>
				<Button variant="ghost" size="sm" className="text-muted-foreground h-9 gap-1.5 px-2.5 text-[13px]" asChild>
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
						<AdminTableHead className="hidden w-40 sm:table-cell">Tipe</AdminTableHead>
						<AdminTableHead className="hidden w-32 sm:table-cell">Ditambahkan</AdminTableHead>
					</AdminTableHeader>
					<AdminTableBody
						isLoading={isLoading}
						isError={isError}
						isEmpty={!isLoading && !isError && questions.length === 0}
						emptyMessage="Belum ada soal."
						emptyAction={
							<Button size="sm" className="h-9" asChild>
								<Link to="/admin/questions/create">
									<PlusIcon className="size-4" />
									Tambah soal
								</Link>
							</Button>
						}
						columns={3}
					>
						{questions.map((question) => (
							<AdminTableRow key={question.id}>
								<AdminTableCell>
									<Link
										to="/admin/questions/$questionId"
										params={{ questionId: question.id.toString() }}
										className="text-row-title text-foreground hover:text-primary focus-visible:ring-ring/50 block truncate rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-2"
									>
										{extractTextFromTiptap(question.content) || "(Konten kosong)"}
									</Link>
									<p className="text-muted-foreground text-meta mt-0.5 truncate sm:hidden">
										{TYPE_LABELS[question.type] ?? question.type}
										{question.createdAt && ` · ${formatDateMedium(new Date(question.createdAt))}`}
									</p>
								</AdminTableCell>
								<AdminTableCell className="text-muted-foreground hidden text-[13px] sm:table-cell">
									{TYPE_LABELS[question.type] ?? question.type}
								</AdminTableCell>
								<AdminTableCell className="text-muted-foreground hidden text-[13px] sm:table-cell">
									{question.createdAt ? formatDateMedium(new Date(question.createdAt)) : "—"}
								</AdminTableCell>
							</AdminTableRow>
						))}
					</AdminTableBody>
				</AdminTable>
			</AdminTableRoot>
		</section>
	);
}
