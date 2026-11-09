import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

export const Container = ({
	className,
	asChild = false,
	children,
}: {
	className?: string;
	asChild?: boolean;
	children?: React.ReactNode;
}) => {
	const Comp = asChild ? Slot.Slot : "main";

	return (
		<Comp className={cn("mx-auto flex w-full max-w-4xl flex-col gap-4 px-3 py-6 md:px-8 md:py-8", className)}>
			{children}
		</Comp>
	);
};
