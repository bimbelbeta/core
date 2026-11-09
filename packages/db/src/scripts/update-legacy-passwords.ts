import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { config } from "dotenv";
import { Pool } from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

config({
	path: resolve(__dirname, "../../../../apps/server/.env"),
	quiet: true,
});

async function main() {
	const isExecute = process.argv.includes("--execute");
	const isConfirmed = process.argv.includes("--confirm-staging");

	const databaseUrl = process.env.DATABASE_URL;
	const defaultPassword = process.env.LEGACY_DEFAULT_PASSWORD;
	const migrationTarget = process.env.LEGACY_PASSWORD_MIGRATION_TARGET;

	if (!databaseUrl) {
		throw new Error("DATABASE_URL is required");
	}

	if (!defaultPassword) {
		throw new Error("LEGACY_DEFAULT_PASSWORD is required");
	}

	if (process.env.NODE_ENV === "production") {
		throw new Error("Password migration is blocked in production");
	}

	if (isExecute) {
		if (migrationTarget !== "staging" || !isConfirmed) {
			throw new Error("Execution requires LEGACY_PASSWORD_MIGRATION_TARGET=staging and --confirm-staging");
		}
	}

	const pool = new Pool({
		connectionString: databaseUrl,
		options: "-c search_path=app,public",
	});

	try {
		const result = await pool.query<{
			id: string;
			user_id: string;
		}>(
			`SELECT id, user_id
             FROM app.account
             WHERE provider_id = 'credential'
               AND password IS NOT NULL`,
		);

		const accounts = result.rows;

		console.log(`Credential accounts found: ${accounts.length}`);

		if (accounts.length === 0) {
			console.log("No accounts to update.");
			return;
		}

		if (!isExecute) {
			console.log("DRY RUN: No database records were changed.");
			console.log("Use --execute --confirm-staging to perform the update.");
			return;
		}

		console.log("Starting password migration...");

		const hashedPassword = await hashPassword(defaultPassword);
		const isValid = await verifyPassword({
			hash: hashedPassword,
			password: defaultPassword,
		});

		if (!isValid) {
			throw new Error("Generated password hash failed verification");
		}

		const client = await pool.connect();

		try {
			await client.query("BEGIN");

			const updateResult = await client.query(
				`UPDATE app.account
                 SET password = $1,
                     updated_at = NOW()
                 WHERE provider_id = 'credential'
                   AND password IS NOT NULL`,
				[hashedPassword],
			);

			const updated = updateResult.rowCount ?? 0;

			await client.query("COMMIT");

			console.log(`Password migration completed: ${updated} accounts updated.`);
		} catch (error) {
			await client.query("ROLLBACK");
			throw error;
		} finally {
			client.release();
		}
	} finally {
		await pool.end();
	}
}

main().catch((error) => {
	console.error("Password migration failed:", error);
	process.exitCode = 1;
});
