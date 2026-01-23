import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type } from "arktype";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import TiptapSimpleEditor from "@/components/tiptap-simple-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { TagInput } from "@/components/ui/tag-input";
import { orpc } from "@/utils/orpc";
import { MultipleChoiceQuestionForm } from "./MultipleChoiceQuestionForm";

interface EditQuestionFormProps {
	question: {
		id: number;
		type: "multiple_choice" | "essay";
		content: object;
		discussion: object;
		essayCorrectAnswer?: string;
		tags?: string[];
	};
	choices?: Array<{
		id: number;
		code: string;
		content: string;
		isCorrect: boolean;
	}>;
	onSuccess: () => void;
	onCancel: () => void;
}

export function EditQuestionForm({ question, choices = [], onSuccess, onCancel }: EditQuestionFormProps) {
	const queryClient = useQueryClient();
	const [updatingChoiceId, setUpdatingChoiceId] = useState<number | null>(null);
	const [deletingChoiceId, setDeletingChoiceId] = useState<number | null>(null);

	const form = useForm({
		defaultValues: {
			content: question.content,
			discussion: question.discussion,
			essayCorrectAnswer: question.essayCorrectAnswer ?? "",
			tags: question.tags ?? [],
		},
		onSubmit: async ({ value }) => {
			updateMutation.mutate({
				id: question.id,
				content: JSON.stringify(value.content),
				discussion: JSON.stringify(value.discussion),
				essayCorrectAnswer: question.type === "essay" ? value.essayCorrectAnswer : undefined,
				tags: value.tags.length > 0 ? value.tags : undefined,
			});
		},
		validators: {
			onChange: type({
				content: "unknown",
				discussion: "unknown",
				essayCorrectAnswer: "string",
				tags: "string[]",
			}),
		},
	});

	useEffect(() => {
		form.setFieldValue("content", question.content);
		form.setFieldValue("discussion", question.discussion);
		form.setFieldValue("essayCorrectAnswer", question.essayCorrectAnswer ?? "");
		if (question.tags) {
			form.setFieldValue("tags", question.tags);
		}
	}, [question, form]);

	const updateMutation = useMutation(
		orpc.admin.tryout.questions.updateQuestion.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.admin.tryout.questions.getQuestion.queryKey({ input: { id: question.id } }),
				});
				toast.success("Soal berhasil diperbarui");
				onSuccess();
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const updateChoiceMutation = useMutation(
		orpc.admin.tryout.questions.updateChoice.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.admin.tryout.questions.getQuestion.queryKey({ input: { id: question.id } }),
				});
				setUpdatingChoiceId(null);
			},
			onError: (err) => {
				toast.error(err.message);
				setUpdatingChoiceId(null);
			},
		}),
	);

	const createChoiceMutation = useMutation(
		orpc.admin.tryout.questions.createChoice.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.admin.tryout.questions.getQuestion.queryKey({ input: { id: question.id } }),
				});
				toast.success("Pilihan jawaban berhasil ditambahkan");
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const deleteChoiceMutation = useMutation(
		orpc.admin.tryout.questions.deleteChoice.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.admin.tryout.questions.getQuestion.queryKey({ input: { id: question.id } }),
				});
				setDeletingChoiceId(null);
			},
			onError: (err) => {
				toast.error(err.message);
				setDeletingChoiceId(null);
			},
		}),
	);

	const handleUpdateChoice = (choiceId: number, content: string, isCorrect: boolean) => {
		setUpdatingChoiceId(choiceId);

		if (isCorrect) {
			const currentCorrectChoice = choices.find((c) => c.isCorrect && c.id !== choiceId);
			if (currentCorrectChoice) {
				updateChoiceMutation.mutate(
					{ id: currentCorrectChoice.id, content: currentCorrectChoice.content, isCorrect: false },
					{
						onSuccess: () => {
							updateChoiceMutation.mutate({ id: choiceId, content, isCorrect: true });
						},
					},
				);
				return;
			}
		}

		updateChoiceMutation.mutate({ id: choiceId, content, isCorrect });
	};

	const handleAddChoice = () => {
		createChoiceMutation.mutate({
			questionId: question.id,
			content: "",
			isCorrect: false,
		});
	};

	const handleDeleteChoice = (choiceId: number) => {
		setDeletingChoiceId(choiceId);
		deleteChoiceMutation.mutate({ id: choiceId });
	};

	return (
		<div className="flex h-full flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={onCancel}>
						<ArrowLeftIcon className="size-4" />
					</Button>
					<h1 className="font-bold text-2xl text-primary-navy-900">Edit Soal #{question.id}</h1>
				</div>
				<div className="flex items-center gap-3">
					<Button type="button" variant="outline" onClick={onCancel}>
						Batal
					</Button>
					<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
						{([canSubmit, isSubmitting]) => (
							<Button type="submit" disabled={!canSubmit || isSubmitting} onClick={() => form.handleSubmit()}>
								{isSubmitting ? (
									<>
										<Spinner />
										Memperbarui...
									</>
								) : (
									"Simpan Perubahan"
								)}
							</Button>
						)}
					</form.Subscribe>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Edit Konten Soal</CardTitle>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
						className="grid gap-6"
					>
						<form.Field name="content">
							{(field) => (
								<div className="grid gap-2">
									<Label htmlFor={field.name}>Konten Soal *</Label>
									<TiptapSimpleEditor
										content={field.state.value ?? undefined}
										onChange={(content) => field.handleChange(content as object)}
									/>
								</div>
							)}
						</form.Field>

						{question.type === "multiple_choice" ? (
							<MultipleChoiceQuestionForm
								choices={choices}
								onUpdateChoice={handleUpdateChoice}
								onAddChoice={handleAddChoice}
								onDeleteChoice={handleDeleteChoice}
								updatingChoiceId={updatingChoiceId}
								deletingChoiceId={deletingChoiceId}
								createChoiceIsPending={createChoiceMutation.isPending}
							/>
						) : (
							<form.Field name="essayCorrectAnswer">
								{(field) => (
									<div className="grid gap-2">
										<Label htmlFor={field.name}>Kunci Jawaban *</Label>
										<Input
											id={field.name}
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Masukkan kunci jawaban..."
											required
										/>
									</div>
								)}
							</form.Field>
						)}

						<form.Field name="discussion">
							{(field) => (
								<div className="grid gap-2">
									<Label htmlFor={field.name}>Pembahasan</Label>
									<TiptapSimpleEditor
										content={field.state.value ?? undefined}
										onChange={(content) => field.handleChange(content as object)}
									/>
								</div>
							)}
						</form.Field>

						<form.Field name="tags">
							{(field) => (
								<div className="grid gap-2">
									<Label htmlFor={field.name}>Tags</Label>
									<TagInput
										value={field.state.value}
										onChange={(tags) => field.handleChange(tags)}
										placeholder="Tambah tag..."
										maxLength={10}
									/>
								</div>
							)}
						</form.Field>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
