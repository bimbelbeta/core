import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { parseRouteParamToNumber } from "@/lib/tanstack-router-utils";
import { CreateQuestionForm } from "@/routes/admin/questions/-components/create-question-form";

export const Route = createFileRoute("/admin/tryouts/$tryoutId/subtests/$subtestId/questions/new")({
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
					to: "/admin/tryouts/$tryoutId/subtests/$subtestId",
					params: {
						tryoutId,
						subtestId: subtestId.toString(),
					},
				});
			}}
			onCancel={() => {
				navigate({
					to: "/admin/tryouts/$tryoutId/subtests/$subtestId",
					params: {
						tryoutId,
						subtestId: subtestId.toString(),
					},
				});
			}}
		/>
	);
}
