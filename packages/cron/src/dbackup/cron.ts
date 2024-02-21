import { CronJob } from "cron"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { dbackupCron, dumpOptionsSchema } from "@lib/backup"
import { logger } from "@lib/logger"

const cronJobs: {
  id: string
  kind: "dbackup"
  cron: CronJob
  opts: string
}[] = []

export const fetchDbBackups = async () => {
  //* DBACKUP
  const dbackup = await prisma.databaseBackup.findMany()
  const dbackupIds = dbackup.map((d) => d.id)
  const cronIds = cronJobs.map((c) => c.id)
  const toRemove = cronIds.filter((c) => !dbackupIds.includes(c))
  const toAdd = dbackupIds.filter((d) => !cronIds.includes(d))
  toRemove.forEach((id) => {
    const cron = cronJobs.find((c) => c.id === id)
    if (!cron) return
    cron.cron.stop()
    cronJobs.splice(cronJobs.indexOf(cron), 1)
    logger.debug(`CronJob ${id} stopped`)
  })
  toAdd.forEach((id) => {
    const cron = dbackup.find((d) => d.id === id)
    if (!cron || !cron.cron) return
    const options = {
      id: cron.id,
      PGHOST: cron.host,
      PGPORT: cron.port.toString(),
      PGUSER: cron.username,
      PGDATABASE: cron.database,
      PGPASSWORD: cron.password,
      PG_VERSION: cron.pgVersion as z.infer<typeof dumpOptionsSchema>["PG_VERSION"],
      PG_COMPRESSION_LEVEL: cron.pgCompressionLevel,
      PG_FORMAT: cron.pgFormat as z.infer<typeof dumpOptionsSchema>["PG_FORMAT"],
      ENCRYPTION_KEY: cron.encryptionKey,
      RETENTION: cron.retention,
      S3_BUCKET: cron.s3BucketName,
      S3_REGION: cron.s3Region,
      S3_ACCESS_KEY: cron.s3AccessKey,
      S3_SECRET_KEY: cron.s3SecretKey,
      S3_ENDPOINT: cron.s3Endpoint,
      S3_PATH: cron.s3Path,
    }
    const cronJob = new CronJob(cron.cron, () => dbackupCron(options), null, true, "UTC")
    cronJobs.push({
      id,
      kind: "dbackup",
      cron: cronJob,
      opts: JSON.stringify(options),
    })
    cronJob.start()
    logger.debug(`CronJob ${id} started`)
  })
  const toUpdate = dbackupIds.filter((d) => cronIds.includes(d))
  toUpdate.forEach((id) => {
    const cron = dbackup.find((d) => d.id === id)
    if (!cron) return
    const cronJob = cronJobs.find((c) => c.id === id)
    if (!cronJob) return
    const options = {
      id: cron.id,
      PGHOST: cron.host,
      PGPORT: cron.port.toString(),
      PGUSER: cron.username,
      PGDATABASE: cron.database,
      PGPASSWORD: cron.password,
      PG_VERSION: cron.pgVersion as z.infer<typeof dumpOptionsSchema>["PG_VERSION"],
      PG_COMPRESSION_LEVEL: cron.pgCompressionLevel,
      PG_FORMAT: cron.pgFormat as z.infer<typeof dumpOptionsSchema>["PG_FORMAT"],
      ENCRYPTION_KEY: cron.encryptionKey,
      RETENTION: cron.retention,
      S3_BUCKET: cron.s3BucketName,
      S3_REGION: cron.s3Region,
      S3_ACCESS_KEY: cron.s3AccessKey,
      S3_SECRET_KEY: cron.s3SecretKey,
      S3_ENDPOINT: cron.s3Endpoint,
      S3_PATH: cron.s3Path,
    }
    if (cronJob.cron.cronTime.source === cron.cron && cronJob.opts === JSON.stringify(options)) return
    if (!cron.cron) cronJob.cron.stop()
    else {
      cronJob.cron.stop()
      cronJobs.splice(cronJobs.indexOf(cronJob), 1)
      const newCron = new CronJob(cron.cron, () => dbackupCron(options), null, true, "UTC")
      cronJobs.push({ id, kind: "dbackup", cron: newCron, opts: JSON.stringify(options) })
      newCron.start()
    }
    logger.debug(`CronJob ${id} updated`)
  })
}
