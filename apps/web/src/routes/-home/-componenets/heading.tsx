import { cn } from "@/lib/utils";

export const Heading = ({ className, children }: { className?: string; children?: React.ReactNode }) => {
	return (
		<h2
			className={cn(
				"text-center text-2xl leading-9 md:text-3xl md:leading-11.5 2xl:text-[34px] 2xl:leading-12.75",
				className,
			)}
		>
			{children}
		</h2>
	);
};
