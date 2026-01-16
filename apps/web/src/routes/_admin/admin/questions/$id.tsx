import { ArrowLeft, Plus, X } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type } from "arktype";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import TiptapSimpleEditor from "@/components/tiptap-simple-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_admin/admin/questions/$id")({
	component: QuestionEditPage,
});

const ANSWER_CODES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"] as const;

type AnswerOption = {
	id: number;
	code: string;
	content: string;
	isCorrect: boolean;
};

function QuestionEditPage() {
	const { id } = Route.useParams();
	const questionId = Number.parseInt(id, 10);
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [initializedQuestionId, setInitializedQuestionId] = useState<number | null>(null);
	const [answerOptions, setAnswerOptions] = useState<AnswerOption[]>([]);

	const { data: question, isLoading } = useQuery(
		orpc.admin.practicePack.getQuestionDetail.queryOptions({
			input: { id: questionId },
		}),
	);

	const updateQuestionMutation = useMutation(orpc.admin.practicePack.updateQuestion.mutationOptions());
	const updateAnswerMutation = useMutation(orpc.admin.practicePack.updateAnswerOption.mutationOptions());
	const createAnswerMutation = useMutation(orpc.admin.practicePack.createAnswerOption.mutationOptions());
	const deleteAnswerMutation = useMutation(orpc.admin.practicePack.deleteAnswerOption.mutationOptions());

	const form = useForm({
		defaultValues: {
			content: {} as unknown,
			discussion: {} as unknown,
		},
		onSubmit: async ({ value }) => {
			const validation = type({
				content: "object",
				discussion: "object",
			})(value);

			if (validation instanceof type.errors) {
				toast.error("Please fill all required fields");
				return;
			}

			// Validate answer options
			const hasEmptyContent = answerOptions.some((option) => !option.content.trim());
			if (hasEmptyContent) {
				toast.error("All answer options must have content");
				return;
			}

			const hasCorrectAnswer = answerOptions.some((option) => option.isCorrect);
			if (!hasCorrectAnswer) {
				toast.error("Please mark at least one answer as correct");
				return;
			}

			if (answerOptions.length < 2) {
				toast.error("Please add at least 2 answer options");
				return;
			}

			try {
				await updateQuestionMutation.mutateAsync({
					id: questionId,
					content: value.content,
					discussion: value.discussion,
				});

				// Update existing answers and create new ones
				await Promise.all(
					answerOptions.map((option) => {
						if (option.id > 0) {
							return updateAnswerMutation.mutateAsync({
								id: option.id,
								content: option.content,
								isCorrect: option.isCorrect,
							});
						}
						return createAnswerMutation.mutateAsync({
							questionId,
							code: option.code,
							content: option.content,
							isCorrect: option.isCorrect,
						});
					}),
				);

				toast.success("Question updated successfully");

				queryClient.invalidateQueries(
					orpc.admin.practicePack.getQuestionDetail.queryOptions({
						input: { id: questionId },
					}),
				);
				queryClient.invalidateQueries({
					queryKey: orpc.admin.practicePack.listAllQuestions.queryKey({ input: {} }),
				});

				setTimeout(() => {
					navigate({ to: "/admin/questions" });
				}, 500);
			} catch (error) {
				toast.error("Failed to update question", {
					description: String(error),
				});
			}
		},
	});

	useEffect(() => {
		setInitializedQuestionId(null);
		setAnswerOptions([]);
	}, []);

	useEffect(() => {
		if (question && question.id !== initializedQuestionId) {
			form.setFieldValue("content", question.content);
			form.setFieldValue("discussion", question.discussion);

			// Initialize answer options from question data
			const sortedAnswers = [...question.answers].sort((a, b) => {
				const codeA = ANSWER_CODES.indexOf(a.code as (typeof ANSWER_CODES)[number]);
				const codeB = ANSWER_CODES.indexOf(b.code as (typeof ANSWER_CODES)[number]);
				return codeA - codeB;
			});

			setAnswerOptions(
				sortedAnswers.map((ans) => ({
					id: ans.id,
					code: ans.code,
					content: ans.content,
					isCorrect: ans.isCorrect,
				})),
			);

			setInitializedQuestionId(question.id);
		}
	}, [question, initializedQuestionId, form.setFieldValue]);

	if (Number.isNaN(questionId)) {
		return (
			<main className="flex-1 p-4 pt-20 lg:ml-64 lg:p-8 lg:pt-8">
				<p className="text-destructive">Invalid question ID</p>
			</main>
		);
	}

	if (isLoading) {
		return (
			<main className="flex-1 p-4 pt-20 lg:ml-64 lg:p-8 lg:pt-8">
				<div className="mx-auto max-w-4xl">
					<Skeleton className="mb-6 h-10 w-64" />
					<Skeleton className="h-96 w-full" />
				</div>
			</main>
		);
	}

	if (!question) {
		return (
			<main className="flex-1 p-4 pt-20 lg:ml-64 lg:p-8 lg:pt-8">
				<div className="mx-auto max-w-4xl">
					<div className="mb-4 flex items-center gap-2 font-medium text-muted-foreground text-sm">
						<Link to="/admin/questions" className="hover:text-foreground">
							Question Bank
						</Link>
						<span>/</span>
						<span className="text-foreground">Question not found</span>
					</div>
					<p className="text-destructive">Question not found</p>
				</div>
			</main>
		);
	}

	const isSubmitting =
		updateQuestionMutation.isPending ||
		updateAnswerMutation.isPending ||
		createAnswerMutation.isPending ||
		deleteAnswerMutation.isPending;

	const addAnswerOption = () => {
		if (answerOptions.length >= 10) {
			toast.error("Maximum 10 answer options allowed");
			return;
		}
		const nextCode = ANSWER_CODES[answerOptions.length];
		if (!nextCode) return;
		setAnswerOptions([...answerOptions, { id: 0, code: nextCode, content: "", isCorrect: false }]);
	};

	const removeAnswerOption = async (index: number) => {
		if (answerOptions.length <= 2) {
			toast.error("Minimum 2 answer options required");
			return;
		}

		const option = answerOptions[index];
		if (!option) return;

		// If option has an ID, delete it from database
		if (option.id > 0) {
			try {
				await deleteAnswerMutation.mutateAsync({ id: option.id });
				toast.success("Answer option deleted");
			} catch (error) {
				toast.error("Failed to delete answer option", {
					description: String(error),
				});
				return;
			}
		}

		const newOptions = answerOptions.filter((_, i) => i !== index);
		// Reassign codes after removal
		const reassignedOptions = newOptions.map((opt, idx) => {
			const code = ANSWER_CODES[idx];
			if (!code) return opt;
			return {
				...opt,
				code,
			};
		});
		setAnswerOptions(reassignedOptions);
	};

	const updateAnswerOption = (index: number, field: keyof AnswerOption, value: string | boolean) => {
		const newOptions = [...answerOptions];
		const currentOption = newOptions[index];
		if (!currentOption) return;
		newOptions[index] = { ...currentOption, [field]: value };
		setAnswerOptions(newOptions);
	};

	return (
		<main className="flex-1 p-4 pt-20 lg:ml-64 lg:p-8 lg:pt-8">
			<div className="mx-auto max-w-4xl">
				{/* Breadcrumbs */}
				<div className="mb-4 flex items-center gap-2 font-medium text-muted-foreground text-sm">
					<Link to="/admin/questions" className="flex items-center gap-1 hover:text-foreground">
						<ArrowLeft className="size-3.5" />
						Back to Question Bank
					</Link>
				</div>

				<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="font-bold text-2xl tracking-tight sm:text-3xl">Edit Question</h1>
						<p className="text-muted-foreground text-sm">Update question content and answer options</p>
					</div>
				</div>

				<Card className="overflow-hidden rounded-xl py-0 shadow-sm">
					<CardHeader className="bg-muted/30 py-4">
						<CardTitle className="text-lg">Question Details</CardTitle>
					</CardHeader>
					<CardContent className="py-6">
						<form
							onSubmit={(e) => {
								e.preventDefault();
								form.handleSubmit();
							}}
							className="space-y-8"
						>
							<form.Field name="content">
								{(field) => (
									<div className="space-y-2">
										<Label
											htmlFor="content"
											className="font-bold text-muted-foreground text-sm uppercase tracking-wider"
										>
											Question Content *
										</Label>
										<div className="rounded-lg border bg-card p-1">
											<TiptapSimpleEditor
												content={field.state.value as object}
												onChange={(content) => field.handleChange(content)}
											/>
										</div>{" "}
									</div>
								)}
							</form.Field>{" "}
							<form.Field name="discussion">
								{(field) => (
									<div className="space-y-2">
										<Label
											htmlFor="discussion"
											className="font-bold text-muted-foreground text-sm uppercase tracking-wider"
										>
											Discussion / Explanation *
										</Label>
										<div className="rounded-lg border bg-muted/20 p-1">
											<TiptapSimpleEditor
												content={field.state.value as object}
												onChange={(content) => field.handleChange(content)}
											/>
										</div>
									</div>
								)}
							</form.Field>
							<div className="space-y-4">
								<div className="flex items-center justify-between border-b pb-2">
									<h3 className="font-bold text-muted-foreground text-sm uppercase tracking-wider">Answer Options *</h3>
									<Button
										type="button"
										size="sm"
										variant="outline"
										onClick={addAnswerOption}
										disabled={answerOptions.length >= 10}
										className="h-8"
									>
										<Plus className="mr-1 size-4" />
										Add Option
									</Button>
								</div>
								<div className="grid gap-3 sm:grid-cols-2">
									{answerOptions.map((option, index) => (
										<div
											key={`${option.code}-${option.id}`}
											className={cn(
												"relative flex items-start gap-3 rounded-lg border p-4 transition-all",
												option.isCorrect
													? "border-green-500 bg-green-50/50 shadow-sm dark:bg-green-950/20"
													: "hover:border-primary/50",
											)}
										>
											<div className="flex flex-col items-center gap-3 pt-1">
												<span
													className={cn(
														"flex size-6 shrink-0 items-center justify-center rounded-full font-bold text-xs",
														option.isCorrect ? "bg-green-500 text-white" : "bg-muted text-muted-foreground",
													)}
												>
													{option.code}
												</span>
												<Checkbox
													checked={option.isCorrect}
													onCheckedChange={(checked) => updateAnswerOption(index, "isCorrect", !!checked)}
													className="size-4"
												/>
											</div>
											<div className="flex flex-1 flex-col gap-2">
												<textarea
													value={option.content}
													onChange={(e) => updateAnswerOption(index, "content", e.target.value)}
													placeholder={`Option ${option.code}`}
													className="min-h-[80px] w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
												/>
											</div>
											{answerOptions.length > 2 && (
												<Button
													type="button"
													size="icon"
													variant="ghost"
													onClick={() => removeAnswerOption(index)}
													className="size-7 text-muted-foreground hover:text-destructive"
												>
													<X className="size-4" />
												</Button>
											)}
										</div>
									))}
								</div>
								<p className="font-medium text-[10px] text-muted-foreground italic">
									Check the box to mark as correct answer. At least 2 options required.
								</p>
							</div>
							<div className="flex gap-3 border-t pt-6">
								<Button type="submit" disabled={isSubmitting} className="flex-1 shadow-sm">
									{isSubmitting ? <>Saving Changes...</> : "Save Changes"}
								</Button>
								<Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/questions" })}>
									Cancel
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
