import { runScheduledJobs } from "@bimbelbeta/api/cron";

const summary = await runScheduledJobs();
console.log("[cron]", JSON.stringify(summary));

process.exit(summary.failedAttemptIds.length > 0 ? 1 : 0);
