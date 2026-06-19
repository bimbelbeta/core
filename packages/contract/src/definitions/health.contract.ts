import { type } from "arktype";
import { oc } from "@/lib/contract-definition";

export const healthCheckContract = oc
	.route({
		path: "/healthcheck",
		method: "GET",
		tags: ["Uncategorized"],
	})
	.output(type({ message: "string" }));
