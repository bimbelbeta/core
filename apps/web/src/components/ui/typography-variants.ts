export const typographyVariants = {
	display: { element: "h1", className: "text-3xl leading-tight font-semibold sm:text-4xl", tone: "default" },
	title: { element: "h1", className: "text-primary-navy-900 text-2xl font-bold", tone: "default" },
	subtitle1: { element: "h2", className: "text-lg font-semibold", tone: "default" },
	subtitle2: { element: "h3", className: "text-base font-semibold", tone: "default" },
	body: { element: "p", className: "text-sm", tone: "default" },
	caption: { element: "p", className: "text-xs", tone: "muted" },
	overline: { element: "p", className: "text-sm font-medium", tone: "muted" },
} as const;

export type TypographyVariant = keyof typeof typographyVariants;

export const typographyTones = {
	default: "",
	muted: "text-muted-foreground",
	destructive: "text-destructive",
} as const;

export type TypographyTone = keyof typeof typographyTones;
