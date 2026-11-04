import { cva, type VariantProps } from "class-variance-authority";
import { ToggleGroup as ToggleGroupPrimitive, Toggle as TogglePrimitive } from "radix-ui";
import type * as React from "react";
import { createContext, useContext } from "react";
import { cn } from "@/lib/utils";

const toggleVariants = cva(
	"focus-visible:ring-ring/50 inline-flex items-center justify-center gap-2 text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default:
					"hover:bg-muted hover:text-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground rounded-md",
				filter:
					"border-primary-600 text-primary-600 hover:bg-primary-50 data-[state=on]:bg-primary-500 rounded-lg border bg-white px-3 py-1.5 text-xs font-normal data-[state=on]:text-white sm:h-10",
			},
			size: {
				default: "h-9 px-2.5",
				sm: "h-8 px-1.5",
				lg: "h-10 px-2.5",
				none: "",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

const ToggleGroupContext = createContext<VariantProps<typeof toggleVariants>>({
	variant: "default",
	size: "default",
});

function ToggleGroup({
	className,
	variant,
	size,
	children,
	...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> & VariantProps<typeof toggleVariants>) {
	return (
		<ToggleGroupPrimitive.Root data-slot="toggle-group" className={cn("flex items-center gap-2", className)} {...props}>
			<ToggleGroupContext.Provider value={{ variant, size }}>{children}</ToggleGroupContext.Provider>
		</ToggleGroupPrimitive.Root>
	);
}

function ToggleGroupItem({
	className,
	variant,
	size,
	...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleVariants>) {
	const context = useContext(ToggleGroupContext);

	return (
		<ToggleGroupPrimitive.Item
			data-slot="toggle-group-item"
			className={cn(toggleVariants({ variant: variant ?? context.variant, size: size ?? context.size }), className)}
			{...props}
		/>
	);
}

function Toggle({
	className,
	variant,
	size,
	...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
	return (
		<TogglePrimitive.Root data-slot="toggle" className={cn(toggleVariants({ variant, size }), className)} {...props} />
	);
}

export { Toggle, ToggleGroup, ToggleGroupItem, toggleVariants };
