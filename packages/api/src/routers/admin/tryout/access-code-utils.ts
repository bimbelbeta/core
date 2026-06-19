import { randomBytes } from "node:crypto";

export { hashAccessCode } from "@/lib/access-code";

export const maskCode = (code: string) => {
	if (code.length <= 4) {
		return `${code}${"*".repeat(4)}`;
	}

	return `${code.slice(0, 4)}${"*".repeat(Math.max(code.length - 4, 4))}`;
};

export const generateAccessCode = () => {
	return randomBytes(6).toString("base64url").toUpperCase();
};
