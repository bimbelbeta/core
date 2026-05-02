import { SimpleEditor } from "../tiptap-templates/simple/simple-editor";

interface TiptapSimpleEditorProps {
	content?: Record<string, unknown>;
	onChange?: (content: Record<string, unknown>) => void;
}

export default function TiptapSimpleEditor({ content, onChange }: TiptapSimpleEditorProps) {
	return (
		<div className="flex max-h-[400px] min-h-[120px] flex-col">
			<SimpleEditor content={content} onChange={onChange} />
		</div>
	);
}
