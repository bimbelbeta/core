import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

const toggleGroupItemClassName =
	"border-primary-700 text-primary-700 hover:bg-primary-100 data-[state=on]:bg-primary-700 focus-visible:ring-ring/50 inline-flex items-center justify-center rounded-lg border bg-white px-3 py-1.5 text-xs font-normal whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 data-[state=on]:text-white sm:h-10";

function ToggleGroup({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
	return (
		<ToggleGroupPrimitive.Root
			data-slot="toggle-group"
			className={cn("flex items-center gap-2", className)}
			{...props}
		/>
	);
}

function ToggleGroupItem({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
	return (
		<ToggleGroupPrimitive.Item
			data-slot="toggle-group-item"
			className={cn(toggleGroupItemClassName, className)}
			{...props}
		/>
	);
}

export { ToggleGroup, ToggleGroupItem };
