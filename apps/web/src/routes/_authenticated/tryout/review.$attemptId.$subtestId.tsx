import { ArrowLeftIcon, CaretDown, CaretUp, Check, X } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";

import ErrorComponent from "@/components/error";
import { TiptapRenderer } from "@/components/tiptap-renderer";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/tryout/review/$attemptId/$subtestId")({
	component: RouteComponent,
});

function RouteComponent() {
	const { attemptId, subtestId } = Route.useParams();
	const { data, isPending, error } = useQuery(
		orpc.tryout.review.queryOptions({
			input: {
				attemptId: Number(attemptId),
				subtestId: Number(subtestId),
			},
		}),
	);

	if (isPending) {
		return (
			<div className="flex flex-col gap-8 p-4 md:p-8">
				<div className="space-y-4">
					<Skeleton className="h-10 w-32" />
					<Skeleton className="h-10 w-64" />
				</div>
				<div className="space-y-4">
					<Skeleton className="h-24 w-full" />
					<Skeleton className="h-24 w-full" />
					<Skeleton className="h-24 w-full" />
				</div>
			</div>
		);
	}

	if (error || !data) {
		return <ErrorComponent error={error} />;
	}

	return (
		<div className="flex flex-col gap-8 p-4 md:p-8">
			{/* Header */}
			<div className="space-y-6 rounded-xl border bg-white p-6 shadow-sm">
				<Button variant="default" size="sm" className="bg-[#009CA6] hover:bg-[#008a93]" asChild>
					<Link to="/tryout/results/$attemptId" params={{ attemptId }} search={{ tab: "results" }}>
						<ArrowLeftIcon className="mr-2 size-4" />
						Kembali
					</Link>
				</Button>

				<div className="space-y-1">
					<p className="font-semibold text-muted-foreground">Review Hasil Tryout</p>
					<h1 className="font-bold text-3xl">{data.subtest?.name}</h1>
				</div>
			</div>

			{/* Questions List */}
			<div className="space-y-4">
				{data.questions.map((question, index) => {
					const correctChoice = question.choices.find((c) => c.isCorrect);
					const isCorrect = question.userAnswer.selectedChoiceId === correctChoice?.id;

					return <QuestionReviewItem key={question.id} index={index} question={question} isCorrect={isCorrect} />;
				})}
			</div>
		</div>
	);
}

function QuestionReviewItem({
	index,
	question,
	isCorrect,
}: {
	index: number;
	question: {
		id: number;
		content: unknown;
		type: "multiple_choice" | "essay";
		choices: Array<{
			id: number;
			content: string;
			code: string;
			isCorrect: boolean;
		}>;
		userAnswer: {
			selectedChoiceId: number | null;
			essayAnswer: string | null;
			isDoubtful: boolean;
		};
		discussion: unknown;
	};
	isCorrect: boolean;
}) {
	const [isOpen, setIsOpen] = React.useState(false);

	const bgColor = isCorrect
		? "bg-[#6be2a5]" // Green matching screenshot
		: "bg-[#ff7b82]"; // Red matching screenshot

	const icon = isCorrect ? (
		<Check className="size-6 text-black" weight="bold" />
	) : (
		<X className="size-6 text-white" weight="bold" />
	);

	const textColor = isCorrect ? "text-slate-900" : "text-white";

	return (
		<div className="overflow-hidden rounded-xl bg-white shadow-sm">
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<CollapsibleTrigger asChild>
					<div
						className={cn(
							"flex cursor-pointer items-center justify-between gap-4 p-4 transition-colors",
							bgColor,
							textColor,
						)}
					>
						<div className="flex items-center gap-4 overflow-hidden">
							<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white font-bold text-slate-900 shadow-sm">
								{index + 1}
							</div>
							<div className="line-clamp-2 max-h-[3.5rem] overflow-hidden font-medium text-sm">
								<TiptapRenderer content={question.content} className="prose-sm m-0 p-0 [&>p]:m-0" />
							</div>
						</div>
						<div className="shrink-0">{icon}</div>
					</div>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<div className="border border-t-0 p-6">
						<div className="mb-6 flex justify-between gap-4">
							<div className="flex w-full flex-col gap-2">
								<p className="font-semibold text-muted-foreground text-sm">Pertanyaan</p>
								<TiptapRenderer content={question.content} />
							</div>
						</div>

						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
							<div className="space-y-4">
								<p className="font-semibold text-muted-foreground text-sm">Jawaban Kamu</p>
								{question.choices.map((choice) => {
									const isSelected = question.userAnswer.selectedChoiceId === choice.id;
									return (
										<div
											key={choice.id}
											className={cn(
												"flex items-center gap-3 rounded-lg border p-3",
												isSelected
													? isCorrect
														? "border-green-500 bg-green-50"
														: "border-red-500 bg-red-50"
													: "border-gray-200",
											)}
										>
											<div
												className={cn(
													"flex size-6 shrink-0 items-center justify-center rounded-full border text-xs",
													isSelected
														? isCorrect
															? "border-green-500 bg-green-500 text-white"
															: "border-red-500 bg-red-500 text-white"
														: "border-gray-300 bg-gray-100",
												)}
											>
												{choice.code}
											</div>
											<TiptapRenderer content={choice.content} className="text-sm" />
										</div>
									);
								})}
							</div>

							<div className="space-y-4">
								<p className="font-semibold text-muted-foreground text-sm">Kunci Jawaban & Pembahasan</p>
								<div className="rounded-lg border bg-blue-50/30 p-4">
									<div className="mb-4">
										<p className="mb-2 font-medium text-sm">Jawaban Benar:</p>
										{question.choices
											.filter((c) => c.isCorrect)
											.map((c) => (
												<div key={c.id} className="flex items-center gap-2 font-bold text-green-700">
													<span className="flex size-6 items-center justify-center rounded-full bg-green-100 text-xs">
														{c.code}
													</span>
													<TiptapRenderer content={c.content} />
												</div>
											))}
									</div>
									<div className="prose-sm">
										<p className="mb-2 font-medium text-sm">Pembahasan:</p>
										<TiptapRenderer content={question.discussion} />
									</div>
								</div>
							</div>
						</div>
					</div>
					<button
						type="button"
						className="flex w-full cursor-pointer justify-between bg-gray-50 px-6 py-2 text-xs hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
						onClick={() => setIsOpen(false)}
					>
						<span className="font-medium text-muted-foreground">Tutup Penjelasan</span>
						<CaretUp className="size-4 text-muted-foreground" />
					</button>
				</CollapsibleContent>
				{!isOpen && (
					<button
						type="button"
						className="flex w-full cursor-pointer justify-between border border-t-0 px-6 py-2 text-xs hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
						onClick={() => setIsOpen(true)}
					>
						<span className="font-medium text-muted-foreground">Penjelasan</span>
						<CaretDown className="size-4 text-muted-foreground" />
					</button>
				)}
			</Collapsible>
		</div>
	);
}
