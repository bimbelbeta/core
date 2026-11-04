import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { isValidRole } from "../-utils";

export function useUsersNavigation() {
	const navigate = useNavigate({ from: "/admin/users/" });
	const { limit = 10, search, role, isPremium } = useSearch({ from: "/admin/_superadmin/users/" });
	const [searchInput, setSearchInput] = useState(search ?? "");
	const baseSearchParams = {
		...(search && { search }),
		...(role && { role }),
		...(isPremium !== undefined && { isPremium }),
		limit,
	};

	const handleSearch = (value: string) => {
		setSearchInput(value);
		navigate({
			search: value
				? {
						search: value,
						...(role && { role }),
						...(isPremium !== undefined && { isPremium }),
						limit,
					}
				: baseSearchParams,
		});
	};

	const handleRoleChange = (value: string) => {
		navigate({
			search:
				value !== "all" && isValidRole(value)
					? {
							role: value,
							...(search && { search }),
							...(isPremium !== undefined && { isPremium }),
							limit,
						}
					: {
							...(search && { search }),
							...(isPremium !== undefined && { isPremium }),
							limit,
						},
		});
	};

	const handlePremiumChange = (value: string) => {
		navigate({
			search:
				value !== "all"
					? {
							isPremium: value === "true",
							...(search && { search }),
							...(role && { role }),
							limit,
						}
					: {
							...(search && { search }),
							...(role && { role }),
							limit,
						},
		});
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
