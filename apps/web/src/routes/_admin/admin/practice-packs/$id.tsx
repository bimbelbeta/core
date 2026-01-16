import {
	ArrowLeftIcon,
	CaretLeftIcon,
	CaretRightIcon,
	MagnifyingGlass,
	PencilSimple,
	PlusIcon,
	Trash,
} from "@phosphor-icons/react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";
import { AddExistingQuestionModal } from "./-components/add-existing-modal";
import { CreateQuestionForm } from "./-components/create-question-form";
import { EditPackForm } from "./-components/edit-pack-form";

export const Route = createFileRoute("/_admin/admin/practice-packs/$id")({
	component: PracticePackDetailPage,
});

function PracticePackDetailPage() {
	const { id } = Route.useParams();
	const packId = Number.parseInt(id, 10);

	const [showCreateForm, setShowCreateForm] = useState(false);
	const [showAddExisting, setShowAddExisting] = useState(false);

	const { data } = useQuery(
		orpc.admin.practicePack.getPackQuestions.queryOptions({
			input: { id: packId },
		}),
	);

	const existingQuestionIds = data?.questions?.map((q) => q.id) || [];

	if (Number.isNaN(packId)) {
		return (
			<main className="flex-1 p-4 pt-20 lg:ml-64 lg:p-8 lg:pt-8">
				<p className="text-destructive">Invalid practice pack ID</p>
			</main>
		);
	}

	return (
		<main className="flex-1 p-4 pt-20 lg:ml-64 lg:p-8 lg:pt-8">
			<div className="mx-auto max-w-6xl">
				{/* Navigation Breadcrumb-like */}
				<div className="mb-4 flex items-center gap-2 text-muted-foreground text-sm">
					<Link to="/admin/practice-packs" className="flex items-center gap-1 hover:text-foreground">
						<ArrowLeftIcon className="size-3.5" />
						Back to Packs
					</Link>
				</div>

				<div className="space-y-6 sm:space-y-8">
					<PackInfoHeader packId={packId} />

					<div className="space-y-4">
						<div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
							<h2 className="font-bold text-xl tracking-tight sm:text-2xl">
								Questions
								<span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 font-medium text-base text-muted-foreground">
									{data?.questions?.length || 0}
								</span>
							</h2>
							<div className="flex flex-col gap-2 sm:flex-row">
								<Button onClick={() => setShowAddExisting(true)} variant="outline" className="gap-2 text-xs sm:text-sm">
									<MagnifyingGlass className="size-3.5 sm:size-4" />
									Add Existing
								</Button>
								<Button onClick={() => setShowCreateForm(true)} className="gap-2 text-xs shadow-sm sm:text-sm">
									<PlusIcon className="size-3.5 sm:size-4" />
									Create New Question
								</Button>
							</div>
						</div>

						{showAddExisting && (
							<AddExistingQuestionModal
								practicePackId={packId}
								existingQuestionIds={existingQuestionIds}
								onClose={() => setShowAddExisting(false)}
							/>
						)}

						{showCreateForm && (
							<CreateQuestionForm
								practicePackId={packId}
								onSuccess={() => setShowCreateForm(false)}
								onCancel={() => setShowCreateForm(false)}
							/>
						)}

						<QuestionsList packId={packId} onCreateNew={() => setShowCreateForm(true)} />
					</div>
				</div>
			</div>
		</main>
	);
}

function PackInfoHeader({ packId }: { packId: number }) {
	const [isEditing, setIsEditing] = useState(false);
	const { data: pack, isLoading } = useQuery(
		orpc.admin.practicePack.getPack.queryOptions({
			input: { id: packId },
		}),
	);

	if (isLoading) {
		return (
			<div className="space-y-2">
				<Skeleton className="h-8 w-1/3" />
				<Skeleton className="h-4 w-2/3" />
			</div>
		);
	}

	if (!pack) {
		return <p className="text-destructive">Practice pack not found</p>;
	}

	if (isEditing) {
		return (
			<Card className="rounded-xl border-dashed py-4 shadow-none">
				<CardHeader>
					<CardTitle className="text-lg sm:text-xl">Edit Pack Information</CardTitle>
				</CardHeader>
				<CardContent>
					<EditPackForm pack={pack} onSuccess={() => setIsEditing(false)} onCancel={() => setIsEditing(false)} />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="relative py-5 shadow-sm sm:py-6">
			<CardContent className="pr-10">
				<h1 className="font-bold text-2xl tracking-tight sm:text-3xl">{pack.title}</h1>
				<p className="mt-2 text-muted-foreground text-sm leading-relaxed sm:text-base">
					{pack.description || "No description provided."}
				</p>
				<Button
					variant="ghost"
					size="icon"
					className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
					onClick={() => setIsEditing(true)}
				>
					<PencilSimple className="size-5" />
					<span className="sr-only">Edit</span>
				</Button>
			</CardContent>
		</Card>
	);
}

function QuestionsList({ packId, onCreateNew }: { packId: number; onCreateNew: () => void }) {
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [gridPage, setGridPage] = useState(0);
	const GRID_SIZE = 30;
	const navigate = useNavigate();

	const { data, isLoading } = useQuery(
		orpc.admin.practicePack.getPackQuestions.queryOptions({
			input: { id: packId },
		}),
	);

	const questions = data?.questions || [];

	useEffect(() => {
		if (questions && questions.length > 0) {
			setCurrentQuestionIndex(0);
			setGridPage(0);
		}
	}, [questions]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!questions || questions.length === 0) return;

			if (e.key === "ArrowLeft" && currentQuestionIndex > 0) {
				const newIndex = currentQuestionIndex - 1;
				setCurrentQuestionIndex(newIndex);
				setGridPage(Math.floor(newIndex / GRID_SIZE));
			} else if (e.key === "ArrowRight" && currentQuestionIndex < questions.length - 1) {
				const newIndex = currentQuestionIndex + 1;
				setCurrentQuestionIndex(newIndex);
				setGridPage(Math.floor(newIndex / GRID_SIZE));
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [currentQuestionIndex, questions]);

	const handleQuestionClick = (index: number) => {
		setCurrentQuestionIndex(index);
		setGridPage(Math.floor(index / GRID_SIZE));
	};

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-64 w-full rounded-xl" />
			</div>
		);
	}

	if (!questions || questions.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center space-y-6 rounded-xl border border-dashed py-16 text-center">
				<img src="/avatar/confused-avatar.webp" alt="No questions" className="h-32 w-auto sm:h-40" />
				<div className="space-y-2">
					<h3 className="font-bold text-foreground text-xl">This pack is empty</h3>
					<p className="text-muted-foreground">Add questions to get started.</p>
				</div>
				<Button onClick={onCreateNew} size="lg" className="gap-2">
					<PlusIcon className="size-4" />
					Create First Question
				</Button>
			</div>
		);
	}

	const currentQuestion = questions[currentQuestionIndex];
	const totalGridPages = Math.ceil(questions.length / GRID_SIZE);
	const startIndex = gridPage * GRID_SIZE;
	const endIndex = Math.min(startIndex + GRID_SIZE, questions.length);
	const visibleQuestions = questions.slice(startIndex, endIndex);

	if (!currentQuestion) return null;

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-6 lg:flex-row">
				<div className="flex-1 lg:order-1">
					<Card className="overflow-hidden border-none py-0 shadow-md">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 bg-muted/30 py-4">
							<div className="space-y-1">
								<CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
									<div className="flex size-7 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-xs shadow-sm">
										{currentQuestionIndex + 1}
									</div>
									Question Content
								</CardTitle>
								<CardDescription className="text-xs sm:text-sm">Review and manage this question.</CardDescription>
							</div>
							<div className="rounded-md bg-background px-2 py-1 font-mono text-[10px] text-muted-foreground shadow-sm ring-1 ring-border sm:py-1.5 sm:text-xs">
								ID: {currentQuestion.id}
							</div>
						</CardHeader>
						<CardContent className="space-y-6 py-6">
							<div className="prose prose-sm max-w-none rounded-lg border bg-card p-4 shadow-sm">
								<TiptapRenderer content={currentQuestion?.content} />
							</div>

							<div>
								<h4 className="mb-3 font-semibold text-muted-foreground text-sm uppercase tracking-wider">
									Answer Options
								</h4>
								<div className="grid gap-3 sm:grid-cols-2">
									{currentQuestion?.answers?.map((answer) => (
										<div
											key={answer.id}
											className={cn(
												"relative flex items-start gap-3 rounded-lg border p-4 transition-all",
												answer.isCorrect
													? "border-green-500 bg-green-50/50 shadow-sm dark:bg-green-950/20"
													: "hover:border-primary/50",
											)}
										>
											<div
												className={cn(
													"flex size-6 shrink-0 items-center justify-center rounded-full font-bold text-xs",
													answer.isCorrect ? "bg-green-500 text-white" : "bg-muted text-muted-foreground",
												)}
											>
												{answer.code}
											</div>
											<p className="flex-1 text-sm">{answer.content}</p>
											{answer.isCorrect && (
												<div className="absolute top-2 right-2">
													<span className="sr-only">Correct</span>
													<div className="size-2 rounded-full bg-green-500" />
												</div>
											)}
										</div>
									))}
								</div>
							</div>

							<div className="rounded-lg bg-muted/50 p-4">
								<h4 className="mb-2 font-semibold text-muted-foreground text-sm uppercase tracking-wider">
									Discussion
								</h4>
								<div className="prose prose-sm max-w-none text-muted-foreground">
									<TiptapRenderer content={currentQuestion?.discussion} />
								</div>
							</div>

							<div className="flex items-center justify-end gap-2 border-t pt-6">
								<Button
									variant="outline"
									size="icon"
									onClick={() => {
										navigate({
											to: "/admin/questions/$id",
											params: { id: currentQuestion.id.toString() },
										});
									}}
									title="Edit Question Content"
								>
									<PencilSimple className="size-4" />
								</Button>
								<RemoveQuestionButton packId={packId} question={currentQuestion} />
							</div>

							<div className="flex items-center justify-between border-t pt-4">
								<Button
									variant="ghost"
									size="sm"
									className="gap-2"
									onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
									disabled={currentQuestionIndex === 0}
								>
									<CaretLeftIcon className="size-4" />
									Previous
								</Button>
								<span className="font-medium text-muted-foreground text-xs">
									{currentQuestionIndex + 1} of {questions.length}
								</span>
								<Button
									variant="ghost"
									size="sm"
									className="gap-2"
									onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
									disabled={currentQuestionIndex === questions.length - 1}
								>
									Next
									<CaretRightIcon className="size-4" />
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="lg:order-2 lg:w-72">
					<Card className="sticky top-24 rounded-xl border-none py-0 shadow-md">
						<CardHeader className="bg-muted/30 py-4">
							<div className="flex items-center justify-between">
								<div className="space-y-1">
									<CardTitle className="text-base sm:text-lg">Navigator</CardTitle>
									<CardDescription className="text-xs">Jump to a question</CardDescription>
								</div>
								{totalGridPages > 1 && (
									<span className="rounded-full bg-background px-2 py-0.5 font-medium text-[10px] text-muted-foreground shadow-sm ring-1 ring-border sm:text-xs">
										{gridPage + 1}/{totalGridPages}
									</span>
								)}
							</div>
						</CardHeader>
						<CardContent className="py-5">
							<div className="grid grid-cols-5 gap-2">
								{visibleQuestions.map((question, idx) => {
									const absoluteIndex = startIndex + idx;
									const originalIndex = questions.findIndex((q) => q.id === question.id);
									const displayNumber = originalIndex + 1;
									const isActive = absoluteIndex === currentQuestionIndex;

									return (
										<button
											key={question.id}
											type="button"
											onClick={() => handleQuestionClick(absoluteIndex)}
											className={cn(
												"flex aspect-square w-full items-center justify-center rounded-lg border text-sm transition-all",
												isActive
													? "scale-105 border-primary bg-primary font-bold text-primary-foreground shadow-md"
													: "hover:border-primary/50 hover:bg-muted",
											)}
										>
											{displayNumber}
										</button>
									);
								})}
							</div>

							{totalGridPages > 1 && (
								<div className="mt-4 flex items-center justify-between border-t pt-3">
									<Button
										variant="ghost"
										size="icon"
										className="size-8"
										onClick={() => setGridPage(gridPage - 1)}
										disabled={gridPage === 0}
									>
										<CaretLeftIcon className="size-4" />
									</Button>
									<span className="text-muted-foreground text-xs">
										{startIndex + 1}-{endIndex}
									</span>
									<Button
										variant="ghost"
										size="icon"
										className="size-8"
										onClick={() => setGridPage(gridPage + 1)}
										disabled={gridPage === totalGridPages - 1}
									>
										<CaretRightIcon className="size-4" />
									</Button>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

function RemoveQuestionButton({
	packId,
	question,
}: {
	packId: number;
	question: {
		id: number;
		content: unknown;
		discussion: unknown;
		order: number | null;
	};
}) {
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const queryClient = useQueryClient();

	const removeMutation = useMutation(
		orpc.admin.practicePack.removeQuestionFromPack.mutationOptions({
			onSuccess: () => {
				toast.success("Question removed from pack");
				queryClient.invalidateQueries(
					orpc.admin.practicePack.getPackQuestions.queryOptions({
						input: { id: packId },
					}),
				);
				setDeleteDialogOpen(false);
			},
			onError: (error) => {
				toast.error("Failed to remove question", {
					description: String(error),
				});
			},
		}),
	);

	const handleRemove = () => {
		removeMutation.mutate({ practicePackId: packId, questionId: question.id });
	};

	return (
		<>
			<Button variant="destructive" size="icon" onClick={() => setDeleteDialogOpen(true)} title="Remove from Pack">
				<Trash className="size-4" />
			</Button>

			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove Question from Pack?</AlertDialogTitle>
						<AlertDialogDescription>
							This will remove the question from this practice pack. The question will still exist in the question bank.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleRemove}
							disabled={removeMutation.isPending}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{removeMutation.isPending ? "Removing..." : "Remove"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
