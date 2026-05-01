import { createHash } from "node:crypto";

export const hashAccessCode = (code: string) => {
	return createHash("sha256").update(code).digest("hex");
};
