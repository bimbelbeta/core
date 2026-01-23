import { ListMagnifyingGlassIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { TiptapRenderer } from "@/components/tiptap-renderer";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { BodyOutputs } from "@/utils/orpc";

interface BulkQuestionsTableProps {
	questions: BodyOutputs["admin"]["tryout"]["questionsBulk"]["listSubtestQuestions"]["questions"];
	isPending?: boolean;
	selectedIds: Set<number>;
	onSelectionChange: (ids: Set<number>) => void;
	onSelectAll: () => void;
	isAllSelected?: boolean;
}

export function BulkQuestionsTable({
	questions,
	isPending,
	selectedIds,
	onSelectionChange,
	onSelectAll,
	isAllSelected,
}: BulkQuestionsTableProps) {
	const handleCheckboxChange = (id: number, checked: boolean) => {
		const newSelectedIds = new Set(selectedIds);
		if (checked) {
			newSelectedIds.add(id);
		} else {
			newSelectedIds.delete(id);
		}
		onSelectionChange(newSelectedIds);
	};

	return (
		<div className="overflow-hidden overflow-x-auto rounded-lg border bg-white shadow-sm transition-all hover:shadow-md">
			<Table>
				<TableHeader>
					<TableRow className="bg-muted/30 hover:bg-muted/30">
						<TableHead className="w-12 text-center">
							<Checkbox
								checked={isAllSelected}
								onCheckedChange={() => onSelectAll()}
								aria-label="Select all"
								className="translate-y-0.5"
							/>
						</TableHead>
						<TableHead className="w-16 text-center font-semibold text-primary-navy-900">No</TableHead>
						<TableHead className="w-48 text-center font-semibold text-primary-navy-900">Pertanyaan</TableHead>
						<TableHead className="w-32 text-center font-semibold text-primary-navy-900">Tipe</TableHead>
						<TableHead className="w-20 text-center font-semibold text-primary-navy-900">ID</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{isPending ? (
						<TableRow>
							<TableCell colSpan={4} className="h-48 text-center">
								Memuat pertanyaan...
							</TableCell>
						</TableRow>
					) : questions.length === 0 ? (
						<TableRow>
							<TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
								<div className="flex flex-col items-center justify-center gap-2">
									<ListMagnifyingGlassIcon className="size-8 opacity-50" />
									<span>Tidak ada pertanyaan ditemukan</span>
								</div>
							</TableCell>
						</TableRow>
					) : (
						questions.map((item) => {
							const isSelected = selectedIds.has(item.id);
							return (
								<TableRow
									key={item.id}
									className={cn(
										"transition-colors",
										isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/30",
									)}
								>
									<TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
										<Checkbox
											checked={isSelected}
											onCheckedChange={(checked) => handleCheckboxChange(item.id, checked === true)}
											aria-label={`Select question ${item.order}`}
											className="translate-y-0.5"
										/>
									</TableCell>
									<TableCell className="text-center font-medium text-muted-foreground">{item.order}</TableCell>
									<TableCell className="max-w-125">
										<Link
											to="/admin/questions/$questionId"
											params={{
												questionId: item.id,
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
									<TableCell className="text-center font-mono text-muted-foreground text-xs">
										#{item.question.id}
									</TableCell>
								</TableRow>
							);
						})
					)}
				</TableBody>
			</Table>
		</div>
	);
}
