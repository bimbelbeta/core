import type { Editor } from "@tiptap/react";
import { useEffect, useState } from "react";
import { useTiptapEditor } from "@/components/tiptap/use-tiptap-editor";
import { HeadingIcon } from "@/components/tiptap-icons/heading-icon";
import {
	canToggle,
	headingIcons,
	isHeadingActive,
	type Level,
	shouldShowButton,
} from "@/components/tiptap-ui/heading-button";

/**
 * Configuration for the heading dropdown menu functionality
 */
export interface UseHeadingDropdownMenuConfig {
	editor?: Editor | null;
	/** @default [1, 2, 3, 4, 5, 6] */
	levels?: Level[];
	/** @default false */
	hideWhenUnavailable?: boolean;
}

/**
 * Gets the currently active heading level from the available levels
 */
export function getActiveHeadingLevel(editor: Editor | null, levels: Level[] = [1, 2, 3, 4, 5, 6]): Level | undefined {
	if (!editor?.isEditable) return undefined;
	return levels.find((level) => isHeadingActive(editor, level));
}

/** Custom hook that provides heading dropdown menu functionality for Tiptap editor */
export function useHeadingDropdownMenu(config?: UseHeadingDropdownMenuConfig) {
	const { editor: providedEditor, levels = [1, 2, 3, 4, 5, 6], hideWhenUnavailable = false } = config || {};

	const { editor } = useTiptapEditor(providedEditor);
	const [isVisible, setIsVisible] = useState(true);

	const activeLevel = getActiveHeadingLevel(editor, levels);
	const isActive = isHeadingActive(editor);
	const canToggleState = canToggle(editor);

	useEffect(() => {
		if (!editor) return;

		const handleSelectionUpdate = () => {
			setIsVisible(shouldShowButton({ editor, hideWhenUnavailable, level: levels }));
		};

		handleSelectionUpdate();

		editor.on("selectionUpdate", handleSelectionUpdate);

		return () => {
			editor.off("selectionUpdate", handleSelectionUpdate);
		};
	}, [editor, hideWhenUnavailable, levels]);

	return {
		isVisible,
		activeLevel,
		isActive,
		canToggle: canToggleState,
		levels,
		label: "Heading",
		Icon: activeLevel ? headingIcons[activeLevel] : HeadingIcon,
	};
}
