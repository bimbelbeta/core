import type * as React from "react";
import { cn } from "@/lib/utils";
import {
	type TypographyTone,
	type TypographyVariant,
	typographyTones,
	typographyVariants,
} from "./typography-variants";

type TypographyProps<T extends React.ElementType> = {
	variant?: TypographyVariant;
	tone?: TypographyTone;
	as?: T;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "variant" | "tone">;

function Typography<T extends React.ElementType = "p">({
	variant = "body",
	tone,
	as,
	className,
	...props
}: TypographyProps<T>) {
	const config = typographyVariants[variant];
	const Comp = as ?? config.element;

	return <Comp className={cn(config.className, typographyTones[tone ?? config.tone], className)} {...props} />;
}

export { Typography };
