import type { TryoutQuestion } from "../-types/tryout";
import { AnswerPanel } from "./answer-panel";
import { QuestionPanel } from "./question-panel";

interface QuestionBodyProps {
	question: TryoutQuestion;
}

export function QuestionBody({ question }: QuestionBodyProps) {
	return (
		<div className="grid min-h-100 grid-cols-1 lg:grid-cols-2">
			<QuestionPanel content={question.content} />
			<AnswerPanel questionId={question.id} choices={question.choices} />
		</div>
	);
}
