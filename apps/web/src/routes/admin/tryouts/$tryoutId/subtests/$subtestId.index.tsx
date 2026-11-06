import { ArrowLeftIcon, PlusIcon } from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { useState } from "react";
import { toast } from "sonner";
import {
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderActions,
	AdminPageHeaderContent,
	AdminPageRoot,
} from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { orpc } from "@/lib/orpc";
import { parseRouteParamToNumber } from "@/lib/tanstack-router-utils";
import { AttachQuestionsDialog } from "../../-components/attach-questions-dialog";
import { ScoringMapEditor } from "../../-components/scoring-map-editor";
import { SubtestQuestionsTable } from "../../-components/subtest-questions-table";

export const Route = createFileRoute("/admin/tryouts/$tryoutId/subtests/$subtestId/")({
	staticData: { breadcrumb: "Subtest", breadcrumbParent: { label: "Tryout", to: "/admin/tryouts/$tryoutId" } },
	component: SubtestDetailPage,
});

function SubtestDetailPage() {
	const { tryoutId: tId, subtestId: rawSubtestId } = Route.useParams();
	const subtestId = parseRouteParamToNumber(rawSubtestId);

	const { data, isPending, refetch } = useQuery(
		orpc.admin.tryout.questionsBulk.list.queryOptions({
			input: { subtestId },
		}),
	);

	const { data: subtestData, refetch: refetchSubtest } = useQuery(
		orpc.admin.tryout.subtest.find.queryOptions({
			input: { id: subtestId },
		}),
	);

	const [isAttachOpen, setIsAttachOpen] = useState(false);

	const removeMutation = useMutation(
		orpc.admin.tryout.questionsBulk.removeQuestionFromSubtest.mutationOptions({
			onSuccess: () => {
				toast.success("Soal dilepas dari subtest");
				refetch();
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const questions = data?.questions;

	if (isPending || !questions) return null;

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="icon" asChild>
							<Link to="/admin/tryouts/$tryoutId" params={{ tryoutId: tId }} aria-label="Kembali">
								<ArrowLeftIcon className="size-4" />
							</Link>
						</Button>
						<Typography variant="title">{subtestData?.name ?? "Subtest"}</Typography>
					</div>
					<Typography variant="body" tone="muted">
						{questions.length} soal
						{subtestData?.duration ? ` · ${subtestData.duration} menit` : ""}
						{subtestData?.questionOrder === "random" ? " · soal acak" : " · soal berurutan"}
					</Typography>
				</AdminPageHeaderContent>
				<AdminPageHeaderActions>
					<Button variant="outline" onClick={() => setIsAttachOpen(true)}>
						<PlusIcon className="size-4" />
						Tambah soal
					</Button>
					<Button asChild>
						<Link
							to="/admin/tryouts/$tryoutId/subtests/$subtestId/questions/new"
							params={{ tryoutId: tId, subtestId: subtestId.toString() }}
						>
							<PlusIcon className="size-4" />
							Buat soal
						</Link>
					</Button>
				</AdminPageHeaderActions>
			</AdminPageHeader>

			<AdminPageContent>
				<SubtestQuestionsTable
					questions={questions}
					isPending={isPending}
					isRemoving={removeMutation.isPending}
					onRemove={(questionId) => removeMutation.mutate({ subtestId, questionId })}
				/>

				<ScoringMapEditor
					subtestId={subtestId}
					questionCount={questions.length}
					initialScoringMap={subtestData?.scoringMap}
					onSaveSuccess={() => refetchSubtest()}
				/>
			</AdminPageContent>

			<AttachQuestionsDialog
				open={isAttachOpen}
				onOpenChange={setIsAttachOpen}
				onSuccess={() => refetch()}
				subtestId={subtestId}
				attachedIds={questions.map((item) => item.question.id)}
			/>
		</AdminPageRoot>
	);
}
