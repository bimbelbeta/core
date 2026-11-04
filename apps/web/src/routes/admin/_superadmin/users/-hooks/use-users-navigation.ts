import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { usePaginationNavigation } from "@/hooks/use-pagination-navigation";
import { isValidRole } from "../-utils";
import { useUsersList } from "./use-users-list";

export function useUsersNavigation() {
	const navigate = useNavigate({ from: "/admin/users/" });
	const { limit = 10, search, role, isPremium } = useSearch({ from: "/admin/_superadmin/users/" });
	const [searchInput, setSearchInput] = useState(search ?? "");
	const { data } = useUsersList();
	const pageInfo = data?.pageInfo;

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

	const { handleNext, handlePrevious } = usePaginationNavigation(navigate, pageInfo, baseSearchParams);

	return {
		searchInput,
		role,
		isPremium,
		handleSearch,
		handleRoleChange,
		handlePremiumChange,
		handleNext,
		handlePrevious,
	};
}
