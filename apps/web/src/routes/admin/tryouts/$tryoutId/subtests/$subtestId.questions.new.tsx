import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { parseRouteParamToNumber } from "@/lib/tanstack-router-utils";
import { CreateQuestionForm } from "@/routes/admin/questions/-components/create-question-form";

export const Route = createFileRoute("/admin/tryouts/$tryoutId/subtests/$subtestId/questions/new")({
	staticData: { breadcrumb: "Buat soal" },
	component: CreateQuestionPage,
});

function CreateQuestionPage() {
	const { tryoutId, subtestId: rawSubtestId } = Route.useParams();
	const subtestId = parseRouteParamToNumber(rawSubtestId);
	const navigate = useNavigate();

	return (
		<CreateQuestionForm
			questionType="multiple_choice"
			subtestId={subtestId}
			onSuccess={() => {
				navigate({
					to: "/admin/tryouts/$tryoutId",
					params: { tryoutId },
					search: { tab: "subtests", subtest: subtestId },
				});
			}}
			onCancel={() => {
				navigate({
					to: "/admin/tryouts/$tryoutId",
					params: { tryoutId },
					search: { tab: "subtests", subtest: subtestId },
				});
			}}
		/>
	);
}
