import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

const toggleGroupItemClassName =
	"border-primary-700 text-primary-800 hover:bg-primary-100 data-[state=on]:bg-primary-700 focus-visible:ring-ring/50 inline-flex items-center justify-center rounded-lg border bg-white px-3 py-1.5 text-xs font-normal whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 data-[state=on]:text-white sm:h-10";

const ARROW_STEP: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

function ToggleGroup({
	className,
	onKeyDownCapture,
	...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
	return (
		<ToggleGroupPrimitive.Root
			data-slot="toggle-group"
			className={cn("flex items-center gap-2", className)}
			onKeyDownCapture={(event) => {
				onKeyDownCapture?.(event);
				const item = event.target;
				if (props.type !== "single" || event.defaultPrevented) return;
				if (!(item instanceof HTMLElement) || item.getAttribute("role") !== "radio") return;
				const items = [...event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]:not([data-disabled])')];
				const current = items.indexOf(item);
				const step = ARROW_STEP[event.key];
				const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : step ? current + step : -1;
				if (current === -1 || next < 0 || next >= items.length || next === current) return;
				event.preventDefault();
				items[next].focus();
				items[next].click();
			}}
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
