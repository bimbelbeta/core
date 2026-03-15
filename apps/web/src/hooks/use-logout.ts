import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

/** Returns a `logout` async function and a `pending` boolean for logout state. */
export function useLogout() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [pending, setPending] = useState(false);

	const logout = async () => {
		setPending(true);
		await authClient.signOut();
		queryClient.removeQueries();
		navigate({ to: "/" });
		setPending(false);
	};

	return { logout, pending };
}
