import type * as React from "react";

import { cn } from "@/lib/utils";

const textareaSizes = {
	default: "",
	sm: "min-h-16 py-1.5 text-base md:text-sm",
} as const;

function Textarea({
	className,
	size = "default",
	...props
}: React.ComponentProps<"textarea"> & { size?: keyof typeof textareaSizes }) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				"border-input selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground dark:bg-input/30 flex min-h-20 w-full min-w-0 rounded-md border bg-white px-3 py-2 text-base transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
				"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
				"aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
				textareaSizes[size],
				className,
			)}
			{...props}
		/>
	);
}

export { Textarea };
