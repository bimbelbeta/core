import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { buildUsersSearch, isValidRole } from "../-utils";

export function useUsersNavigation() {
	const navigate = useNavigate({ from: "/admin/users/" });
	const { limit = 10, search, role, isPremium } = useSearch({ from: "/admin/_superadmin/users/" });
	const [searchInput, setSearchInput] = useState(search ?? "");
	const baseSearchParams = buildUsersSearch({ search, role, isPremium, limit });

	const handleSearch = (value: string) => {
		setSearchInput(value);
		navigate({ search: value ? { ...baseSearchParams, search: value } : baseSearchParams });
	};

	const handleRoleChange = (value: string) => {
		const { role: _role, ...rest } = baseSearchParams;
		navigate({ search: value !== "all" && isValidRole(value) ? { ...rest, role: value } : rest });
	};

	const handlePremiumChange = (value: string) => {
		const { isPremium: _isPremium, ...rest } = baseSearchParams;
		navigate({ search: value !== "all" ? { ...rest, isPremium: value === "true" } : rest });
	};

	return {
		searchInput,
		role,
		isPremium,
		handleSearch,
		handleRoleChange,
		handlePremiumChange,
	};
}
