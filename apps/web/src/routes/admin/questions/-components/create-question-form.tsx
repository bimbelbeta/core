import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { type } from "arktype";
import { useState } from "react";
import { toast } from "sonner";
import TiptapSimpleEditor from "@/components/tiptap-simple-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TagInput } from "@/components/ui/tag-input";
import { orpc } from "@/utils/orpc";
import { MultipleChoiceQuestionForm } from "./MultipleChoiceQuestionForm";

interface CreateQuestionFormProps {
	questionType: "multiple_choice" | "essay";
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
	const [questionType, setQuestionType] = useState<"multiple_choice" | "essay">(initialType);

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

	const form = useForm({
		defaultValues: {
			content: null as object | null,
			discussion: null as object | null,
			essayCorrectAnswer: "",
			tags: [] as string[],
		},
		onSubmit: async ({ value }) => {
			createMutation.mutate({
				type: questionType,
				content: value.content ?? "",
				discussion: value.discussion ?? "",
				essayCorrectAnswer: questionType === "essay" ? value.essayCorrectAnswer : undefined,
				tags: value.tags.length > 0 ? value.tags : undefined,
				choices: questionType === "multiple_choice" ? [] : undefined,
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

	const createMutation = useMutation(
		orpc.admin.tryout.questions.createQuestion.mutationOptions({
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
		<div className="flex h-full flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={onCancel}>
						<ArrowLeftIcon className="size-4" />
					</Button>
					<h1 className="font-bold text-2xl text-primary-navy-900">Buat Soal</h1>
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
										Membuat...
									</>
								) : (
									"Simpan Soal"
								)}
							</Button>
						)}
					</form.Subscribe>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Konten Soal</CardTitle>
				</CardHeader>
				<CardContent>
					<Tabs
						defaultValue={questionType}
						value={questionType}
						onValueChange={(val) => setQuestionType(val as "multiple_choice" | "essay")}
					>
						<TabsList>
							<TabsTrigger value="multiple_choice">Pilihan Ganda</TabsTrigger>
							<TabsTrigger value="essay">Esai</TabsTrigger>
						</TabsList>

						<TabsContent value="multiple_choice" className="mt-6">
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

								<MultipleChoiceQuestionForm />

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
						</TabsContent>

						<TabsContent value="essay" className="mt-6">
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

								<form.Field
									name="essayCorrectAnswer"
									validators={{
										onChange: ({ value }) => {
											if (value.length > 15) {
												return "Kunci jawaban maksimal 15 karakter";
											}
											return undefined;
										},
									}}
								>
									{(field) => (
										<div className="grid gap-2">
											<Label htmlFor={field.name}>Kunci Jawaban *</Label>
											<Input
												id={field.name}
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder="Masukkan kunci jawaban..."
												maxLength={15}
											/>
											{field.state.meta.errors.map((error, idx) => (
												<p key={typeof error === "string" ? error : `error-${idx}`} className="text-red-500 text-xs">
													{typeof error === "string" ? error : error?.message}
												</p>
											))}
										</div>
									)}
								</form.Field>

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
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}
