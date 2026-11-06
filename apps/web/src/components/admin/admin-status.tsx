import { cn } from "@/lib/utils";

const statusTones = {
	positive: { pill: "bg-green-100/60 text-green-900", dot: "bg-green-600" },
	warning: { pill: "bg-amber-100/70 text-amber-900", dot: "bg-amber-600" },
	danger: { pill: "bg-red-100/60 text-red-900", dot: "bg-red-600" },
	neutral: { pill: "bg-neutral-200/70 text-neutral-800", dot: "bg-neutral-500" },
} as const;

const chipTones = {
	neutral: "bg-neutral-200/70 text-neutral-700",
	accent: "bg-primary-200/70 text-primary-900",
} as const;

const pillClassName =
	"inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap";

interface AdminStatusProps {
	tone: keyof typeof statusTones;
	children: React.ReactNode;
	className?: string;
}

export function AdminStatus({ tone, children, className }: AdminStatusProps) {
	const { pill, dot } = statusTones[tone];

	return (
		<span className={cn(pillClassName, pill, className)}>
			<span className={cn("size-1.5 shrink-0 rounded-full", dot)} />
			{children}
		</span>
	);
}

interface AdminChipProps {
	children: React.ReactNode;
	icon?: React.ReactNode;
	tone?: keyof typeof chipTones;
}

export function AdminChip({ children, icon, tone = "neutral" }: AdminChipProps) {
	return (
		<span className={cn(pillClassName, chipTones[tone])}>
			{icon}
			{children}
		</span>
	);
}

/**
 * The expected/default value of a column. Rendered as plain muted text so filled
 * pills stay reserved for values that actually need the eye: exceptions and states.
 */
export function AdminMeta({ children }: { children: React.ReactNode }) {
	return <span className="text-muted-foreground text-sm">{children}</span>;
}
