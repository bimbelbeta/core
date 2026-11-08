import { contract } from "@bimbelbeta/contract";
import { implement } from "@orpc/server";
import type { Context } from "@/context";
import { DomainError } from "@/lib/domain-error";

export const bareImplementer = implement(contract).$context<Context>();

export const domainErrorMiddleware = bareImplementer.middleware(async function translateDomainError({ next, errors }) {
	try {
		return await next();
	} catch (error) {
		if (error instanceof DomainError) {
			throw error.message ? errors[error.code]({ message: error.message }) : errors[error.code]();
		}
		throw error;
	}
});

export const baseImplementer = bareImplementer.use(domainErrorMiddleware);
