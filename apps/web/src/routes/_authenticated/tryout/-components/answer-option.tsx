import { TiptapRenderer } from "@/components/tiptap-renderer";
import { cn } from "@/lib/utils";

interface AnswerOptionProps {
	code: string;
	content: string;
	selected: boolean;
	onSelect: () => void;
	disabled: boolean;
}

export function AnswerOption({ code, content, selected, onSelect, disabled }: AnswerOptionProps) {
	return (
		<button
			type="button"
			disabled={disabled}
			onClick={onSelect}
			className={cn(
				"inline-flex items-center gap-3 rounded-md border p-4 text-start transition-all",
				selected ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50",
				disabled && "cursor-not-allowed opacity-50",
			)}
		>
			<span
				className={cn(
					"rounded-xs border border-foreground/20 px-2.5 py-0.5 font-medium text-sm",
					selected && "bg-primary text-primary-foreground",
				)}
			>
				{code}
			</span>
			<TiptapRenderer content={content} />
		</button>
	);
}
