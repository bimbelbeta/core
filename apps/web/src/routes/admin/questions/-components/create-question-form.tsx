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
	AdminPageHeaderActions,
	AdminPageHeaderContent,
	AdminPageRoot,
} from "@/components/admin/admin-page";
import TiptapSimpleEditor from "@/components/tiptap/tiptap-simple-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TagInput } from "@/components/ui/tag-input";
import { Typography } from "@/components/ui/typography";
import { orpc } from "@/lib/orpc";
import { QUESTION_TYPE_LABELS, type QuestionType, questionTypeSchema } from "@/lib/schemas";
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
					<div className="flex items-center gap-3">
						<Button variant="ghost" size="icon" aria-label="Batal" onClick={onCancel}>
							<ArrowLeftIcon className="size-4" />
						</Button>
						<Typography variant="title">Buat Soal</Typography>
					</div>
				</AdminPageHeaderContent>
				<AdminPageHeaderActions>
					<Button type="button" variant="ghost" size="sm" onClick={onCancel}>
						<XIcon className="size-3.5" />
						Batal
					</Button>
					<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
						{([canSubmit, isSubmitting]) => (
							<Button
								isPending={isSubmitting}
								size="sm"
								type="button"
								disabled={!canSubmit || isSubmitting}
								onClick={() => form.handleSubmit()}
							>
								<FloppyDiskIcon className="size-3.5" />
								Simpan Soal
							</Button>
						)}
					</form.Subscribe>
				</AdminPageHeaderActions>
			</AdminPageHeader>

			<AdminPageContent>
				<AdminFormShell className="max-w-[720px]">
					<Card>
						<CardHeader>
							<CardTitle>Konten Soal</CardTitle>
						</CardHeader>
						<CardContent>
							<Tabs
								defaultValue={questionType}
								value={questionType}
								onValueChange={(val) => {
									if (questionTypeSchema.allows(val)) setQuestionType(val);
								}}
							>
								<TabsList>
									<TabsTrigger value="multiple_choice">{QUESTION_TYPE_LABELS.multiple_choice}</TabsTrigger>
									<TabsTrigger value="multiple_choice_complex">
										{QUESTION_TYPE_LABELS.multiple_choice_complex}
									</TabsTrigger>
									<TabsTrigger value="essay">{QUESTION_TYPE_LABELS.essay}</TabsTrigger>
								</TabsList>

								<TabsContent value="multiple_choice" className="mt-6">
									<form
										onSubmit={(e) => {
											e.preventDefault();
											form.handleSubmit();
										}}
										className="grid gap-5"
									>
										<form.Field name="content">
											{(field) => (
												<div className="grid gap-3">
													<Label>Konten Soal *</Label>
													<TiptapSimpleEditor
														label="Konten Soal"
														content={field.state.value ?? undefined}
														onChange={(content) => field.handleChange(content)}
													/>
												</div>
											)}
										</form.Field>

										<form.Field name="choices">
											{(field) => (
												<MultipleChoiceQuestionForm
													choices={field.state.value}
													onChoicesChange={(newChoices) => field.handleChange(newChoices)}
												/>
											)}
										</form.Field>

										<form.Field name="discussion">
											{(field) => (
												<div className="grid gap-3">
													<Label>Pembahasan</Label>
													<TiptapSimpleEditor
														label="Pembahasan"
														content={field.state.value ?? undefined}
														onChange={(content) => field.handleChange(content)}
													/>
												</div>
											)}
										</form.Field>

										<form.Field name="tags">
											{(field) => (
												<div className="grid gap-3">
													<Label>Tags</Label>
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
								</TabsContent>

								<TabsContent value="multiple_choice_complex" className="mt-6">
									<form
										onSubmit={(e) => {
											e.preventDefault();
											form.handleSubmit();
										}}
										className="grid gap-5"
									>
										<form.Field name="content">
											{(field) => (
												<div className="grid gap-3">
													<Label>Konten Soal *</Label>
													<TiptapSimpleEditor
														label="Konten Soal"
														content={field.state.value ?? undefined}
														onChange={(content) => field.handleChange(content)}
													/>
												</div>
											)}
										</form.Field>

										<form.Field name="choices">
											{(field) => (
												<MultipleChoiceComplexQuestionForm
													choices={field.state.value}
													onChoicesChange={(newChoices) => field.handleChange(newChoices)}
												/>
											)}
										</form.Field>

										<form.Field name="discussion">
											{(field) => (
												<div className="grid gap-3">
													<Label>Pembahasan</Label>
													<TiptapSimpleEditor
														label="Pembahasan"
														content={field.state.value ?? undefined}
														onChange={(content) => field.handleChange(content)}
													/>
												</div>
											)}
										</form.Field>

										<form.Field name="tags">
											{(field) => (
												<div className="grid gap-3">
													<Label>Tags</Label>
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
								</TabsContent>

								<TabsContent value="essay" className="mt-6">
									<form
										onSubmit={(e) => {
											e.preventDefault();
											form.handleSubmit();
										}}
										className="grid gap-5"
									>
										<form.Field name="content">
											{(field) => (
												<div className="grid gap-3">
													<Label>Konten Soal *</Label>
													<TiptapSimpleEditor
														label="Konten Soal"
														content={field.state.value ?? undefined}
														onChange={(content) => field.handleChange(content)}
													/>
												</div>
											)}
										</form.Field>

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
												<div className="grid gap-3">
													<Label htmlFor={field.name}>Kunci Jawaban *</Label>
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

										<form.Field name="discussion">
											{(field) => (
												<div className="grid gap-3">
													<Label>Pembahasan</Label>
													<TiptapSimpleEditor
														label="Pembahasan"
														content={field.state.value ?? undefined}
														onChange={(content) => field.handleChange(content)}
													/>
												</div>
											)}
										</form.Field>

										<form.Field name="tags">
											{(field) => (
												<div className="grid gap-3">
													<Label>Tags</Label>
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
								</TabsContent>
							</Tabs>
						</CardContent>
					</Card>
				</AdminFormShell>
			</AdminPageContent>
		</AdminPageRoot>
	);
}
