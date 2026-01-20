import { TiptapRenderer } from "@/components/tiptap-renderer";
import { Skeleton } from "@/components/ui/skeleton";
import { useTryoutStore } from "../-hooks/use-tryout-store";

export function QuestionPanel() {
	const { currentQuestion } = useTryoutStore();

	return (
		<div className="flex h-full flex-col overflow-hidden">
			<div className="flex-1 overflow-y-auto p-4">
				{currentQuestion ? <TiptapRenderer content={currentQuestion.content} /> : <Skeleton className="h-8 w-full" />}
			</div>
		</div>
	);
}
