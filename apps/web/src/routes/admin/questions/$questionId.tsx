import { ArrowLeftIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderActions,
	AdminPageHeaderContent,
	AdminPageRoot,
} from "@/components/admin/admin-page";
import { DetailPageSkeleton } from "@/components/admin/detail-page-skeleton";
import { TiptapRenderer } from "@/components/tiptap/tiptap-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Typography } from "@/components/ui/typography";
import { orpc } from "@/lib/orpc";
import { QUESTION_TYPE_BADGE, QUESTION_TYPE_LABELS } from "@/lib/schemas";
import { parseRouteParamToNumber } from "@/lib/tanstack-router-utils";
import { cn } from "@/lib/utils";
import { EditQuestionForm } from "./-components/edit-question-form";

export const Route = createFileRoute("/admin/questions/$questionId")({
	staticData: { breadcrumb: "Detail Soal", breadcrumbParent: { label: "Bank soal", to: "/admin/questions" } },
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
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="icon" aria-label="Kembali" onClick={() => router.history.back()}>
							<ArrowLeftIcon className="size-4" />
						</Button>
						<Typography variant="title">Detail Soal #{question.id}</Typography>
					</div>
				</AdminPageHeaderContent>
				<AdminPageHeaderActions>
					<Button variant="outline" size="sm" className="h-9" onClick={() => setIsEditing(true)}>
						<PencilSimpleIcon className="size-4" />
						Edit
					</Button>
				</AdminPageHeaderActions>
			</AdminPageHeader>

			<AdminPageContent>
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Informasi Soal #{question.id}</CardTitle>
							<Badge variant={QUESTION_TYPE_BADGE[question.type]}>{QUESTION_TYPE_LABELS[question.type]}</Badge>
						</div>
					</CardHeader>
					<CardContent className="space-y-6">
						<div>
							<Typography variant="body" as="h3" tone="muted" className="mb-2 font-medium">
								Konten Soal
							</Typography>
							<TiptapRenderer content={question.content} className="prose prose-sm max-w-none rounded-md border p-4" />
						</div>

						{question.type === "multiple_choice" && choices && (
							<div>
								<Typography variant="body" as="h3" tone="muted" className="mb-2 font-medium">
									Pilihan Jawaban
								</Typography>
								<div className="flex flex-col gap-2">
									{choices.map((choice) => (
										<div
											key={choice.id}
											className={cn(
												"flex items-center gap-3 rounded-md border p-4 text-start",
												choice.isCorrect ? "border-green-300 bg-green-50" : "border-border",
											)}
										>
											<span
												className={cn(
													"border-foreground/20 rounded-xs border px-2.5 py-0.5 text-sm font-medium",
													choice.isCorrect && "border-green-700 bg-green-700 text-white",
												)}
											>
												{choice.code}
											</span>
											<span className="flex-1 text-sm">{choice.content}</span>
											{choice.isCorrect && (
												<Badge variant="success" className="ml-auto">
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
								<Typography variant="body" as="h3" tone="muted" className="mb-2 font-medium">
									Pilihan Jawaban
								</Typography>
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
																choice.isCorrect ? "border-green-700 bg-green-700 text-white" : "border-border",
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
								<Typography variant="body" as="h3" tone="muted" className="mb-2 font-medium">
									Pembahasan
								</Typography>
								<TiptapRenderer
									content={question.discussion}
									className="prose prose-sm bg-muted/30 max-w-none rounded-md border p-4"
								/>
							</div>
						)}

						{question.tags && question.tags.length > 0 && (
							<div>
								<Typography variant="body" as="h3" tone="muted" className="mb-2 font-medium">
									Tags
								</Typography>
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
			</AdminPageContent>
		</AdminPageRoot>
	);
}
