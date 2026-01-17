import { TiptapRenderer } from "@/components/tiptap-renderer";
import { Card } from "@/components/ui/card";

interface QuestionPanelProps {
	content: string;
}

export function QuestionPanel({ content }: QuestionPanelProps) {
	return (
		<Card className="flex h-full flex-col overflow-hidden">
			<div className="border-b bg-secondary/50 p-3">
				<span className="font-medium text-sm">Pertanyaan</span>
			</div>
			<div className="flex-1 overflow-y-auto p-4">
				<TiptapRenderer content={content} />
			</div>
		</Card>
	);
}
