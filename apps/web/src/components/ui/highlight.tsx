import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "motion/react";
import type * as React from "react";

import { cn } from "@/lib/utils";

const highlightVariants = cva("inline-block", {
	variants: {
		variant: {
			primary: "text-primary-300",
			"primary-dark": "text-primary-900",
			secondary: "text-secondary-700",
			"secondary-light": "text-secondary-200",
			blue: "text-blue-600",
			darkBlue: "text-primary-800",
		},
		weight: {
			normal: "font-normal",
			semibold: "font-semibold",
			bold: "font-bold",
		},
	},
	defaultVariants: {
		variant: "primary",
		weight: "normal",
	},
});

type HighlightProps = React.ComponentProps<"span"> &
	VariantProps<typeof highlightVariants> & {
		asChild?: boolean;
		animated?: boolean;
		animationDelay?: number;
	};

function Highlight({
	className,
	variant,
	weight,
	asChild = false,
	animated = false,
	animationDelay = 0,
	children,
	...props
}: HighlightProps) {
	const baseClassName = cn(highlightVariants({ variant, weight }), className);

	if (animated && !asChild) {
		return (
			<motion.span
				className={baseClassName}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.6, delay: animationDelay }}
				{...props}
			>
				{children}
			</motion.span>
		);
	}

	const Comp = asChild ? Slot : "span";

	return (
		<Comp className={baseClassName} {...props}>
			{children}
		</Comp>
	);
}

export { Highlight, highlightVariants };
export type { HighlightProps };
