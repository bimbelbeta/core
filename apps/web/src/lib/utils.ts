import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { FileRoutesByFullPath, FileRoutesByTo } from "@/routeTree.gen";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export type Routes = keyof FileRoutesByTo;
export type RoutesByFullPath = keyof FileRoutesByFullPath;

export const generateSlug = (name: string) => {
	return name
		.toLowerCase()
		.trim()
		.replace(/\s+/g, "-")
		.replace(/[^\w-]+/g, "");
};
