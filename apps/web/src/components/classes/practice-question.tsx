import { AnswerCollapsible } from "./answer-collapsible";

export function PracticeQuestion({
	questionNumber,
	totalQuestions,
	question,
	answer,
	answerTitle = "Jawaban",
}: {
	questionNumber: number;
	totalQuestions: number;
	question: React.ReactNode;
	answer: React.ReactNode;
	answerTitle?: string;
}) {
	return (
		<div className="space-y-4">
			{/* Soal */}
			<div className="flex flex-col rounded-md border border-neutral-200 p-4">
				<div className="flex space-x-4">
					<div className="w-fit rounded-sm border border-neutral-200 px-4 py-2">Soal</div>
					<div className="w-fit rounded-sm border border-neutral-200 px-4 py-2">
						{questionNumber}/{totalQuestions}
					</div>
				</div>
				<div>{question}</div>
			</div>

			{/* Jawaban */}
			<AnswerCollapsible title={answerTitle}>
				<div className="text-muted-foreground text-sm">{answer}</div>
			</AnswerCollapsible>
		</div>
	);
}
