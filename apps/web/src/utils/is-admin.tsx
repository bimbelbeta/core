import { useLocation } from "@tanstack/react-router";

/**
 * Utility function to check if a pathname is an admin route
 * @param pathname - The pathname to check
 * @returns true if the pathname includes "/admin"
 */
export function isAdminPath(pathname: string): boolean {
	return pathname.includes("/admin");
}

/**
 * React hook to check if the current route is an admin route
 * Uses the current location from TanStack Router
 * @returns true if the current route is an admin route
 */
export function useIsAdmin(): boolean {
	const location = useLocation();
	return isAdminPath(location.pathname);
}
