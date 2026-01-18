import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import * as m from "motion/react-m";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function AnswerCollapsible({
	children,
	title = "Jawaban",
	defaultOpen = false,
}: {
	children: React.ReactNode;
	title?: string;
	defaultOpen?: boolean;
}) {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen}>
			<CollapsibleTrigger className="group flex items-center gap-2 transition-opacity hover:opacity-80">
				<p className="font-medium">{title}</p>
				{isOpen ? <EyeIcon className="size-4" /> : <EyeSlashIcon className="size-4" />}
			</CollapsibleTrigger>
			<CollapsibleContent className="mt-2 overflow-hidden">
				<m.div
					initial={{ opacity: 0, y: -10 }}
					animate={isOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
					exit={{ opacity: 0, y: -10 }}
					transition={{ duration: 0.3, ease: "easeInOut" }}
				>
					{children}
				</m.div>
			</CollapsibleContent>
		</Collapsible>
	);
}
