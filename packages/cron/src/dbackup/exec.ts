import * as fs from "fs/promises"
import { exit } from "process"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { dbackupCron, dumpOptionsSchema } from "@lib/backup"

const main = async () => {
  // Delete all files in backups dir
  await fs.rm("backups", { recursive: true, force: true })
  await fs.mkdir("backups")
  await fs.writeFile("backups/.gitkeep", "")
  console.time("dbackupCron")
  const dbackup = await prisma.databaseBackup.findMany()
  await Promise.all(
    dbackup.map((cron) =>
      dbackupCron({
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
      })
    )
  )
  console.timeEnd("dbackupCron")
  exit(0)
}

main()
