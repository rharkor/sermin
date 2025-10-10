import { logger } from "@lib/logger";
import { CronJob } from "cron";
import * as fs from "fs/promises";
import { prisma } from "@/lib/prisma";

const currentPath = process.cwd();

export const autoRemoveJob = async () => {
	const now = new Date();
	const maxDurationWarning = 1000 * 60 * 5; // 5 minutes
	const name = "AutoRemove";

	try {
		const backups = await fs.readdir(`${currentPath}/backups`);
		// If older than 7 days, remove
		const toRemove = backups.filter((backup) => {
			const backupDate = new Date(
				parseInt(
					backup.split(".")[0].replace("backup-", "").replace("key-", ""),
				),
			);
			if (isNaN(backupDate.getTime())) return false;
			const now = new Date();
			const diff = now.getTime() - backupDate.getTime();
			console.log(diff);
			return diff > 1000 * 60 * 60 * 24 * 7;
		});
		for (const backup of toRemove) {
			await fs.rm(`${currentPath}/backups/${backup}`, { recursive: true });
			logger.debug(`[autoRemove] removed ${backup}`);
		}
		const took = new Date().getTime() - now.getTime();
		if (took > maxDurationWarning)
			logger.warn(`[${now.toLocaleString()}] ${name} took ${took}ms`);
	} catch (e) {
		logger.error(
			`[${now.toLocaleString()}] ${name} started at ${now.toLocaleString()} and failed after ${
				new Date().getTime() - now.getTime()
			}ms`,
		);
	}

	// Auto remove pending backup older than 6hours
	await prisma.databaseBackupLog.updateMany({
		where: {
			status: "RUNNING",
			createdAt: {
				lt: new Date(new Date().getTime() - 1000 * 60 * 60 * 6), // 6 hours
			},
		},
		data: {
			status: "FAILED",
			error: "Backup timed out",
		},
	});
};

export const autoRemove = async () => {
	// Every 10 minutes
	new CronJob("*/10 * * * *", autoRemoveJob, null, true, "UTC");
	logger.debug(`CronJob autoRemove started`);
};
