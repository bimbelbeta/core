import { ListMagnifyingGlass } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface BulkQuestionsTableProps {
	questions: Array<{
		id: number;
		order: number;
		question: {
			id: number;
			type: "multiple_choice" | "essay";
			content: string;
		};
	}>;
	isLoading?: boolean;
	selectedIds: Set<number>;
	onSelectionChange: (ids: Set<number>) => void;
	onSelectAll: () => void;
	isAllSelected?: boolean;
	onQuestionClick?: (id: number) => void;
}

export function BulkQuestionsTable({
	questions,
	isLoading,
	selectedIds,
	onSelectionChange,
	onSelectAll,
	isAllSelected,
	onQuestionClick,
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

	const stripHtml = (html: string) => {
		return html.replace(/<[^>]*>?/gm, "");
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
								className="translate-y-[2px]"
							/>
						</TableHead>
						<TableHead className="w-16 text-center font-semibold text-primary-navy-900">No</TableHead>
						<TableHead className="font-semibold text-primary-navy-900">Pertanyaan</TableHead>
						<TableHead className="w-32 text-center font-semibold text-primary-navy-900">Tipe</TableHead>
						<TableHead className="w-32 text-center font-semibold text-primary-navy-900">ID</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{isLoading ? (
						<TableRow>
							<TableCell colSpan={5} className="h-48 text-center">
								<div className="flex animate-pulse flex-col items-center justify-center gap-2 text-muted-foreground">
									<div className="size-8 rounded-full bg-muted" />
									<span className="text-sm">Memuat pertanyaan...</span>
								</div>
							</TableCell>
						</TableRow>
					) : questions.length === 0 ? (
						<TableRow>
							<TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
								<div className="flex flex-col items-center justify-center gap-2">
									<ListMagnifyingGlass className="size-8 opacity-50" />
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
										"group cursor-pointer transition-colors",
										isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/30",
									)}
									onClick={() => onQuestionClick?.(item.question.id)}
								>
									<TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
										<Checkbox
											checked={isSelected}
											onCheckedChange={(checked) => handleCheckboxChange(item.id, checked === true)}
											aria-label={`Select question ${item.order}`}
											className="translate-y-[2px]"
										/>
									</TableCell>
									<TableCell className="text-center font-medium text-muted-foreground">{item.order}</TableCell>
									<TableCell>
										<div
											className="max-w-[500px] truncate font-medium text-primary-navy-900/90"
											title={stripHtml(item.question.content)}
										>
											{stripHtml(item.question.content) || (
												<span className="text-muted-foreground italic">Konten kosong</span>
											)}
										</div>
									</TableCell>
									<TableCell className="text-center">
										<Badge
											variant={item.question.type === "multiple_choice" ? "default" : "secondary"}
											className={cn(
												"font-medium capitalize tracking-wide",
												item.question.type === "multiple_choice"
													? "border-blue-200 bg-blue-100 text-blue-700 hover:bg-blue-200"
													: "border-purple-200 bg-purple-100 text-purple-700 hover:bg-purple-200",
											)}
										>
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
