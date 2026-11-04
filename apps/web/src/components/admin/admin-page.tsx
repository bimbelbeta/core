import * as React from "react";
import { cn } from "@/lib/utils";

const AdminPageRoot = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div ref={ref} className={cn("flex h-full flex-col gap-4 p-3 sm:gap-6 sm:p-4 lg:p-6", className)} {...props} />
	),
);
AdminPageRoot.displayName = "AdminPageRoot";

const AdminPageContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div ref={ref} className={cn("flex flex-1 flex-col gap-4", className)} {...props} />
	),
);
AdminPageContent.displayName = "AdminPageContent";

const AdminPageHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div
			ref={ref}
			className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}
			{...props}
		/>
	),
);
AdminPageHeader.displayName = "AdminPageHeader";

const AdminPageHeaderContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => <div ref={ref} className={cn("flex flex-col gap-1", className)} {...props} />,
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
