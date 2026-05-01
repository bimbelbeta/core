import { useLocation } from "@tanstack/react-router";

export function isAdminPath(pathname: string): boolean {
	return pathname.startsWith("/admin");
}

export function useIsAdmin(): boolean {
	const location = useLocation();
	return isAdminPath(location.pathname);
}
