import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { orpc } from "@/lib/orpc";

export function useReferralDetail() {
	const { codeId } = useParams({ from: "/admin/_superadmin/referrals/$codeId" });
	const navigate = useNavigate({ from: "/admin/referrals/$codeId" });
	const { data, isLoading } = useQuery(
		orpc.admin.referral.getUsages.queryOptions({
			input: { codeId, limit: 50 },
		}),
	);

	const handleBack = () => navigate({ to: "/admin/referrals" });

	return { data, isLoading, handleBack };
}
