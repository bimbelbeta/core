import { createContext, useContext } from "react";
import type { useUsersSelectionState } from "../-hooks/use-users-selection";

export const UsersSelectionContext = createContext<ReturnType<typeof useUsersSelectionState> | null>(null);

export function useUsersSelection() {
	const selection = useContext(UsersSelectionContext);
	if (!selection) throw new Error("Konteks pemilihan user tidak tersedia");
	return selection;
}
