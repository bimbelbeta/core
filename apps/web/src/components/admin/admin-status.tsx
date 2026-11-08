import { cn } from "@/lib/utils";

const statusTones = {
	positive: "bg-green-100/60 text-green-900",
	warning: "bg-amber-100/70 text-amber-900",
	danger: "bg-red-100/60 text-red-900",
	neutral: "bg-neutral-200/70 text-neutral-800",
} as const;

const chipTones = {
	neutral: "bg-neutral-200/70 text-neutral-700",
	accent: "bg-primary-200/70 text-primary-900",
} as const;

const pillClassName = "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap";

interface AdminStatusProps {
	tone: keyof typeof statusTones;
	children: React.ReactNode;
	className?: string;
}

export function AdminStatus({ tone, children, className }: AdminStatusProps) {
	return <span className={cn(pillClassName, statusTones[tone], className)}>{children}</span>;
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
	return <span className="text-muted-foreground text-meta">{children}</span>;
}
