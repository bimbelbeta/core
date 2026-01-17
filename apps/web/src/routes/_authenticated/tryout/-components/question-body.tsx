import type { TryoutQuestion } from "../-types/tryout";
import { AnswerPanel } from "./answer-panel";
import { QuestionPanel } from "./question-panel";

interface QuestionBodyProps {
	tryoutId: number;
	question: TryoutQuestion;
}

export function QuestionBody({ tryoutId, question }: QuestionBodyProps) {
	return (
		<div className="grid min-h-[400px] grid-cols-1 gap-4 lg:grid-cols-2">
			<QuestionPanel content={question.content} />
			<AnswerPanel tryoutId={tryoutId} questionId={question.id} choices={question.choices} />
		</div>
	);
}
