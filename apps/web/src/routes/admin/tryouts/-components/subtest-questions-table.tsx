import { TrashIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
	AdminTable,
	AdminTableBody,
	AdminTableCell,
	AdminTableHead,
	AdminTableHeader,
	AdminTableRoot,
	AdminTableRow,
} from "@/components/admin/admin-table";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { extractTextFromTiptap } from "@/lib/content-text";
import type { BodyOutputs } from "@/lib/orpc";
import { QUESTION_TYPE_SHORT_LABELS } from "@/lib/schemas";

interface SubtestQuestionsTableProps {
	questions: BodyOutputs["admin"]["tryout"]["questionsBulk"]["list"]["questions"];
	isPending?: boolean;
	isRemoving?: boolean;
	onRemove: (questionId: number) => void;
}

export function SubtestQuestionsTable({ questions, isPending, isRemoving, onRemove }: SubtestQuestionsTableProps) {
	const [removeQuestionId, setRemoveQuestionId] = useState<number | null>(null);

	return (
		<AdminTableRoot>
			<AdminTable className="table-fixed">
				<AdminTableHeader>
					<AdminTableHead className="pl-3">Soal</AdminTableHead>
					<AdminTableHead className="w-16 pr-3 text-right">
						<span className="sr-only">Aksi</span>
					</AdminTableHead>
				</AdminTableHeader>
				<AdminTableBody
					isLoading={isPending}
					isEmpty={!isPending && questions.length === 0}
					emptyMessage="Subtest ini belum punya soal."
					columns={2}
				>
					{questions.map((item, index) => {
						const preview = extractTextFromTiptap(item.question.content);

						return (
							<AdminTableRow key={item.id}>
								<AdminTableCell className="pl-3">
									<div className="min-w-0">
										<Link
											to="/admin/questions/$questionId"
											params={{ questionId: item.question.id.toString() }}
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
								<AdminTableCell className="relative z-10 pr-3 text-right">
									<AlertDialog
										open={removeQuestionId === item.question.id}
										onOpenChange={(open) => setRemoveQuestionId(open ? item.question.id : null)}
									>
										<Button
											variant="ghost"
											size="icon"
											className="size-9"
											disabled={isRemoving}
											aria-label={`Hapus soal nomor ${index + 1} dari subtest`}
											onClick={() => setRemoveQuestionId(item.question.id)}
										>
											<TrashIcon className="text-destructive size-4" />
										</Button>
										<AlertDialogContent onClick={(e) => e.stopPropagation()}>
											<AlertDialogHeader>
												<AlertDialogTitle>Hapus soal dari subtest</AlertDialogTitle>
												<AlertDialogDescription>
													Soal nomor {index + 1} akan dilepas dari subtest ini. Soal tetap tersimpan di bank soal.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Batal</AlertDialogCancel>
												<AlertDialogAction
													variant="destructive"
													onClick={() => {
														onRemove(item.question.id);
														setRemoveQuestionId(null);
													}}
												>
													Hapus
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</AdminTableCell>
							</AdminTableRow>
						);
					})}
				</AdminTableBody>
			</AdminTable>
		</AdminTableRoot>
	);
}
