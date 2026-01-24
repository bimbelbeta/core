import { TiptapRenderer } from "@/components/tiptap-renderer";
import { Skeleton } from "@/components/ui/skeleton";
import { useTryoutStore } from "../-hooks/use-tryout-store";

export function QuestionPanel() {
	const { currentQuestion } = useTryoutStore();

	return (
		<div className="flex h-full flex-col overflow-hidden border-dashed lg:border-r-2">
			<div className="flex-1 overflow-y-auto">
				{currentQuestion ? <TiptapRenderer content={currentQuestion.content} /> : <Skeleton className="h-8 w-full" />}
			</div>
		</div>
	);
}
