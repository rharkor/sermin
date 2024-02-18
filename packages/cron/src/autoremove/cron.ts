import { CronJob } from "cron"
import * as fs from "fs/promises"

import { logger } from "@lib/logger"

const currentPath = process.cwd()

export const autoRemoveJob = async () => {
  const now = new Date()
  const maxDurationWarning = 1000 * 60 * 5 // 5 minutes
  const name = "AutoRemove"

  try {
    const backups = await fs.readdir(`${currentPath}/backups`)
    // If older than 7 days, remove
    const toRemove = backups.filter((backup) => {
      const backupDate = new Date(parseInt(backup.split(".")[0].replace("backup-", "").replace("key-", "")))
      if (isNaN(backupDate.getTime())) return false
      const now = new Date()
      const diff = now.getTime() - backupDate.getTime()
      console.log(diff)
      return diff > 1000 * 60 * 60 * 24 * 7
    })
    for (const backup of toRemove) {
      await fs.rm(`${currentPath}/backups/${backup}`, { recursive: true })
      logger.debug(`[autoRemove] removed ${backup}`)
    }
    const took = new Date().getTime() - now.getTime()
    if (took > maxDurationWarning) logger.warn(`[${now.toLocaleString()}] ${name} took ${took}ms`)
  } catch (e) {
    logger.error(
      `[${now.toLocaleString()}] ${name} started at ${now.toLocaleString()} and failed after ${
        new Date().getTime() - now.getTime()
      }ms`
    )
  }
}

export const autoRemove = async () => {
  new CronJob("0 0 * * *", autoRemoveJob, null, true, "UTC")
  logger.debug(`CronJob autoRemove started`)
}
