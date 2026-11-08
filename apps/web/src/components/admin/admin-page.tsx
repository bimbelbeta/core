import { ArrowLeftIcon } from "@phosphor-icons/react";
import { Link, type LinkComponentProps } from "@tanstack/react-router";
import * as React from "react";
import { Label } from "@/components/ui/label";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

const AdminPageRoot = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div
			ref={ref}
			className={cn(
				"admin-tables mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col gap-3 p-4 sm:gap-4 sm:p-5",
				className,
			)}
			{...props}
		/>
	),
);
AdminPageRoot.displayName = "AdminPageRoot";

const AdminPageContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div ref={ref} className={cn("flex min-h-0 flex-1 flex-col gap-3", className)} {...props} />
	),
);
AdminPageContent.displayName = "AdminPageContent";

const AdminPageHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div ref={ref} className={cn("flex min-h-8 flex-wrap items-center justify-between gap-3", className)} {...props} />
	),
);
AdminPageHeader.displayName = "AdminPageHeader";

const AdminPageHeaderContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div ref={ref} className={cn("flex min-w-0 flex-col gap-1", className)} {...props} />
	),
);
AdminPageHeaderContent.displayName = "AdminPageHeaderContent";

const AdminPageHeaderActions = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div ref={ref} className={cn("ml-auto flex flex-wrap items-center justify-end gap-2", className)} {...props} />
	),
);
AdminPageHeaderActions.displayName = "AdminPageHeaderActions";

const adminBackLinkClassName =
	"text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 text-meta mb-1.5 inline-flex items-center gap-1 self-start rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-2";

function AdminBackLink({
	className,
	children,
	...props
}: Omit<LinkComponentProps<"a">, "children"> & { children: React.ReactNode }) {
	return (
		<Link className={cn(adminBackLinkClassName, className)} {...props}>
			<ArrowLeftIcon className="size-3" />
			{children}
		</Link>
	);
}

function AdminBackButton({ className, children, ...props }: React.ComponentProps<"button">) {
	return (
		<button type="button" className={cn(adminBackLinkClassName, className)} {...props}>
			<ArrowLeftIcon className="size-3" />
			{children}
		</button>
	);
}

interface AdminSectionProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
	title: React.ReactNode;
	description?: React.ReactNode;
}

const AdminSection = React.forwardRef<HTMLElement, AdminSectionProps>(
	({ className, title, description, children, ...props }, ref) => (
		<section ref={ref} className={cn("flex flex-col gap-3", className)} {...props}>
			<div className="flex min-w-0 flex-col gap-1">
				<Typography variant="subtitle4">{title}</Typography>
				{description && (
					<Typography variant="body" tone="muted">
						{description}
					</Typography>
				)}
			</div>
			{children}
		</section>
	),
);
AdminSection.displayName = "AdminSection";

interface AdminFieldRowProps {
	label: string;
	hint?: React.ReactNode;
	htmlFor?: string;
	optional?: boolean;
	children: React.ReactNode;
	className?: string;
}

function AdminFieldRow({ label, hint, htmlFor, optional, children, className }: AdminFieldRowProps) {
	return (
		<div
			className={cn(
				"grid min-w-0 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-start md:gap-8",
				className,
			)}
		>
			<div className="min-w-0">
				<Label htmlFor={htmlFor}>
					{label}
					{optional && <span className="text-muted-foreground font-normal">(Opsional)</span>}
				</Label>
				{hint && (
					<Typography variant="caption" className="mt-1 leading-relaxed">
						{hint}
					</Typography>
				)}
			</div>
			<div className="min-w-0">{children}</div>
		</div>
	);
}

const AdminFormShell = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div ref={ref} className={cn("flex w-full max-w-[880px] flex-col gap-4", className)} {...props} />
	),
);
AdminFormShell.displayName = "AdminFormShell";

export {
	AdminBackButton,
	AdminBackLink,
	AdminFieldRow,
	AdminFormShell,
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderActions,
	AdminPageHeaderContent,
	AdminPageRoot,
	AdminSection,
};
