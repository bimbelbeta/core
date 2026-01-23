import { XIcon } from "@phosphor-icons/react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TagInputProps extends Omit<React.ComponentProps<"div">, "onChange"> {
	value: string[];
	onChange: (tags: string[]) => void;
	placeholder?: string;
	maxLength?: number;
}

export function TagInput({
	value,
	onChange,
	placeholder = "Tambah tag...",
	maxLength,
	className,
	...props
}: TagInputProps) {
	const [inputValue, setInputValue] = React.useState("");

	const handleAddTag = () => {
		const trimmed = inputValue.trim();
		if (!trimmed) return;
		if (value.includes(trimmed)) {
			setInputValue("");
			return;
		}
		if (maxLength && value.length >= maxLength) {
			return;
		}
		onChange([...value, trimmed]);
		setInputValue("");
	};

	const handleRemoveTag = (tagToRemove: string) => {
		onChange(value.filter((tag) => tag !== tagToRemove));
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleAddTag();
		} else if (e.key === "Backspace" && !inputValue && value.length > 0) {
			onChange(value.slice(0, -1));
		}
	};

	return (
		<div className={cn("space-y-2", className)} {...props}>
			<div className="flex flex-wrap gap-2">
				{value.map((tag) => (
					<Badge key={tag} variant="secondary" className="gap-1 pr-1">
						<span>{tag}</span>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="size-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
							onClick={() => handleRemoveTag(tag)}
						>
							<XIcon className="size-3" />
							<span className="sr-only">Hapus tag</span>
						</Button>
					</Badge>
				))}
			</div>
			<div className="flex gap-2">
				<Input
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					disabled={maxLength !== undefined && value.length >= maxLength}
				/>
				<Button
					type="button"
					variant="secondary"
					size="sm"
					onClick={handleAddTag}
					disabled={
						!inputValue.trim() ||
						value.includes(inputValue.trim()) ||
						(maxLength !== undefined && value.length >= maxLength)
					}
				>
					Tambah
				</Button>
			</div>
			{maxLength !== undefined && (
				<p className="text-muted-foreground text-xs">
					{value.length} / {maxLength} tag
				</p>
			)}
		</div>
	);
}
