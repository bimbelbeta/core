import { AnswerPanel } from "./answer-panel";
import { QuestionPanel } from "./question-panel";

export function QuestionBody() {
	return (
		<div className="grid min-h-100 grid-cols-1 gap-4 rounded-lg border p-4 lg:grid-cols-2">
			<QuestionPanel />
			<AnswerPanel />
		</div>
	);
}
