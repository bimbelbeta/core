import { cva, type VariantProps } from "class-variance-authority";
import { Slot as SlotPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
	"focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] [&>svg]:pointer-events-none [&>svg]:size-3",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90 border-transparent",
				secondary: "bg-muted text-foreground/80 [a&]:hover:bg-muted/80 border-transparent",
				destructive:
					"bg-destructive focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90 border-transparent text-white",
				outline: "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
				info: "border-primary-navy-200 bg-primary-navy-50 text-primary-navy-700 [a&]:hover:bg-primary-navy-50/80",
				warning: "border-yellow-300/60 bg-yellow-100/50 text-yellow-800 [a&]:hover:bg-yellow-100/80",
				warningSolid: "bg-yellow-500 text-white [a&]:hover:bg-yellow-600",
				success: "border-green-200 bg-green-100/60 text-green-800 [a&]:hover:bg-green-100/80",
				danger: "border-red-200 bg-red-100/40 text-red-800 [a&]:hover:bg-red-100/60",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

function Badge({
	className,
	variant,
	asChild = false,
	...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
	const Comp = asChild ? SlotPrimitive.Slot : "span";

	return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
