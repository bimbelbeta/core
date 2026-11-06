import * as React from "react";
import { cn } from "@/lib/utils";

const AdminPageRoot = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div
			ref={ref}
			className={cn(
				"admin-tables mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8",
				className,
			)}
			{...props}
		/>
	),
);
AdminPageRoot.displayName = "AdminPageRoot";

const AdminPageContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div ref={ref} className={cn("flex min-h-0 flex-1 flex-col gap-4", className)} {...props} />
	),
);
AdminPageContent.displayName = "AdminPageContent";

const AdminPageHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div ref={ref} className={cn("flex flex-wrap items-center justify-between gap-3", className)} {...props} />
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
		<div
			ref={ref}
			className={cn("flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end", className)}
			{...props}
		/>
	),
);
AdminPageHeaderActions.displayName = "AdminPageHeaderActions";

export { AdminPageContent, AdminPageHeader, AdminPageHeaderActions, AdminPageHeaderContent, AdminPageRoot };
