import type * as React from "react";
import { cn } from "@/lib/utils";
import {
	type TypographyTone,
	type TypographyVariant,
	typographyTones,
	typographyVariants,
} from "./typography-variants";

type TypographyProps = React.HTMLAttributes<HTMLElement> & {
	variant?: TypographyVariant;
	tone?: TypographyTone;
	as?: React.ElementType;
};

function Typography({ variant = "body", tone, as, className, ...props }: TypographyProps) {
	const config = typographyVariants[variant];
	const Comp = as ?? config.element;

	return <Comp className={cn(config.className, typographyTones[tone ?? config.tone], className)} {...props} />;
}

export { Typography };
