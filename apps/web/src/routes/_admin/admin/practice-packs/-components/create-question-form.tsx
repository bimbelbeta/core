import { PlusIcon, XIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type } from "arktype";
import { useState } from "react";
import { toast } from "sonner";
import TiptapSimpleEditor from "@/components/tiptap-simple-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { orpc } from "@/utils/orpc";

const ANSWER_CODES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"] as const;

interface CreateQuestionFormProps {
	practicePackId: number;
	onSuccess?: () => void;
	onCancel?: () => void;
}

type AnswerOption = {
	code: string;
	content: string;
	isCorrect: boolean;
};

export function CreateQuestionForm({ practicePackId, onSuccess, onCancel }: CreateQuestionFormProps) {
	const queryClient = useQueryClient();

	const [answerOptions, setAnswerOptions] = useState<AnswerOption[]>([
		{ code: "A", content: "", isCorrect: false },
		{ code: "B", content: "", isCorrect: false },
		{ code: "C", content: "", isCorrect: false },
		{ code: "D", content: "", isCorrect: false },
	]);

	const createQuestionMutation = useMutation(orpc.admin.practicePack.createQuestion.mutationOptions());

	const createAnswerMutation = useMutation(orpc.admin.practicePack.createAnswerOption.mutationOptions());

	const addToPackMutation = useMutation(orpc.admin.practicePack.addQuestionToPack.mutationOptions());

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
				const question = await createQuestionMutation.mutateAsync({
					content: value.content,
					discussion: value.discussion,
				});

				await Promise.all(
					answerOptions.map((option) =>
						createAnswerMutation.mutateAsync({
							questionId: question.id,
							code: option.code,
							content: option.content,
							isCorrect: option.isCorrect,
						}),
					),
				);

				await addToPackMutation.mutateAsync({
					practicePackId,
					questionId: question.id,
				});

				toast.success("Question created successfully");
				queryClient.invalidateQueries(
					orpc.admin.practicePack.getPackQuestions.queryOptions({ input: { id: practicePackId } }),
				);
				form.reset();
				setAnswerOptions([
					{ code: "A", content: "", isCorrect: false },
					{ code: "B", content: "", isCorrect: false },
					{ code: "C", content: "", isCorrect: false },
					{ code: "D", content: "", isCorrect: false },
				]);
				onSuccess?.();
			} catch (error) {
				toast.error("Failed to create question", {
					description: String(error),
				});
			}
		},
	});

	const isSubmitting =
		createQuestionMutation.isPending || createAnswerMutation.isPending || addToPackMutation.isPending;

	const addAnswerOption = () => {
		if (answerOptions.length >= 10) {
			toast.error("Maximum 10 answer options allowed");
			return;
		}
		const nextCode = ANSWER_CODES[answerOptions.length];
		if (!nextCode) return;
		setAnswerOptions([...answerOptions, { code: nextCode, content: "", isCorrect: false }]);
	};

	const removeAnswerOption = (index: number) => {
		if (answerOptions.length <= 2) {
			toast.error("Minimum 2 answer options required");
			return;
		}
		const newOptions = answerOptions.filter((_, i) => i !== index);
		// Reassign codes after removal
		const reassignedOptions = newOptions.map((option, idx) => {
			const code = ANSWER_CODES[idx];
			if (!code) return option;
			return {
				...option,
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
		<Card>
			<CardHeader>
				<CardTitle>Create New Question</CardTitle>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
					className="space-y-6"
				>
					<form.Field name="content">
						{(field) => (
							<div>
								<Label htmlFor="content">Question Content *</Label>
								<div className="mt-2 rounded-md border">
									<TiptapSimpleEditor
										content={field.state.value as object}
										onChange={(content) => field.handleChange(content)}
									/>
								</div>{" "}
							</div>
						)}
					</form.Field>

					<form.Field name="discussion">
						{(field) => (
							<div>
								<Label htmlFor="discussion">Discussion / Explanation *</Label>
								<div className="mt-2 rounded-md border">
									<TiptapSimpleEditor
										content={field.state.value as object}
										onChange={(content) => field.handleChange(content)}
									/>
								</div>
							</div>
						)}
					</form.Field>

					<div>
						<div className="mb-4 flex items-center justify-between">
							<h3 className="font-medium">Answer Options *</h3>
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={addAnswerOption}
								disabled={answerOptions.length >= 10}
							>
								<PlusIcon className="mr-1 size-4" />
								Add Option
							</Button>
						</div>
						<div className="space-y-3">
							{answerOptions.map((option, index) => (
								<div key={option.code} className="flex items-start gap-2">
									<div className="mt-2 flex items-center gap-2">
										<span className="font-medium text-sm">{option.code}.</span>
										<Checkbox
											checked={option.isCorrect}
											onCheckedChange={(checked) => updateAnswerOption(index, "isCorrect", !!checked)}
										/>
									</div>
									<Input
										value={option.content}
										onChange={(e) => updateAnswerOption(index, "content", e.target.value)}
										placeholder={`Option ${option.code}`}
										className="flex-1"
									/>
									{answerOptions.length > 2 && (
										<Button
											type="button"
											size="icon"
											variant="ghost"
											onClick={() => removeAnswerOption(index)}
											className="mt-1 size-8 shrink-0"
										>
											<XIcon className="size-4" />
										</Button>
									)}
								</div>
							))}
						</div>
						<p className="mt-2 text-muted-foreground text-xs">
							Check the box to mark as correct answer. At least 2 options required.
						</p>
					</div>

					<div className="flex gap-2">
						<Button type="submit" disabled={isSubmitting} className="flex-1">
							{isSubmitting ? <>Creating...</> : "Create Question"}
						</Button>
						<Button type="button" variant="outline" onClick={onCancel}>
							Cancel
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
