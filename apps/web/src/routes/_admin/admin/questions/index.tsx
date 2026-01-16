import { DotsThree, Exam, Funnel, MagnifyingGlass, Package, PencilSimple, Trash } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TiptapRenderer } from "@/components/tiptap-renderer";
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
import { Card } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_admin/admin/questions/")({
	component: QuestionsPage,
});

function QuestionsPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [filter, setFilter] = useState<"all" | "unused">("all");
	const [page, setPage] = useState(1);
	const limit = 12;
	const offset = (page - 1) * limit;

	// Debounce search query
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchQuery);
			setPage(1); // Reset to page 1 when search changes
		}, 300);

		return () => clearTimeout(timer);
	}, [searchQuery]);

	const { data, isLoading } = useQuery(
		orpc.admin.practicePack.listAllQuestions.queryOptions({
			input: {
				limit,
				offset,
				unusedOnly: filter === "unused",
				search: debouncedSearch,
			},
		}),
	);

	const questions = data?.data || [];
	const total = data?.total || 0;
	const totalPages = Math.ceil(total / limit);

	return (
		<main className="flex-1 bg-background p-4 pt-20 lg:ml-64 lg:p-8 lg:pt-8">
			<div className="mx-auto max-w-6xl">
				{/* Breadcrumbs */}
				<div className="mb-4 flex items-center gap-2 font-medium text-muted-foreground text-sm">
					<span className="cursor-default hover:text-foreground">Admin</span>
					<span>/</span>
					<span className="text-foreground">Question Bank</span>
				</div>

				<div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="font-bold text-2xl tracking-tight sm:text-3xl">Question Bank</h1>
						<p className="mt-1 text-muted-foreground text-sm">Manage all questions across practice packs</p>
					</div>
				</div>

				<div className="mb-6 flex flex-col gap-3 sm:flex-row">
					<div className="relative flex-1">
						<MagnifyingGlass className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search questions..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9"
						/>
					</div>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" className="w-full gap-2 sm:w-auto">
								<Funnel className="size-4" />
								<span className="hidden sm:inline">{filter === "all" ? "All Questions" : "Unused Only"}</span>
								<span className="sm:hidden">{filter === "all" ? "All" : "Unused"}</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							<DropdownMenuRadioGroup
								value={filter}
								onValueChange={(value) => {
									setFilter(value as "all" | "unused");
									setPage(1);
								}}
							>
								<DropdownMenuRadioItem value="all">All Questions</DropdownMenuRadioItem>
								<DropdownMenuRadioItem value="unused">Unused Only</DropdownMenuRadioItem>
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{isLoading ? (
					<div className="grid gap-4 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
						{[1, 2, 3, 4, 5, 6].map((i) => (
							<Card key={i} className="px-6 py-6">
								<Skeleton className="h-6 w-3/4" />
								<Skeleton className="mt-4 h-4 w-full" />
								<Skeleton className="mt-6 h-4 w-1/2" />
							</Card>
						))}
					</div>
				) : !questions || questions.length === 0 ? (
					<div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
						<Exam className="mb-4 size-12 text-muted-foreground" />
						<h3 className="mb-2 font-semibold text-lg">No questions found</h3>
						<p className="text-muted-foreground text-sm">
							{searchQuery
								? "Try adjusting your search query"
								: "Get started by creating questions from practice packs"}
						</p>
					</div>
				) : (
					<div className="grid gap-4 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
						{questions.map((question) => (
							<QuestionCard key={question.id} question={question} />
						))}
					</div>
				)}

				{/* Pagination Controls */}
				{totalPages > 1 && (
					<div className="mt-8 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={page === 1}
							onClick={() => setPage(page - 1)}
							className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
						>
							<span className="hidden sm:inline">Previous</span>
							<span className="sm:hidden">Prev</span>
						</Button>

						<div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1">
							{page > 3 && (
								<>
									<Button
										variant="outline"
										size="sm"
										onClick={() => setPage(1)}
										className="h-8 w-8 p-0 text-xs sm:h-9 sm:w-9 sm:text-sm"
									>
										1
									</Button>
									{page > 4 && <span className="hidden px-1 text-xs sm:inline sm:px-2">...</span>}
								</>
							)}

							{Array.from({ length: totalPages }, (_, i) => i + 1)
								.filter((pageNum) => {
									return (
										pageNum === page ||
										pageNum === page - 1 ||
										pageNum === page + 1 ||
										pageNum === page - 2 ||
										pageNum === page + 2
									);
								})
								.map((pageNum) => (
									<Button
										key={pageNum}
										variant={pageNum === page ? "default" : "outline"}
										size="sm"
										onClick={() => setPage(pageNum)}
										className="h-8 w-8 p-0 text-xs sm:h-9 sm:w-9 sm:text-sm"
									>
										{pageNum}
									</Button>
								))}

							{page < totalPages - 2 && (
								<>
									{page < totalPages - 3 && <span className="hidden px-1 text-xs sm:inline sm:px-2">...</span>}
									<Button
										variant="outline"
										size="sm"
										onClick={() => setPage(totalPages)}
										className="h-8 w-8 p-0 text-xs sm:h-9 sm:w-9 sm:text-sm"
									>
										{totalPages}
									</Button>
								</>
							)}
						</div>

						<Button
							variant="outline"
							size="sm"
							disabled={page === totalPages}
							onClick={() => setPage(page + 1)}
							className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
						>
							<span className="hidden sm:inline">Next</span>
							<span className="sm:hidden">Next</span>
						</Button>
					</div>
				)}
			</div>
		</main>
	);
}

function QuestionCard({
	question,
}: {
	question: {
		id: number;
		content: unknown;
		discussion: unknown;
		packCount: number;
	};
}) {
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const deleteMutation = useMutation(
		orpc.admin.practicePack.deleteQuestion.mutationOptions({
			onSuccess: () => {
				toast.success("Question deleted successfully");
				queryClient.invalidateQueries({
					queryKey: orpc.admin.practicePack.listAllQuestions.queryKey({ input: {} }),
				});
				setDeleteDialogOpen(false);
			},
			onError: (error) => {
				toast.error("Failed to delete question", {
					description: String(error),
				});
			},
		}),
	);

	const handleDelete = () => {
		deleteMutation.mutate({ id: question.id });
	};

	const isUnused = question.packCount === 0;

	return (
		<>
			<Card
				className={cn(
					"group relative flex flex-col overflow-hidden py-0 transition-all hover:shadow-md",
					isUnused && "border-dashed bg-muted/30",
				)}
			>
				<Link to={`/admin/questions/${question.id}`} className="flex flex-1 flex-col px-6 py-6">
					<div className="mb-4 flex-1 space-y-3">
						<div className="prose prose-sm line-clamp-3 max-w-none text-foreground">
							<TiptapRenderer content={question.content} />
						</div>

						{/* Mini Discussion Preview */}
						<div className="flex items-center gap-2 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
							<span>Discussion Preview</span>
						</div>
						<div className="line-clamp-1 text-muted-foreground text-xs italic opacity-80">
							<TiptapRenderer content={question.discussion} />
						</div>
					</div>

					{/* Metadata */}
					<div className="mt-auto flex items-center gap-4 font-medium text-muted-foreground text-xs">
						<div className="flex items-center gap-1.5">
							{question.packCount > 0 ? (
								<span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 font-bold text-[10px] text-green-800 dark:bg-green-900/30 dark:text-green-400">
									<Package className="mr-1 size-3" />
									Used in {question.packCount} pack{question.packCount !== 1 ? "s" : ""}
								</span>
							) : (
								<span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 font-bold text-[10px] text-gray-800 dark:bg-gray-800 dark:text-gray-300">
									Unused
								</span>
							)}
						</div>
						<div className="font-mono text-[10px] opacity-60">ID: {question.id}</div>
					</div>
				</Link>

				<div className="absolute top-4 right-4 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="size-8 bg-background/80 backdrop-blur-sm">
								<DotsThree className="size-5" weight="bold" />
								<span className="sr-only">Open menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-40">
							<DropdownMenuItem onClick={() => navigate({ to: `/admin/questions/${question.id}` })}>
								<PencilSimple className="mr-2 size-4" />
								Edit Content
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => setDeleteDialogOpen(true)}
								className="text-destructive focus:text-destructive"
							>
								<Trash className="mr-2 size-4" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</Card>

			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Question?</AlertDialogTitle>
						<AlertDialogDescription>
							{question.packCount > 0 ? (
								<>
									This question is currently used in{" "}
									<span className="font-semibold">
										{question.packCount} practice pack
										{question.packCount !== 1 ? "s" : ""}
									</span>
									. Deleting it will remove it from all packs. This action cannot be undone.
								</>
							) : (
								"This will permanently delete this question. This action cannot be undone."
							)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={deleteMutation.isPending}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{deleteMutation.isPending ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
