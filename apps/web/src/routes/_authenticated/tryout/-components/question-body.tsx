import { cn } from "@/lib/utils";
import { useTryoutStore } from "../-hooks/use-tryout-store";
import { AnswerPanel } from "./answer-panel";
import { QuestionPanel } from "./question-panel";

export function QuestionBody() {
	const { currentQuestion } = useTryoutStore();
	const isComplexQuestion = currentQuestion?.type === "multiple_choice_complex";

	return (
		<div
			className={cn(
				"grid min-h-0 flex-1 grid-cols-1 gap-4 rounded-lg border p-4",
				isComplexQuestion ? "lg:grid-cols-1" : "lg:grid-cols-2",
			)}
		>
			<QuestionPanel />
			<AnswerPanel />
		</div>
	);
}
