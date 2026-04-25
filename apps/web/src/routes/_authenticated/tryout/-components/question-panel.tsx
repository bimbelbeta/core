import { TiptapRenderer } from "@/components/tiptap/tiptap-renderer";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTryoutStore } from "../-hooks/use-tryout-store";

export function QuestionPanel() {
	const { currentQuestion } = useTryoutStore();
	const isComplexQuestion = currentQuestion?.type === "multiple_choice_complex";

	return (
		<div
			className={cn(
				"flex h-full min-h-0 flex-col overflow-hidden border-dashed",
				isComplexQuestion ? "border-b-2 pb-4" : "lg:border-r-2 lg:pr-4",
			)}
		>
			<div className="flex-1 overflow-y-auto">
				{currentQuestion ? <TiptapRenderer content={currentQuestion.content} /> : <Skeleton className="h-8 w-full" />}
			</div>
		</div>
	);
}
