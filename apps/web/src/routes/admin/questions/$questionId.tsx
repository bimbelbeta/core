import { ArrowLeftIcon, PencilSimpleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { TiptapRenderer } from "@/components/tiptap-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/utils/orpc";
import { EditQuestionForm } from "./-components/edit-question-form";

export const Route = createFileRoute("/admin/questions/$questionId")({
	component: QuestionDetailPage,
});

function QuestionDetailPage() {
	const { questionId } = Route.useParams();
	const id = Number(questionId);
	const router = useRouter();
	const [isEditing, setIsEditing] = useState(false);

	const { data, isPending, error, refetch } = useQuery(
		orpc.admin.tryout.questions.getQuestion.queryOptions({
			input: { id },
		}),
	);

	if (isPending) {
		return (
			<div className="flex h-full flex-col gap-6 p-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Skeleton className="size-10" />
						<Skeleton className="h-8 w-48" />
					</div>
					<Skeleton className="h-9 w-20" />
				</div>

				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<Skeleton className="h-6 w-40" />
							<Skeleton className="h-6 w-24" />
						</div>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-2">
							<Skeleton className="h-4 w-28" />
							<Skeleton className="h-32 w-full" />
						</div>
						<div className="space-y-2">
							<Skeleton className="h-4 w-32" />
							<div className="space-y-3">
								<Skeleton className="h-16 w-full" />
								<Skeleton className="h-16 w-full" />
								<Skeleton className="h-16 w-full" />
								<Skeleton className="h-16 w-full" />
							</div>
						</div>
						<div className="space-y-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-24 w-full" />
						</div>
						<div className="space-y-2">
							<Skeleton className="h-4 w-16" />
							<div className="flex gap-2">
								<Skeleton className="h-6 w-20" />
								<Skeleton className="h-6 w-24" />
								<Skeleton className="h-6 w-16" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex h-full flex-col gap-6 p-6">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={() => router.history.back()}>
						<ArrowLeftIcon className="size-4" />
					</Button>
					<h1 className="font-bold text-2xl text-primary-navy-900">Detail Soal</h1>
				</div>

				<Card className="flex flex-1 items-center justify-center">
					<CardContent className="flex flex-col items-center gap-4 py-12 text-center">
						<div className="flex size-16 items-center justify-center rounded-full bg-red-50">
							<WarningCircleIcon className="size-8 text-red-500" />
						</div>
						<div className="space-y-2">
							<h3 className="font-semibold text-lg">Gagal Memuat Soal</h3>
							<p className="max-w-md text-muted-foreground text-sm">
								{error.message ?? "Terjadi kesalahan saat memuat data soal. Silakan coba lagi."}
							</p>
						</div>
						<div className="flex gap-2">
							<Button variant="outline" onClick={() => router.history.back()}>
								Kembali
							</Button>
							<Button onClick={() => refetch()}>Coba Lagi</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!data) {
		throw notFound();
	}

	const { question, choices } = data;

	if (isEditing) {
		return (
			<EditQuestionForm
				question={{
					id: question.id,
					type: question.type,
					content: question.content as object,
					discussion: question.discussion as object,
					tags: question.tags ?? undefined,
				}}
				onSuccess={() => setIsEditing(false)}
				onCancel={() => setIsEditing(false)}
			/>
		);
	}

	return (
		<div className="flex h-full flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={() => router.history.back()}>
						<ArrowLeftIcon className="size-4" />
					</Button>
					<h1 className="font-bold text-2xl text-primary-navy-900">Detail Soal</h1>
				</div>
				<Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
					<PencilSimpleIcon className="mr-2 size-4" />
					Edit
				</Button>
			</div>

			<div className="grid gap-6">
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Informasi Soal #{question.id}</CardTitle>
							<Badge variant={question.type === "multiple_choice" ? "default" : "secondary"}>
								{question.type === "multiple_choice" ? "Pilihan Ganda" : "Esai"}
							</Badge>
						</div>
					</CardHeader>
					<CardContent className="space-y-6">
						<div>
							<h3 className="mb-2 font-medium text-muted-foreground text-sm">Konten Soal</h3>
							<TiptapRenderer content={question.content} className="prose prose-sm max-w-none rounded-md border p-4" />
						</div>

						{question.type === "multiple_choice" && choices && (
							<div>
								<h3 className="mb-2 font-medium text-muted-foreground text-sm">Pilihan Jawaban</h3>
								<div className="space-y-3">
									{choices.map((choice) => (
										<div
											key={choice.id}
											className={`flex items-start gap-3 rounded-lg border p-3 ${
												choice.isCorrect ? "border-green-200 bg-green-50" : ""
											}`}
										>
											<div
												className={`flex size-6 shrink-0 items-center justify-center rounded-full border font-bold text-xs ${
													choice.isCorrect
														? "border-green-600 bg-green-500 text-white"
														: "bg-muted text-muted-foreground"
												}`}
											>
												{choice.code}
											</div>
											<div className="flex-1">
												<p className="text-sm">{choice.content}</p>
											</div>
											{choice.isCorrect && (
												<Badge variant="outline" className="ml-auto border-green-200 bg-green-100 text-green-700">
													Benar
												</Badge>
											)}
										</div>
									))}
								</div>
							</div>
						)}

						{question.discussion && (
							<div>
								<h3 className="mb-2 font-medium text-muted-foreground text-sm">Pembahasan</h3>
								<TiptapRenderer
									content={question.discussion}
									className="prose prose-sm max-w-none rounded-md border bg-muted/30 p-4"
								/>
							</div>
						)}

						{question.tags && question.tags.length > 0 && (
							<div>
								<h3 className="mb-2 font-medium text-muted-foreground text-sm">Tags</h3>
								<div className="flex flex-wrap gap-2">
									{question.tags.map((tag) => (
										<Badge key={tag} variant="outline">
											{tag}
										</Badge>
									))}
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
