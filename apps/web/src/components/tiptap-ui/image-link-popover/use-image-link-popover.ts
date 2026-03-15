import type { Editor } from "@tiptap/react";
import { useCallback, useState } from "react";
import { useTiptapEditor } from "@/components/tiptap/use-tiptap-editor";

export interface UseImageLinkPopoverConfig {
	editor?: Editor | null;
	onOpenChange?: (isOpen: boolean) => void;
}

export function useImageLinkPopover(config: UseImageLinkPopoverConfig = {}) {
	const { editor: providedEditor, onOpenChange } = config;

	const { editor } = useTiptapEditor(providedEditor);
	const [isOpen, setIsOpen] = useState(false);
	const [url, setUrl] = useState("");

	const handleOpenChange = useCallback(
		(open: boolean) => {
			setIsOpen(open);
			onOpenChange?.(open);
		},
		[onOpenChange],
	);

	const handleSetImage = useCallback(() => {
		if (editor && url) {
			editor.chain().focus().setImage({ src: url }).run();
			setUrl("");
			setIsOpen(false);
		}
	}, [editor, url]);

	const handleToggleOpen = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
		if (event.defaultPrevented) return;
		setIsOpen((prev) => !prev);
	}, []);

	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLInputElement>) => {
			if (event.key === "Enter") {
				event.preventDefault();
				handleSetImage();
			}
		},
		[handleSetImage],
	);

	return {
		editor,
		isOpen,
		setIsOpen: handleOpenChange,
		url,
		setUrl,
		handleSetImage,
		handleToggleOpen,
		handleKeyDown,
	};
}
