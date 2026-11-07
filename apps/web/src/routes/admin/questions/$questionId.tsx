import { CheckIcon, PencilSimpleIcon, XIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { type } from "arktype";
import { useState } from "react";
import {
	AdminBackLink,
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderActions,
	AdminPageHeaderContent,
	AdminPageRoot,
	AdminSection,
} from "@/components/admin/admin-page";
import {
	AdminTable,
	AdminTableBody,
	AdminTableCell,
	AdminTableHead,
	AdminTableHeader,
	AdminTableRoot,
	AdminTableRow,
} from "@/components/admin/admin-table";
import { DetailPageSkeleton } from "@/components/admin/detail-page-skeleton";
import { TiptapRenderer } from "@/components/tiptap/tiptap-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { orpc } from "@/lib/orpc";
import { QUESTION_TYPE_SHORT_LABELS } from "@/lib/schemas";
import { parseRouteParamToNumber } from "@/lib/tanstack-router-utils";
import { cn } from "@/lib/utils";
import { EditQuestionForm } from "./-components/edit-question-form";

const searchSchema = type({
	"tryoutId?": "number",
	"subtestId?": "number",
});

export const Route = createFileRoute("/admin/questions/$questionId")({
	staticData: { breadcrumb: "Detail soal", breadcrumbParent: { label: "Bank soal", to: "/admin/questions" } },
	validateSearch: searchSchema,
	component: QuestionDetailPage,
});

function QuestionDetailPage() {
	const { questionId: rawQuestionId } = Route.useParams();
	const questionId = parseRouteParamToNumber(rawQuestionId);
	const { tryoutId, subtestId } = Route.useSearch();
	const [isEditing, setIsEditing] = useState(false);

	const { data, isPending } = useQuery(
		orpc.admin.tryout.questions.find.queryOptions({
			input: { id: questionId },
		}),
	);

	if (isPending) {
		return <DetailPageSkeleton />;
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

	const hasChoices = (question.type === "multiple_choice" || question.type === "multiple_choice_complex") && choices;

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					{tryoutId && subtestId ? (
						<AdminBackLink
							to="/admin/tryouts/$tryoutId"
							params={{ tryoutId: tryoutId.toString() }}
							search={{ tab: "subtests", subtest: subtestId }}
						>
							Kembali ke subtest
						</AdminBackLink>
					) : (
						<AdminBackLink to="/admin/questions">Kembali ke bank soal</AdminBackLink>
					)}
					<Typography variant="title">Soal #{question.id}</Typography>
				</AdminPageHeaderContent>
				<AdminPageHeaderActions>
					<Button variant="outline" size="xs" onClick={() => setIsEditing(true)}>
						<PencilSimpleIcon className="size-3.5" />
						Edit
					</Button>
				</AdminPageHeaderActions>
			</AdminPageHeader>

			<AdminPageContent>
				<div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_14rem]">
					<div className="flex min-w-0 flex-col gap-4">
						<AdminSection title="Konten soal">
							<TiptapRenderer content={question.content} className="prose prose-sm max-w-none rounded-md border p-4" />
						</AdminSection>

						{question.type === "multiple_choice" && choices && (
							<AdminSection title="Pilihan jawaban" description="Pilihan bertanda benar adalah kunci jawaban.">
								<div className="flex flex-col gap-2">
									{choices.map((choice) => (
										<div
											key={choice.id}
											className={cn(
												"flex items-center gap-3 rounded-md border p-3",
												choice.isCorrect ? "border-green-200 bg-green-100/40" : "border-border",
											)}
										>
											<span
												className={cn(
													"border-foreground/20 text-meta rounded-xs border px-2 py-0.5 font-medium",
													choice.isCorrect && "border-green-800 bg-green-800 text-white",
												)}
											>
												{choice.code}
											</span>
											<span className="text-row-title flex-1">{choice.content}</span>
											{choice.isCorrect && <Badge variant="success">Benar</Badge>}
										</div>
									))}
								</div>
							</AdminSection>
						)}

						{question.type === "multiple_choice_complex" && choices && (
							<AdminSection title="Pilihan jawaban" description="Setiap pernyataan dinilai benar atau salah.">
								<AdminTableRoot>
									<AdminTable>
										<AdminTableHeader className="hidden sm:table-row">
											<AdminTableHead>Pernyataan</AdminTableHead>
											<AdminTableHead className="w-24">Kunci</AdminTableHead>
										</AdminTableHeader>
										<AdminTableBody columns={2}>
											{choices.map((choice) => (
												<AdminTableRow key={choice.id}>
													<AdminTableCell>
														<span className="text-row-title">{choice.content}</span>
													</AdminTableCell>
													<AdminTableCell>
														{choice.isCorrect ? (
															<Badge variant="success">
																<CheckIcon className="size-3" weight="bold" />
																Benar
															</Badge>
														) : (
															<Badge variant="outline" className="text-muted-foreground">
																<XIcon className="size-3" weight="bold" />
																Salah
															</Badge>
														)}
													</AdminTableCell>
												</AdminTableRow>
											))}
										</AdminTableBody>
									</AdminTable>
								</AdminTableRoot>
							</AdminSection>
						)}

						{question.type === "essay" && (
							<AdminSection title="Jawaban benar" description="Acuan penilaian jawaban esai.">
								{question.essayCorrectAnswer ? (
									<p className="text-row-title rounded-md border p-3">{question.essayCorrectAnswer}</p>
								) : (
									<Typography variant="body" tone="muted">
										Belum diisi.
									</Typography>
								)}
							</AdminSection>
						)}

						{Boolean(question.discussion) && (
							<AdminSection title="Pembahasan">
								<TiptapRenderer
									content={question.discussion}
									className="prose prose-sm bg-muted/30 max-w-none rounded-md border p-4"
								/>
							</AdminSection>
						)}
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
								{hasChoices && (
									<div className="flex items-baseline justify-between gap-3">
										<dt className="text-muted-foreground text-meta">Pilihan</dt>
										<dd className="text-meta text-right font-medium tabular-nums">{choices.length}</dd>
									</div>
								)}
							</dl>
						</AdminSection>

						<AdminSection title="Tags">
							{question.tags && question.tags.length > 0 ? (
								<div className="flex flex-wrap gap-1.5">
									{question.tags.map((tag) => (
										<Badge key={tag} variant="outline">
											{tag}
										</Badge>
									))}
								</div>
							) : (
								<Typography variant="body" tone="muted">
									Belum ada tag.
								</Typography>
							)}
						</AdminSection>
					</aside>
				</div>
			</AdminPageContent>
		</AdminPageRoot>
	);
}
