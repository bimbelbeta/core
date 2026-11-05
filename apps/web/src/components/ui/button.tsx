import { cva, type VariantProps } from "class-variance-authority";
import { Slot as SlotPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-300 outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&>Link]:hover:cursor-pointer [&>a]:hover:cursor-pointer",
	{
		variants: {
			variant: {
				default: "bg-secondary-800 hover:bg-secondary-900 text-white shadow-xs",
				secondary:
					"border-primary-navy-700 text-primary-navy-700 hover:border-primary-navy-800 hover:bg-primary-100 hover:text-primary-navy-800 border bg-white shadow-xs",
				tertiary: "text-primary-navy-700 hover:bg-primary-100 hover:text-primary-navy-800 bg-transparent",
				warning: "bg-yellow-500 hover:bg-yellow-500/80",
				"warning-outline": "text-foreground border-2 border-yellow-300 bg-white shadow-xs hover:bg-yellow-300/20",
				destructive: "bg-destructive text-white shadow-xs hover:bg-red-200",
				outline: "border-secondary-700 border bg-white shadow-xs hover:bg-white/80",
				input:
					"border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 h-9 w-full min-w-0 justify-start rounded-md border bg-white px-3 py-1 text-left font-normal shadow-xs hover:bg-white focus-visible:ring-[3px]",
				ghost: "bg-secondary-700/0 hover:bg-secondary-700/20",
				link: "text-primary underline-offset-4 hover:underline",
				// Legacy variants kept for compatibility if needed, or mapped to new ones
				darkBlue: "bg-primary-500 text-primary-foreground hover:bg-primary/90 shadow-xs",
				white: "bg-white text-black shadow-xs hover:bg-white/90",
				lightBlue: "bg-primary-300 hover:bg-primary-300 text-white shadow-xs",
			},
			size: {
				default: "h-10 px-4 py-2.5",
				xs: "h-8 px-2 py-1",
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
