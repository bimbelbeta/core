import * as React from "react";
import { cn } from "@/lib/utils";

const AdminPageRoot = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div ref={ref} className={cn("flex h-full flex-col gap-6 p-6", className)} {...props} />
	),
);
AdminPageRoot.displayName = "AdminPageRoot";

const AdminPageTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
	({ className, ...props }, ref) => (
		<h1 ref={ref} className={cn("font-bold text-2xl text-primary-navy-900", className)} {...props} />
	),
);
AdminPageTitle.displayName = "AdminPageTitle";

const AdminPageDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
	({ className, ...props }, ref) => <p ref={ref} className={cn("text-muted-foreground", className)} {...props} />,
);
AdminPageDescription.displayName = "AdminPageDescription";

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
	({ className, ...props }, ref) => <div ref={ref} className={cn("flex items-center gap-2", className)} {...props} />,
);
AdminPageHeaderActions.displayName = "AdminPageHeaderActions";

export {
	AdminPageRoot,
	AdminPageTitle,
	AdminPageDescription,
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderContent,
	AdminPageHeaderActions,
};
