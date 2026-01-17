import { Card } from "@/components/ui/card";
import type { TryoutQuestion } from "../-types/tryout";
import { QuestionBody } from "./question-body";
import { QuestionFooter } from "./question-footer";
import { QuestionHeader } from "./question-header";

interface QuestionCardProps {
	tryoutId: number;
	subtestId: number;
	question: TryoutQuestion;
	currentIndex: number;
	totalQuestions: number;
	isLastQuestion: boolean;
	deadline: Date | null;
}

export function QuestionCard({
	tryoutId,
	subtestId,
	question,
	currentIndex,
	totalQuestions,
	isLastQuestion,
	deadline,
}: QuestionCardProps) {
	return (
		<Card className="flex flex-col gap-4 p-4">
			<QuestionHeader currentIndex={currentIndex} totalQuestions={totalQuestions} deadline={deadline} />
			<QuestionBody tryoutId={tryoutId} question={question} />
			<QuestionFooter
				tryoutId={tryoutId}
				subtestId={subtestId}
				currentIndex={currentIndex}
				isLastQuestion={isLastQuestion}
			/>
		</Card>
	);
}
