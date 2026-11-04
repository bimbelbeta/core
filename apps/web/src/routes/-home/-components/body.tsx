import { cn } from "@/lib/utils";

export const Body = ({ className, children }: { className?: string; children?: React.ReactNode }) => {
	return (
		<h2 className={cn("md:text-md text-center text-sm leading-5.25 lg:text-xl lg:leading-7.5", className)}>
			{children}
		</h2>
	);
};
