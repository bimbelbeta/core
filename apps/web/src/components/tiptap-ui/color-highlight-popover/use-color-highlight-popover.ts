import { useState } from "react";
import { useTiptapEditor } from "@/components/tiptap/use-tiptap-editor";
import type { HighlightColor, UseColorHighlightConfig } from "@/components/tiptap-ui/color-highlight-button";
import { useColorHighlight } from "@/components/tiptap-ui/color-highlight-button";

export interface UseColorHighlightPopoverConfig
	extends Pick<UseColorHighlightConfig, "editor" | "hideWhenUnavailable" | "onApplied"> {
	colors?: HighlightColor[];
}

export function useColorHighlightPopover(config: UseColorHighlightPopoverConfig = {}) {
	const { editor: providedEditor, hideWhenUnavailable = false, onApplied } = config;

	const { editor } = useTiptapEditor(providedEditor);
	const [isOpen, setIsOpen] = useState(false);

	const { isVisible, canColorHighlight, isActive, label, Icon } = useColorHighlight({
		editor,
		hideWhenUnavailable,
		onApplied,
	});

	return {
		editor,
		isOpen,
		setIsOpen,
		isVisible,
		canColorHighlight,
		isActive,
		label,
		Icon,
	};
}
