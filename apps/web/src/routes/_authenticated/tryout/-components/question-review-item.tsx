import { CaretUpIcon, CheckCircleIcon, CheckSquare, Square, XCircleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { TiptapRenderer } from "@/components/tiptap/tiptap-renderer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Typography } from "@/components/ui/typography";
import { extractTextFromTiptap } from "@/lib/content-text";
import { cn } from "@/lib/utils";

type QuestionReviewItemProps = {
	index: number;
	question: {
		id: number;
		content: unknown;
		type: "multiple_choice" | "multiple_choice_complex" | "essay";
		choices: Array<{
			id: number;
			content: string;
			code: string;
			isCorrect: boolean;
		}>;
		userAnswer: {
			selectedChoiceId: number | null;
			selectedChoiceIds: number[] | null;
			essayAnswer: string | null;
			isDoubtful: boolean;
		};
		discussion: unknown;
	};
	isCorrect: boolean;
};

export function QuestionReviewItem({ index, question, isCorrect }: QuestionReviewItemProps) {
	const [isOpen, setIsOpen] = useState(false);

	const bgColor = isCorrect ? "bg-[#6be2a5]" : "bg-[#ff7b82]";
	// shortcut: an image-only discussion reads as empty and stays hidden, upgrade if editors start posting image-only explanations
	const hasDiscussion = extractTextFromTiptap(question.discussion).length > 0;

	const icon = isCorrect ? (
		<CheckCircleIcon className="size-4 text-black" weight="bold" />
	) : (
		<XCircleIcon className="size-4 text-slate-900" weight="bold" />
	);

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen}>
			<CollapsibleTrigger asChild>
				<button type="button" className="flex w-full flex-col items-center">
					<div
						className={cn("flex w-full items-center gap-4 rounded-lg p-4 transition-colors", bgColor, "text-slate-900")}
					>
						<div className="flex items-center gap-4 overflow-hidden">
							<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white font-semibold text-slate-900 shadow-sm">
								{index + 1}
							</div>
							<div className="line-clamp-2 max-h-14 overflow-hidden text-sm font-medium">
								<TiptapRenderer content={question.content} className="prose-sm m-0 p-0 [&>p]:m-0" />
							</div>
						</div>
						<div className="shrink-0">{icon}</div>
					</div>

					<div className={cn("mx-auto w-full max-w-[95%] select-none", isOpen && "border-r border-l bg-white")}>
						<div className="flex w-full justify-between rounded-b-sm border border-t-0 bg-white px-4 py-2 text-xs hover:bg-white/80">
							<span className="text-muted-foreground font-medium">{isOpen ? "Tutup" : "Penjelasan"}</span>
							<CaretUpIcon className={`text-muted-foreground size-4 transition-transform ${!isOpen && "rotate-180"}`} />
						</div>
					</div>
				</button>
			</CollapsibleTrigger>

			<CollapsibleContent className="mx-auto w-full max-w-[95%]">
				<div className="rounded-b-md border border-t-0 bg-white p-4 sm:p-6">
					<TiptapRenderer content={question.content} />

					<div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
						<div className="space-y-3 sm:space-y-4">
							<Typography variant="body" tone="muted" className="font-medium">
								Jawaban Kamu
							</Typography>
							{question.choices.map((choice) => {
								const isSelected =
									question.userAnswer.selectedChoiceId === choice.id ||
									(question.userAnswer.selectedChoiceIds ?? []).includes(choice.id);

								const isChoiceCorrect = choice.isCorrect;
								const selectionColor = isSelected
									? isChoiceCorrect
										? "border-green-500 bg-green-50"
										: "border-red-500 bg-red-50"
									: "border-gray-200";

								const iconColor = isSelected
									? isChoiceCorrect
										? "border-green-700 bg-green-700 text-white"
										: "border-red-700 bg-red-700 text-white"
									: "border-gray-300 bg-gray-100";

								return (
									<div key={choice.id} className={cn("flex items-center gap-3 rounded-lg border p-3", selectionColor)}>
										{question.type === "multiple_choice_complex" ? (
											<div className={cn("flex size-6 shrink-0 items-center justify-center text-xs", iconColor)}>
												{isSelected ? (
													<CheckSquare weight="fill" className="size-4" />
												) : (
													<Square weight="bold" className="size-4" />
												)}
											</div>
										) : (
											<div
												className={cn(
													"flex size-6 shrink-0 items-center justify-center rounded-full border text-xs",
													iconColor,
												)}
											>
												{choice.code}
											</div>
										)}
										<TiptapRenderer content={choice.content} className="text-sm" />
									</div>
								);
							})}
						</div>

						{hasDiscussion && (
							<div className="space-y-3 sm:space-y-4">
								<Typography variant="body" tone="muted" className="font-medium">
									Kunci Jawaban & Pembahasan
								</Typography>
								<div className="rounded-lg border bg-blue-50/30 p-3 sm:p-4">
									<div className="mb-3 sm:mb-4">
										{question.choices
											.filter((c) => c.isCorrect)
											.map((c) => (
												<div key={c.id} className="flex items-center gap-2 text-green-700">
													<span className="flex size-6 items-center justify-center rounded-full bg-green-50 text-xs">
														{c.code}
													</span>
													<TiptapRenderer content={c.content} />
												</div>
											))}
									</div>
									<div className="prose-sm">
										<Typography variant="body" className="mb-2 font-medium">
											Pembahasan:
										</Typography>
										<TiptapRenderer content={question.discussion} />
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
