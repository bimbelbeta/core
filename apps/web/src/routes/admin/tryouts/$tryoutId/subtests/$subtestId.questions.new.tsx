import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CreateQuestionForm } from "@/routes/admin/questions/-components/create-question-form";

export const Route = createFileRoute("/admin/tryouts/$tryoutId/subtests/$subtestId/questions/new")({
	component: CreateQuestionPage,
});

function CreateQuestionPage() {
	const { tryoutId, subtestId } = Route.useParams();
	const sId = Number(subtestId);
	const navigate = useNavigate();

	return (
		<CreateQuestionForm
			questionType="multiple_choice"
			subtestId={sId}
			onSuccess={() => {
				navigate({
					to: "/admin/tryouts/$tryoutId/subtests/$subtestId",
					params: {
						tryoutId,
						subtestId,
					},
				});
			}}
			onCancel={() => {
				navigate({
					to: "/admin/tryouts/$tryoutId/subtests/$subtestId",
					params: {
						tryoutId,
						subtestId,
					},
				});
			}}
		/>
	);
}
