import { ArrowLeftIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { DetailPageSkeleton } from "@/components/admin/detail-page-skeleton";
import { TiptapRenderer } from "@/components/tiptap/tiptap-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { orpc } from "@/lib/orpc";
import { parseRouteParamToNumber } from "@/lib/tanstack-router-utils";
import { cn } from "@/lib/utils";
import { EditQuestionForm } from "./-components/edit-question-form";

export const Route = createFileRoute("/admin/questions/$questionId")({
	staticData: { breadcrumb: "Detail Soal" },
	component: QuestionDetailPage,
});

function QuestionDetailPage() {
	const { questionId: rawQuestionId } = Route.useParams();
	const questionId = parseRouteParamToNumber(rawQuestionId);
	const router = useRouter();
	const [isEditing, setIsEditing] = useState(false);

	const { data, isPending } = useQuery(
		orpc.admin.tryout.questions.find.queryOptions({
			input: { id: questionId },
		}),
	);

	if (isPending) {
		return <DetailPageSkeleton variant="question" />;
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
					content: question.content as Record<string, unknown>,
					discussion: question.discussion as Record<string, unknown>,
					essayCorrectAnswer: question.essayCorrectAnswer ?? undefined,
					tags: question.tags ?? undefined,
				}}
				initialChoices={choices ?? []}
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
							<Badge
								variant={
									question.type === "multiple_choice" || question.type === "multiple_choice_complex"
										? "default"
										: "secondary"
								}
							>
								{question.type === "multiple_choice"
									? "Pilihan Ganda"
									: question.type === "multiple_choice_complex"
										? "Pilihan Ganda Kompleks"
										: "Esai"}
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
								<div className="flex flex-col gap-2">
									{choices.map((choice) => (
										<div
											key={choice.id}
											className={cn(
												"flex items-center gap-3 rounded-md border p-4 text-start",
												choice.isCorrect ? "border-green-500 bg-green-50" : "border-border",
											)}
										>
											<span
												className={cn(
													"rounded-xs border border-foreground/20 px-2.5 py-0.5 font-medium text-sm",
													choice.isCorrect && "border-green-500 bg-green-500 text-white",
												)}
											>
												{choice.code}
											</span>
											<span className="flex-1 text-sm">{choice.content}</span>
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

						{question.type === "multiple_choice_complex" && choices && (
							<div>
								<h3 className="mb-2 font-medium text-muted-foreground text-sm">Pilihan Jawaban</h3>
								<div className="rounded-lg border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Pernyataan</TableHead>
												<TableHead className="w-32 text-center">Benar</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{choices.map((choice) => (
												<TableRow key={choice.id}>
													<TableCell>{choice.content}</TableCell>
													<TableCell className="text-center">
														<div
															className={cn(
																"mx-auto flex size-8 items-center justify-center rounded-full border-2",
																choice.isCorrect ? "border-green-500 bg-green-500 text-white" : "border-border",
															)}
														>
															{choice.isCorrect && (
																<svg className="size-4" fill="currentColor" viewBox="0 0 20 20">
																	<title>Benar</title>
																	<path
																		fillRule="evenodd"
																		d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
																		clipRule="evenodd"
																	/>
																</svg>
															)}
														</div>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</div>
						)}

						{Boolean(question.discussion) && (
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
