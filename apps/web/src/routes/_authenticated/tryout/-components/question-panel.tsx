import { TiptapRenderer } from "@/components/tiptap-renderer";

interface QuestionPanelProps {
	content: string;
}

export function QuestionPanel({ content }: QuestionPanelProps) {
	return (
		<div className="flex h-full flex-col overflow-hidden">
			<div className="flex-1 overflow-y-auto p-4">
				<TiptapRenderer content={content} />
			</div>
		</div>
	);
}
