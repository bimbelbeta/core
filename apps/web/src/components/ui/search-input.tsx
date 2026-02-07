import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

interface SearchInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
	value: string;
	onChange: (value: string) => void;
	debounceMs?: number;
}

export function SearchInput({ value, onChange, debounceMs = 500, className, ...props }: SearchInputProps) {
	const [localValue, setLocalValue] = useState(value);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		setLocalValue(value);
	}, [value]);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		setLocalValue(newValue);

		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		timeoutRef.current = setTimeout(() => {
			onChange(newValue);
		}, debounceMs);
	};

	const handleClear = () => {
		setLocalValue("");
		onChange("");
	};

	return (
		<InputGroup className={cn("bg-white", className)}>
			<InputGroupAddon>
				<MagnifyingGlassIcon className="size-4" />
			</InputGroupAddon>
			<InputGroupInput
				value={localValue}
				onChange={handleChange}
				placeholder={props.placeholder ?? "Cari konten..."}
				{...props}
			/>
			{localValue && (
				<InputGroupAddon align="inline-end">
					<InputGroupButton onClick={handleClear} size="icon-xs" variant="ghost">
						<XIcon weight="bold" />
					</InputGroupButton>
				</InputGroupAddon>
			)}
		</InputGroup>
	);
}
