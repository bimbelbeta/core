import { createFileRoute, useRouter } from "@tanstack/react-router";
import { CreateQuestionForm } from "./-components/create-question-form";

export const Route = createFileRoute("/admin/questions/create")({
	component: CreateQuestionPage,
});

function CreateQuestionPage() {
	const router = useRouter();

	return (
		<CreateQuestionForm
			questionType="multiple_choice"
			onSuccess={() => router.history.back()}
			onCancel={() => router.history.back()}
		/>
	);
}
