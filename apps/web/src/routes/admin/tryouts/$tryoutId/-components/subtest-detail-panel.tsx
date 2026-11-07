import { ArrowLeftIcon, PlusIcon } from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { orpc } from "@/lib/orpc";
import { AttachQuestionsDialog } from "../../-components/attach-questions-dialog";
import { ScoringMapEditor } from "../../-components/scoring-map-editor";
import { SubtestQuestionsTable } from "../../-components/subtest-questions-table";

interface SubtestDetailPanelProps {
	tryoutId: number;
	subtest: {
		id: number;
		name: string;
		duration: number;
		questionOrder: string;
		questionCount: number;
	};
	onUpdate: () => void;
}

export function SubtestDetailPanel({ tryoutId, subtest, onUpdate }: SubtestDetailPanelProps) {
	const subtestId = subtest.id;
	const [isAttachOpen, setIsAttachOpen] = useState(false);

	const questionsQuery = useQuery(
		orpc.admin.tryout.questionsBulk.list.queryOptions({
			input: { subtestId },
		}),
	);

	const subtestQuery = useQuery(
		orpc.admin.tryout.subtest.find.queryOptions({
			input: { id: subtestId },
		}),
	);

	const removeMutation = useMutation(
		orpc.admin.tryout.questionsBulk.removeQuestionFromSubtest.mutationOptions({
			onSuccess: () => {
				toast.success("Soal dilepas dari subtest");
				questionsQuery.refetch();
				onUpdate();
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const questions = questionsQuery.data?.questions ?? [];
	const subtestData = subtestQuery.data;
	const detail = subtestData ?? subtest;
	const isPending = questionsQuery.isPending || subtestQuery.isPending;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center gap-3">
				<div className="min-w-0">
					<Link
						to="/admin/tryouts/$tryoutId"
						params={{ tryoutId: tryoutId.toString() }}
						search={{ tab: "subtests" }}
						className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 text-meta mb-0.5 inline-flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2"
					>
						<ArrowLeftIcon className="size-3" />
						Kembali ke subtest
					</Link>
					<Typography variant="subtitle1" className="truncate">
						{detail.name}
					</Typography>
					<Typography variant="body" tone="muted">
						{isPending ? subtest.questionCount : questions.length} soal
						{detail.duration ? ` · ${detail.duration} menit` : ""}
						{detail.questionOrder === "random" ? " · soal acak" : " · soal berurutan"}
					</Typography>
				</div>
				<div className="ml-auto flex flex-wrap items-center gap-1">
					<Button variant="outline" size="xs" onClick={() => setIsAttachOpen(true)}>
						<PlusIcon className="size-3.5" />
						Tambah soal
					</Button>
					<Button size="xs" asChild>
						<Link
							to="/admin/tryouts/$tryoutId/subtests/$subtestId/questions/new"
							params={{ tryoutId: tryoutId.toString(), subtestId: subtestId.toString() }}
						>
							<PlusIcon className="size-3.5" />
							Buat soal
						</Link>
					</Button>
				</div>
			</div>

			{isPending ? (
				<Skeleton className="h-64 w-full" />
			) : (
				<Tabs orientation="vertical" defaultValue="soal" className="w-full gap-4 sm:flex-row sm:gap-6">
					<TabsList>
						<TabsTrigger value="soal">Soal</TabsTrigger>
						<TabsTrigger value="skoring">Skoring</TabsTrigger>
					</TabsList>
					<TabsContent value="soal">
						<SubtestQuestionsTable
							questions={questions}
							isRemoving={removeMutation.isPending}
							onRemove={(questionId) => removeMutation.mutate({ subtestId, questionId })}
						/>
					</TabsContent>
					<TabsContent value="skoring">
						<ScoringMapEditor
							subtestId={subtestId}
							questionCount={questions.length}
							initialScoringMap={subtestData?.scoringMap}
							onSaveSuccess={() => subtestQuery.refetch()}
						/>
					</TabsContent>
				</Tabs>
			)}

			<AttachQuestionsDialog
				open={isAttachOpen}
				onOpenChange={setIsAttachOpen}
				onSuccess={() => {
					questionsQuery.refetch();
					onUpdate();
				}}
				subtestId={subtestId}
				attachedIds={questions.map((item) => item.question.id)}
			/>
		</div>
	);
}
