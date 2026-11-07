import type * as React from "react";

import { cn } from "@/lib/utils";

const inputSizes = {
	default: "",
	sm: "h-9 sm:h-8 px-2.5",
} as const;

function Input({
	className,
	type,
	size = "default",
	...props
}: Omit<React.ComponentProps<"input">, "size"> & { size?: keyof typeof inputSizes }) {
	return (
		<input
			type={type}
			data-slot="input"
			data-size={size}
			className={cn(
				"border-input selection:bg-primary selection:text-primary-foreground file:text-foreground placeholder:text-muted-foreground dark:bg-input/30 flex h-9 w-full min-w-0 rounded-md border bg-white px-3 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
				"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
				"aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
				inputSizes[size],
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
