import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CreateQuestionForm } from "./-components/create-question-form";

export const Route = createFileRoute("/admin/questions/create")({
	staticData: { breadcrumb: "Buat soal" },
	component: CreateQuestionPage,
});

function CreateQuestionPage() {
	const navigate = useNavigate();
	const goToQuestions = () => navigate({ to: "/admin/questions" });

	return <CreateQuestionForm questionType="multiple_choice" onSuccess={goToQuestions} onCancel={goToQuestions} />;
}
