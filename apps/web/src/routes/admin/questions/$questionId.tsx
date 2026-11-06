import { ArrowLeftIcon, CheckIcon, PencilSimpleIcon, XIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
	AdminFormShell,
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

export const Route = createFileRoute("/admin/questions/$questionId")({
	staticData: { breadcrumb: "Detail soal", breadcrumbParent: { label: "Bank soal", to: "/admin/questions" } },
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

	const hasChoices = (question.type === "multiple_choice" || question.type === "multiple_choice_complex") && choices;
	const meta = [
		QUESTION_TYPE_SHORT_LABELS[question.type],
		hasChoices ? `${choices.length} pilihan` : null,
		question.tags && question.tags.length > 0 ? `${question.tags.length} tag` : null,
	].filter(Boolean);

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="icon" aria-label="Kembali" onClick={() => router.history.back()}>
							<ArrowLeftIcon className="size-4" />
						</Button>
						<Typography variant="title">Soal #{question.id}</Typography>
					</div>
					<Typography variant="body" tone="muted">
						{meta.join(" · ")}
					</Typography>
				</AdminPageHeaderContent>
				<AdminPageHeaderActions>
					<Button variant="outline" onClick={() => setIsEditing(true)}>
						<PencilSimpleIcon className="size-4" />
						Edit
					</Button>
				</AdminPageHeaderActions>
			</AdminPageHeader>

			<AdminPageContent>
				<AdminFormShell>
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

					{question.tags && question.tags.length > 0 && (
						<AdminSection title="Tags">
							<div className="flex flex-wrap gap-2">
								{question.tags.map((tag) => (
									<Badge key={tag} variant="outline">
										{tag}
									</Badge>
								))}
							</div>
						</AdminSection>
					)}
				</AdminFormShell>
			</AdminPageContent>
		</AdminPageRoot>
	);
}
