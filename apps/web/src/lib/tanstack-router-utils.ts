import { notFound } from "@tanstack/react-router";

export function parseIdParam(param: string): number {
	const id = Number(param);
	if (Number.isNaN(id)) throw notFound();
	return id;
}
