import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { clearContent, seedContent } from "./subject.seed";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({
	path: resolve(__dirname, "../../../../apps/server/.env"),
	quiet: true,
});

async function main() {
	if (!process.env.DATABASE_URL) {
		throw new Error("DATABASE_URL is required");
	}

	if (process.env.NODE_ENV === "production") {
		throw new Error("Cannot run seed script in production");
	}

	console.log("Starting content seed...");

	const db = drizzle(process.env.DATABASE_URL);

	await clearContent(db);
	await seedContent(db);

	console.log("Content seed completed");

	process.exit(0);
}

main().catch((error) => {
	console.error("Content seed failed:", error);
	process.exit(1);
});
