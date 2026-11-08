import { createHash, randomBytes } from "node:crypto";

export const hashAccessCode = (code: string) => {
	return createHash("sha256").update(code).digest("hex");
};

export const generateAccessCode = () => {
	return randomBytes(6).toString("base64url").toUpperCase();
};
