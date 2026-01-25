import { cn } from "@/lib/utils";

export const Subheading = ({ className, children }: { className?: string; children?: React.ReactNode }) => {
	return <h2 className={cn("text-base leading-tight md:text-lg 2xl:text-2xl", className)}>{children}</h2>;
};
