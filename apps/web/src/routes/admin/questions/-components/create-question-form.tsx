import { ArrowLeftIcon, FloppyDiskIcon, XIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { type } from "arktype";
import { useState } from "react";
import { toast } from "sonner";
import {
	AdminFormShell,
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderContent,
	AdminPageRoot,
	AdminSection,
} from "@/components/admin/admin-page";
import TiptapSimpleEditor from "@/components/tiptap/tiptap-simple-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TagInput } from "@/components/ui/tag-input";
import { Typography } from "@/components/ui/typography";
import { orpc } from "@/lib/orpc";
import { QUESTION_TYPE_SHORT_LABELS, type QuestionType, questionTypeSchema } from "@/lib/schemas";
import { MultipleChoiceComplexQuestionForm } from "./multiple-choice-complex-question-form";
import { MultipleChoiceQuestionForm } from "./multiple-choice-question-form";
import type { Choice } from "./types";

interface CreateQuestionFormProps {
	questionType: "multiple_choice" | "multiple_choice_complex" | "essay";
	subtestId?: number;
	onSuccess: () => void;
	onCancel: () => void;
}

export function CreateQuestionForm({
	questionType: initialType,
	subtestId,
	onSuccess,
	onCancel,
}: CreateQuestionFormProps) {
	const [questionType, setQuestionType] = useState<QuestionType>(initialType);

	const addQuestionToSubtestMutation = useMutation(
		orpc.admin.tryout.questionsBulk.addQuestionToSubtest.mutationOptions({
			onSuccess: () => {
				toast.success("Soal berhasil ditambahkan ke subtest");
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const defaultChoices: Choice[] = [];

	const form = useForm({
		defaultValues: {
			content: null as Record<string, unknown> | null,
			discussion: null as Record<string, unknown> | null,
			essayCorrectAnswer: "",
			tags: [] as string[],
			choices: defaultChoices,
		},
		onSubmit: async ({ value }) => {
			createMutation.mutate({
				type: questionType,
				content: value.content ?? "",
				discussion: value.discussion ?? "",
				essayCorrectAnswer: questionType === "essay" ? value.essayCorrectAnswer : undefined,
				tags: value.tags.length > 0 ? value.tags : undefined,
				choices:
					questionType === "multiple_choice" || questionType === "multiple_choice_complex" ? value.choices : undefined,
			});
		},
		validators: {
			onChange: type({
				content: "unknown",
				discussion: "unknown",
				essayCorrectAnswer: "string",
				tags: "string[]",
				choices: "unknown",
			}),
		},
	});

	const createMutation = useMutation(
		orpc.admin.tryout.questions.create.mutationOptions({
			onSuccess: async (result) => {
				toast.success("Soal berhasil dibuat");

				if (subtestId) {
					addQuestionToSubtestMutation.mutate({ subtestId, questionId: result.id });
				}

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
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="icon" aria-label="Batal" onClick={onCancel}>
							<ArrowLeftIcon className="size-4" />
						</Button>
						<Typography variant="title">Buat soal</Typography>
					</div>
					<Typography variant="body" tone="muted">
						Soal baru masuk ke bank soal dan subtest ini
					</Typography>
				</AdminPageHeaderContent>
			</AdminPageHeader>

			<AdminPageContent>
				<AdminFormShell>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
						className="flex flex-col gap-5"
					>
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

						<AdminSection title="Jawaban" description="Tipe soal menentukan bentuk kunci jawaban.">
							<Tabs
								value={questionType}
								onValueChange={(val) => {
									if (questionTypeSchema.allows(val)) setQuestionType(val);
								}}
							>
								<TabsList>
									<TabsTrigger value="multiple_choice">{QUESTION_TYPE_SHORT_LABELS.multiple_choice}</TabsTrigger>
									<TabsTrigger value="multiple_choice_complex">
										{QUESTION_TYPE_SHORT_LABELS.multiple_choice_complex}
									</TabsTrigger>
									<TabsTrigger value="essay">{QUESTION_TYPE_SHORT_LABELS.essay}</TabsTrigger>
								</TabsList>

								<TabsContent value="multiple_choice" className="mt-4">
									<form.Field name="choices">
										{(field) => (
											<MultipleChoiceQuestionForm
												choices={field.state.value}
												onChoicesChange={(newChoices) => field.handleChange(newChoices)}
											/>
										)}
									</form.Field>
								</TabsContent>

								<TabsContent value="multiple_choice_complex" className="mt-4">
									<form.Field name="choices">
										{(field) => (
											<MultipleChoiceComplexQuestionForm
												choices={field.state.value}
												onChoicesChange={(newChoices) => field.handleChange(newChoices)}
											/>
										)}
									</form.Field>
								</TabsContent>

								<TabsContent value="essay" className="mt-4">
									<form.Field
										name="essayCorrectAnswer"
										validators={{
											onChange: ({ value }: { value: string }) => {
												if (value.length > 15) {
													return "Kunci jawaban maksimal 15 karakter";
												}
												return undefined;
											},
										}}
									>
										{(field) => (
											<div className="flex flex-col gap-1.5">
												<Label htmlFor={field.name}>Kunci jawaban</Label>
												<Input
													id={field.name}
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
													placeholder="Masukkan kunci jawaban..."
													maxLength={15}
												/>
												{field.state.meta.errors.map((error, idx) => (
													<Typography
														key={typeof error === "string" ? error : `error-${idx}`}
														variant="caption"
														tone="destructive"
													>
														{typeof error === "string" ? error : (error as { message: string })?.message}
													</Typography>
												))}
											</div>
										)}
									</form.Field>
								</TabsContent>
							</Tabs>
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

						<div className="flex items-center justify-end gap-1">
							<Button type="button" variant="ghost" size="xs" onClick={onCancel}>
								<XIcon className="size-3.5" />
								Batal
							</Button>
							<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
								{([canSubmit, isSubmitting]) => (
									<Button isPending={isSubmitting} size="xs" type="submit" disabled={!canSubmit || isSubmitting}>
										<FloppyDiskIcon className="size-3.5" />
										Simpan soal
									</Button>
								)}
							</form.Subscribe>
						</div>
					</form>
				</AdminFormShell>
			</AdminPageContent>
		</AdminPageRoot>
	);
}
