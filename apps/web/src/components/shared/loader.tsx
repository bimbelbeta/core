import { BookOpenIcon } from "@phosphor-icons/react";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";

export default function Loader({ className }: { className?: string }) {
	return (
		<div
			role="status"
			aria-live="polite"
			className={cn("flex min-h-[60vh] w-full items-center justify-center", className)}
		>
			{/* Hidden until 400ms so fast navigations never flash it */}
			<m.div
				className="flex items-center gap-2.5"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.4, duration: 0.2 }}
			>
				<m.span
					className="text-primary block"
					animate={{ rotate: [0, -8, 0] }}
					transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
				>
					<BookOpenIcon className="size-6" weight="fill" />
				</m.span>
				<m.span
					className="text-muted-foreground text-meta"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.6, duration: 0.25 }}
				>
					Memuat…
				</m.span>
			</m.div>
		</div>
	);
}
