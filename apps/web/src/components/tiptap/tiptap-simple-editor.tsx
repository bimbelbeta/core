import { SimpleEditor } from "../tiptap-templates/simple/simple-editor";

interface TiptapSimpleEditorProps {
	content?: object;
	onChange?: (content: object) => void;
}

export default function TiptapSimpleEditor({ content, onChange }: TiptapSimpleEditorProps) {
	return (
		<div className="flex max-h-[400px] min-h-[120px] flex-col">
			<SimpleEditor content={content as object} onChange={onChange} />
		</div>
	);
}
