import { Link } from "@tanstack/react-router";
import { AdminTable, AdminTableBody, AdminTableRoot } from "@/components/admin/admin-table";
import { TiptapRenderer } from "@/components/tiptap/tiptap-renderer";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { BodyOutputs } from "@/lib/orpc";
import { QUESTION_TYPE_BADGE, QUESTION_TYPE_LABELS } from "@/lib/schemas";
import { cn } from "@/lib/utils";

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
			<div className="overflow-x-auto">
				<AdminTable>
					<TableHeader>
						<TableRow className="bg-muted/30 hover:bg-muted/30">
							<TableHead className="text-center">
								<Checkbox
									checked={isAllSelected}
									onCheckedChange={() => onSelectAll()}
									aria-label="Pilih semua soal"
									className="translate-y-0.5"
								/>
							</TableHead>
							<TableHead className="text-center font-semibold">Pertanyaan</TableHead>
							<TableHead className="text-center font-semibold">Tipe</TableHead>
						</TableRow>
					</TableHeader>
					<AdminTableBody
						isLoading={isPending}
						isEmpty={!isPending && questions.length === 0}
						emptyMessage="Tidak ada pertanyaan ditemukan"
						columns={3}
					>
						{questions.map((item) => {
							const isSelected = selectedIds.includes(item.id);
							return (
								<TableRow
									key={item.id}
									className={cn(
										"transition-colors",
										isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/30",
									)}
								>
									<TableCell className="text-center">
										<Checkbox
											checked={isSelected}
											onCheckedChange={() => onToggleOne(item.id)}
											aria-label={`Pilih soal #${item.order}`}
											className="translate-y-0.5"
										/>
									</TableCell>
									<TableCell className="max-w-125">
										<Link
											to="/admin/questions/$questionId"
											params={{
												questionId: item.id.toString(),
											}}
											className="group hover:cursor-pointer"
										>
											<TiptapRenderer
												content={item.question.content}
												className="prose-sm line-clamp-2 max-w-none group-hover:underline"
											/>
										</Link>
									</TableCell>
									<TableCell className="text-center">
										<Badge variant={QUESTION_TYPE_BADGE[item.question.type]}>
											{QUESTION_TYPE_LABELS[item.question.type]}
										</Badge>
									</TableCell>
								</TableRow>
							);
						})}
					</AdminTableBody>
				</AdminTable>
			</div>
		</AdminTableRoot>
	);
}
