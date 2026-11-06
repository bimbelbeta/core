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
import { Checkbox } from "@/components/ui/checkbox";
import { extractTextFromTiptap } from "@/lib/content-text";
import type { BodyOutputs } from "@/lib/orpc";
import { QUESTION_TYPE_SHORT_LABELS } from "@/lib/schemas";

interface BulkQuestionsTableProps {
	questions: BodyOutputs["admin"]["tryout"]["questionsBulk"]["list"]["questions"];
	isPending?: boolean;
	selectedIds: number[];
	onToggleOne: (id: number) => void;
	onSelectAll: () => void;
	isAllSelected?: boolean;
}

export function BulkQuestionsTable({
	questions,
	isPending,
	selectedIds,
	onToggleOne,
	onSelectAll,
	isAllSelected,
}: BulkQuestionsTableProps) {
	return (
		<AdminTableRoot>
			<AdminTable className="table-fixed">
				<AdminTableHeader>
					<AdminTableHead className="hidden w-8 px-4 sm:table-cell">
						<Checkbox checked={isAllSelected} onCheckedChange={() => onSelectAll()} aria-label="Pilih semua soal" />
					</AdminTableHead>
					<AdminTableHead>Soal</AdminTableHead>
				</AdminTableHeader>
				<AdminTableBody
					isLoading={isPending}
					isEmpty={!isPending && questions.length === 0}
					emptyMessage="Subtest ini belum punya soal."
					columns={2}
				>
					{questions.map((item, index) => {
						const isSelected = selectedIds.includes(item.id);
						const preview = extractTextFromTiptap(item.question.content);

						return (
							<AdminTableRow key={item.id} className={isSelected ? "bg-primary/5" : undefined}>
								<AdminTableCell className="hidden w-8 sm:table-cell">
									<Checkbox
										checked={isSelected}
										onCheckedChange={() => onToggleOne(item.id)}
										aria-label={`Pilih soal nomor ${index + 1}`}
									/>
								</AdminTableCell>
								<AdminTableCell>
									<div className="min-w-0">
										<Link
											to="/admin/questions/$questionId"
											params={{ questionId: item.id.toString() }}
											className="text-row-title text-foreground hover:text-primary focus-visible:text-primary focus-visible:ring-ring/50 line-clamp-2 rounded-sm whitespace-normal underline-offset-4 outline-none after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:underline focus-visible:ring-2"
										>
											{preview || "(Konten kosong)"}
										</Link>
										<div className="text-muted-foreground text-meta mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
											<span className="font-mono tabular-nums">Soal {index + 1}</span>
											<span aria-hidden>·</span>
											<span>{QUESTION_TYPE_SHORT_LABELS[item.question.type] ?? item.question.type}</span>
										</div>
									</div>
								</AdminTableCell>
							</AdminTableRow>
						);
					})}
				</AdminTableBody>
			</AdminTable>
		</AdminTableRoot>
	);
}
