import { CheckIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { type } from "arktype";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

	const form = useForm({
		defaultValues: {
			essay: defaultAnswer,
		},
		onSubmit: async ({ value }) => {
			saveAnswer({
				tryoutId,
				questionId,
				essayAnswer: value.essay,
			});
		},
		validators: {
			onSubmit: type({
				essay: "string >= 1",
			}),
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
			className="flex flex-col gap-2"
		>
			<form.Field name="essay">
				{(field) => (
					<div className="flex flex-col gap-2">
						<Textarea
							id={field.name}
							name={field.name}
							placeholder="Tuliskan jawabamu disini"
							value={field.state.value}
							onBlur={() => {
								field.handleBlur();
								if (field.state.value.trim().length >= 1) {
									saveAnswer({
										tryoutId,
										questionId,
										essayAnswer: field.state.value,
									});
								}
							}}
							onChange={(e) => field.handleChange(e.target.value)}
							disabled={isPending}
							className="min-h-[150px]"
						/>
						{field.state.meta.errors.map((error) => (
							<p key={error?.message} className="text-destructive text-xs">
								{error?.message}
							</p>
						))}
					</div>
				)}
			</form.Field>
			<form.Subscribe>
				{(state) => (
					<Button
						type="submit"
						size="icon"
						variant="secondary"
						disabled={!state.canSubmit || state.isSubmitting || isPending}
					>
						<CheckIcon weight="bold" />
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}
