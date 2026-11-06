import { cva, type VariantProps } from "class-variance-authority";
import { Slot as SlotPrimitive } from "radix-ui";
import type * as React from "react";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-300 outline-none focus-visible:ring-[3px] disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&>Link]:hover:cursor-pointer [&>a]:hover:cursor-pointer",
	{
		variants: {
			variant: {
				default: "bg-primary hover:bg-primary/90 disabled:bg-primary/15 disabled:text-primary/75 text-white",
				secondary: "border-border text-foreground hover:bg-muted bg-white disabled:opacity-50",
				tertiary: "text-foreground hover:bg-muted disabled:text-muted-foreground/60 bg-transparent",
				warning: "bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50",
				"warning-outline":
					"text-foreground border-2 border-yellow-300 bg-white hover:bg-yellow-100/60 disabled:opacity-50",
				destructive:
					"bg-destructive hover:bg-destructive/80 disabled:bg-destructive/15 disabled:text-destructive/75 text-white",
				outline: "border-border bg-card text-foreground hover:bg-muted disabled:opacity-50",

				input:
					"border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 h-9 w-full min-w-0 justify-start rounded-md border bg-white px-3 py-1 text-left font-normal hover:bg-white focus-visible:ring-[3px] disabled:opacity-50",
				ghost: "hover:bg-muted disabled:text-muted-foreground/60 disabled:bg-transparent",
				link: "text-primary underline-offset-4 hover:underline disabled:opacity-50",
				white: "text-foreground bg-white hover:bg-white/90 disabled:opacity-50",
				lightBlue:
					"bg-primary-300 hover:bg-primary-300 disabled:bg-primary-300/25 disabled:text-primary-500 text-white",
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
	isPending,
	pendingText,
	disabled,
	children,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
		isPending?: boolean;
		pendingText?: React.ReactNode;
	}) {
	const Comp = asChild ? SlotPrimitive.Slot : "button";

	return (
		<Comp
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
			disabled={disabled || isPending}
			aria-busy={isPending || undefined}
		>
			{isPending === undefined || asChild ? (
				children
			) : (
				<span className="grid items-center justify-items-center">
					<span
						className={cn(
							"col-start-1 row-start-1 inline-flex items-center justify-center gap-2 transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
							isPending ? "-translate-y-1.5 opacity-0" : "translate-y-0 opacity-100",
						)}
					>
						{children}
					</span>
					<span
						aria-hidden="true"
						className={cn(
							"pointer-events-none col-start-1 row-start-1 inline-flex items-center justify-center gap-2 transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
							isPending ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0",
						)}
					>
						<Spinner className="motion-reduce:animate-none" />
						{pendingText}
					</span>
				</span>
			)}
		</Comp>
	);
}

export { Button, buttonVariants };
