import { cn } from "@/lib/utils";

export const Body = ({ className, children }: { className?: string; children?: React.ReactNode }) => {
	return (
		<h2 className={cn("text-center text-sm leading-5.25 md:text-md lg:text-xl lg:leading-7.5", className)}>
			{children}
		</h2>
	);
};
