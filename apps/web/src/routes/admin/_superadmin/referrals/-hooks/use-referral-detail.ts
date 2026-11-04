import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { Route } from "../$codeId";

export function useReferralDetail() {
	const { codeId } = Route.useParams();
	const navigate = Route.useNavigate();
	const { data, isLoading } = useQuery(
		orpc.admin.referral.getUsages.queryOptions({
			input: { codeId, limit: 50 },
		}),
	);

	const handleBack = () => navigate({ to: "/admin/referrals" });

	return { data, isLoading, handleBack };
}
