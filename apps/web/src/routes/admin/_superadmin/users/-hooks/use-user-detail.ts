import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { orpc } from "@/lib/orpc";

export function useUserDetail() {
	const { userId } = useParams({ from: "/admin/_superadmin/users/$userId" });
	const navigate = useNavigate({ from: "/admin/users/$userId" });

	const handleBack = () => {
		navigate({
			to: "/admin/users",
		});
	};

	const { data, isLoading, refetch } = useQuery(
		orpc.admin.users.find.queryOptions({
			input: { userId },
		}),
	);

	const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
	const [isGrantCreditsDialogOpen, setIsGrantCreditsDialogOpen] = useState(false);
	const [isGrantPremiumDialogOpen, setIsGrantPremiumDialogOpen] = useState(false);

	return {
		data,
		isLoading,
		refetch,
		handleBack,
		isEditRoleDialogOpen,
		setIsEditRoleDialogOpen,
		isGrantCreditsDialogOpen,
		setIsGrantCreditsDialogOpen,
		isGrantPremiumDialogOpen,
		setIsGrantPremiumDialogOpen,
	};
}
