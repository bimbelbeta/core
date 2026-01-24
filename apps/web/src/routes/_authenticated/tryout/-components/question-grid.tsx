import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTryoutStore } from "../-hooks/use-tryout-store";

export function QuestionGrid() {
	const { currentQuestionIndex, raguRaguIds, answers, essayAnswers, questions, setCurrentQuestionIndex } =
		useTryoutStore();

	const handleQuestionClick = (index: number) => {
		setCurrentQuestionIndex(index);
	};

	return (
		<Card className="h-fit lg:min-w-40">
			<CardHeader className="px-4">
				<CardTitle className="font-semibold">Navigasi</CardTitle>
			</CardHeader>
			<CardContent className="grid grid-cols-8 gap-2 px-4 lg:grid-cols-4">
				{questions.map((question, index) => {
					const isCurrent = index === currentQuestionIndex;
					const isDoubtful = raguRaguIds.has(question.id) || question.userAnswer?.isDoubtful;
					const isAnswered =
						answers[question.id] !== undefined ||
						question.userAnswer?.selectedChoiceId !== null ||
						essayAnswers[question.id] !== undefined ||
						(question.userAnswer?.essayAnswer !== null && question.userAnswer?.essayAnswer !== undefined);

					let variant: "default" | "outline" | "secondary" | "warning" = "outline";
					if (isDoubtful) {
						variant = "warning";
					} else if (isCurrent) {
						variant = "default";
					} else if (isAnswered) {
						variant = "default";
					}

					return (
						<div key={question.id} className="relative">
							<Button onClick={() => handleQuestionClick(index)} variant={variant} size="icon">
								<span className="font-medium">{index + 1}</span>
							</Button>
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
}
