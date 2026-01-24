import { CheckIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTryoutStore } from "../-hooks/use-tryout-store";

export function EssayForm({
	tryoutId,
	questionId,
	saveAnswer,
	isPending,
}: {
	tryoutId: number;
	questionId: number;
	saveAnswer: (data: { tryoutId: number; questionId: number; essayAnswer: string }) => void;
	isPending: boolean;
}) {
	const { essayAnswers } = useTryoutStore();
	const defaultAnswer = essayAnswers[questionId] ?? "";

	const [value, setValue] = useState(defaultAnswer);
	const [showSaved, setShowSaved] = useState(false);
	const [wasPending, setWasPending] = useState(false);

	const MAX_CHARACTERS = 15;
	const isOverLimit = value.length > MAX_CHARACTERS;

	// Track when isPending transitions from true to false (save completed)
	useEffect(() => {
		if (wasPending && !isPending) {
			setShowSaved(true);
			const timer = setTimeout(() => setShowSaved(false), 2500);
			return () => clearTimeout(timer);
		}
		setWasPending(isPending);
	}, [isPending, wasPending]);

	const handleBlur = () => {
		const trimmedValue = value.trim();
		if (trimmedValue.length >= 1 && trimmedValue.length <= MAX_CHARACTERS && trimmedValue !== defaultAnswer) {
			saveAnswer({
				tryoutId,
				questionId,
				essayAnswer: value,
			});
		}
	};

	return (
		<div className="flex flex-col gap-1.5">
			<Textarea
				placeholder="Tuliskan jawabamu disini"
				value={value}
				onBlur={handleBlur}
				onChange={(e) => setValue(e.target.value.trimStart())}
				className="min-h-37.5"
			/>
			<div className="flex items-center justify-between text-muted-foreground text-xs">
				<span className={cn(isOverLimit && "text-destructive")}>
					{value.length}/{MAX_CHARACTERS} karakter
				</span>
				<span
					className={cn(
						"flex items-center gap-1 transition-opacity duration-300",
						isPending || showSaved ? "opacity-100" : "opacity-0",
					)}
				>
					{isPending ? (
						"Menyimpan..."
					) : (
						<>
							<CheckIcon className="size-3.5" weight="bold" />
							Tersimpan
						</>
					)}
				</span>
			</div>
		</div>
	);
}
