import { ListMagnifyingGlassIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { TiptapRenderer } from "@/components/tiptap/tiptap-renderer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import type { BodyOutputs } from "@/lib/orpc";
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
		<Card variant="flush" className="overflow-hidden transition-all hover:shadow-md">
			<div className="overflow-x-auto">
				<Table>
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
							<TableHead className="text-center font-semibold">ID</TableHead>
							<TableHead className="text-center font-semibold">Pertanyaan</TableHead>
							<TableHead className="text-center font-semibold">Tipe</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isPending ? (
							<TableSkeleton columns={5} />
						) : questions.length === 0 ? (
							<TableRow>
								<TableCell colSpan={4} className="text-muted-foreground h-48 text-center">
									<div className="flex flex-col items-center justify-center gap-2">
										<ListMagnifyingGlassIcon className="size-8 opacity-50" />
										<span>Tidak ada pertanyaan ditemukan</span>
									</div>
								</TableCell>
							</TableRow>
						) : (
							questions.map((item) => {
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
										<TableCell className="text-muted-foreground text-center font-mono text-sm">{item.order}</TableCell>
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
											<Badge variant={item.question.type === "multiple_choice" ? "default" : "outline"}>
												{item.question.type === "multiple_choice" ? "Pilihan Ganda" : "Esai"}
											</Badge>
										</TableCell>
										<TableCell className="text-muted-foreground text-center font-mono text-xs">
											#{item.question.id}
										</TableCell>
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</div>
		</Card>
	);
}
