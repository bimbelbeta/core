import { notFound } from "@tanstack/react-router";

export function parseRouteParamToNumber(param: string): number {
	const id = Number(param);
	if (Number.isNaN(id)) throw notFound();
	return id;
}

export function withoutSearchKey(params: Record<string, unknown>, key: string) {
	const { [key]: _omitted, ...rest } = params;
	return rest;
}
