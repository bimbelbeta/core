import { SimpleEditor } from "../tiptap-templates/simple/simple-editor";

interface TiptapSimpleEditorProps {
	content?: Record<string, unknown>;
	onChange?: (content: Record<string, unknown>) => void;
	label: string;
}

export default function TiptapSimpleEditor({ content, onChange, label }: TiptapSimpleEditorProps) {
	return (
		<fieldset aria-label={label} className="m-0 flex max-h-[400px] min-h-[120px] flex-col border-0 p-0">
			<SimpleEditor content={content} onChange={onChange} />
		</fieldset>
	);
}
