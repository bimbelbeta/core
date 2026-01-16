import { cva, type VariantProps } from "class-variance-authority";
import { Slot as SlotPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium text-sm outline-none transition-all duration-300 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>Link]:hover:cursor-pointer [&>a]:hover:cursor-pointer [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default: "bg-secondary-700 text-white shadow-xs hover:bg-secondary-700/80",
				secondary:
					"border border-primary-navy-700 bg-white text-primary-navy-700 shadow-xs hover:border-primary-navy-800 hover:bg-primary-100 hover:text-primary-navy-800",
				tertiary: "bg-transparent text-primary-navy-700 hover:bg-primary-100 hover:text-primary-navy-800",
				destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/80",
				outline: "border border-secondary-700 bg-white shadow-xs hover:bg-white/80",
				ghost: "bg-secondary-700/0 hover:bg-secondary-700/20",
				link: "text-primary underline-offset-4 hover:underline",
				// Legacy variants kept for compatibility if needed, or mapped to new ones
				darkBlue: "bg-primary-500 text-primary-foreground shadow-xs hover:bg-primary/90",
				white: "bg-white text-primary-300 shadow-xs hover:bg-white/90",
				lightBlue: "bg-primary-300 text-white shadow-xs hover:bg-primary-300",
			},
			size: {
				default: "h-10 px-4 py-2.5",
				sm: "h-9 px-3.5 py-2",
				lg: "h-11 rounded-sm px-4.5 py-2.5",
				xl: "h-12 rounded-md px-6 py-4",
				"2xl": "h-[60px] px-7 py-4 text-base",
				icon: "size-9",
				"icon-lg": "size-11",
				"icon-xl": "size-12",
				none: "",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? SlotPrimitive.Slot : "button";

	return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
