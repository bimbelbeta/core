import { FloppyDiskIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type } from "arktype";
import { useState } from "react";
import { toast } from "sonner";
import {
	AdminBackButton,
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderActions,
	AdminPageHeaderContent,
	AdminPageRoot,
	AdminSection,
} from "@/components/admin/admin-page";
import TiptapSimpleEditor from "@/components/tiptap/tiptap-simple-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/ui/tag-input";
import { Typography } from "@/components/ui/typography";
import { orpc } from "@/lib/orpc";
import { QUESTION_TYPE_SHORT_LABELS } from "@/lib/schemas";
import { MultipleChoiceComplexQuestionForm } from "./multiple-choice-complex-question-form";
import { MultipleChoiceQuestionForm } from "./multiple-choice-question-form";
import type { Choice } from "./types";

interface EditQuestionFormProps {
	question: {
		id: number;
		type: "multiple_choice" | "multiple_choice_complex" | "essay";
		content: Record<string, unknown>;
		discussion: Record<string, unknown>;
		essayCorrectAnswer?: string;
		tags?: string[];
	};
	initialChoices: Choice[];
	onSuccess: () => void;
	onCancel: () => void;
}

export function EditQuestionForm({ question, initialChoices, onSuccess, onCancel }: EditQuestionFormProps) {
	const queryClient = useQueryClient();
	const [choices, setChoices] = useState<Choice[]>(initialChoices);

	const form = useForm({
		defaultValues: {
			content: question.content,
			discussion: question.discussion,
			essayCorrectAnswer: question.essayCorrectAnswer ?? "",
			tags: question.tags ?? ([] as string[]),
		},
		onSubmit: async ({ value }) => {
			const choicesPayload =
				question.type === "multiple_choice" || question.type === "multiple_choice_complex" ? choices : undefined;

			updateMutation.mutate({
				id: question.id,
				content: value.content,
				discussion: value.discussion,
				essayCorrectAnswer: question.type === "essay" ? value.essayCorrectAnswer : undefined,
				tags: value.tags.length > 0 ? value.tags : undefined,
				choices: choicesPayload?.map((c) => ({
					id: c.id > 0 ? c.id : undefined,
					content: c.content,
					isCorrect: c.isCorrect,
				})),
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

	const updateMutation = useMutation(
		orpc.admin.tryout.questions.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.admin.tryout.questions.find.queryKey({ input: { id: question.id } }),
				});
				toast.success("Soal berhasil diperbarui");
				onSuccess();
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<AdminBackButton onClick={onCancel}>Kembali</AdminBackButton>
					<Typography variant="title">Edit soal #{question.id}</Typography>
				</AdminPageHeaderContent>
				<AdminPageHeaderActions>
					<Button type="button" variant="outline" size="xs" onClick={onCancel}>
						Batal
					</Button>
					<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
						{([canSubmit, isSubmitting]) => (
							<Button
								type="submit"
								form="edit-question-form"
								size="xs"
								isPending={isSubmitting}
								disabled={!canSubmit || isSubmitting}
							>
								<FloppyDiskIcon className="size-3.5" />
								Simpan perubahan
							</Button>
						)}
					</form.Subscribe>
				</AdminPageHeaderActions>
			</AdminPageHeader>

			<AdminPageContent>
				<form
					id="edit-question-form"
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
					className="flex flex-col gap-4"
				>
					<div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_14rem]">
						<div className="flex min-w-0 flex-col gap-4">
							<AdminSection title="Konten soal" description="Pertanyaan yang dibaca peserta.">
								<form.Field name="content">
									{(field) => (
										<TiptapSimpleEditor
											label="Konten soal"
											content={field.state.value ?? undefined}
											onChange={(content) => field.handleChange(content)}
										/>
									)}
								</form.Field>
							</AdminSection>

							<AdminSection
								title="Jawaban"
								description={
									question.type === "essay"
										? "Kunci jawaban acuan penilaian esai."
										: "Pilihan bertanda benar adalah kunci jawaban."
								}
							>
								{question.type === "multiple_choice" ? (
									<MultipleChoiceQuestionForm choices={choices} onChoicesChange={setChoices} />
								) : question.type === "multiple_choice_complex" ? (
									<MultipleChoiceComplexQuestionForm choices={choices} onChoicesChange={setChoices} />
								) : (
									<form.Field name="essayCorrectAnswer">
										{(field) => (
											<div className="flex flex-col gap-1.5">
												<Label htmlFor={field.name}>Kunci jawaban</Label>
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
							</AdminSection>

							<AdminSection title="Pembahasan" description="Tampil untuk peserta setelah soal selesai.">
								<form.Field name="discussion">
									{(field) => (
										<TiptapSimpleEditor
											label="Pembahasan"
											content={field.state.value ?? undefined}
											onChange={(content) => field.handleChange(content)}
										/>
									)}
								</form.Field>
							</AdminSection>
						</div>

						<aside className="flex min-w-0 flex-col gap-4">
							<AdminSection title="Detail">
								<dl className="flex flex-col gap-2.5">
									<div className="flex items-baseline justify-between gap-3">
										<dt className="text-muted-foreground text-meta">Jenis</dt>
										<dd className="text-meta text-right font-medium">
											{QUESTION_TYPE_SHORT_LABELS[question.type] ?? question.type}
										</dd>
									</div>
									{question.type !== "essay" && (
										<div className="flex items-baseline justify-between gap-3">
											<dt className="text-muted-foreground text-meta">Pilihan</dt>
											<dd className="text-meta text-right font-medium tabular-nums">{choices.length}</dd>
										</div>
									)}
								</dl>
							</AdminSection>

							<AdminSection title="Tags" description="Memudahkan penyaringan di bank soal.">
								<form.Field name="tags">
									{(field) => (
										<TagInput
											value={field.state.value}
											onChange={(tags) => field.handleChange(tags)}
											placeholder="Tambah tag..."
											maxLength={10}
										/>
									)}
								</form.Field>
							</AdminSection>
						</aside>
					</div>
				</form>
			</AdminPageContent>
		</AdminPageRoot>
	);
}
