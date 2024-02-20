import { z } from "zod"

import { prisma } from "@/lib/prisma"
import {
  backupNowSchema,
  createDatabaseBackupSchema,
  deleteDatabaseBackupSchema,
  deleteLogSchema,
  duplicateDatabaseBackupSchema,
  updateDatabaseBackupSchema,
} from "@/lib/schemas/backups"
import { ApiError, ensureLoggedIn, handleApiError } from "@/lib/utils/server-utils"
import { apiInputFromSchema } from "@/types"
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { dbackupCron, dumpOptionsSchema } from "@lib/backup"
import { logger } from "@lib/logger"

export const createDatabaseBackup = async ({
  input,
  ctx: { session },
}: apiInputFromSchema<typeof createDatabaseBackupSchema>) => {
  try {
    ensureLoggedIn(session)

    await prisma.databaseBackup.create({
      data: input,
    })

    return { success: true }
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const updateDatabaseBackup = async ({
  input,
  ctx: { session },
}: apiInputFromSchema<typeof updateDatabaseBackupSchema>) => {
  try {
    ensureLoggedIn(session)

    await prisma.databaseBackup.update({
      where: { id: input.id },
      data: input,
    })

    return { success: true }
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const deleteDatabaseBackup = async ({
  input,
  ctx: { session },
}: apiInputFromSchema<typeof deleteDatabaseBackupSchema>) => {
  try {
    ensureLoggedIn(session)

    await prisma.databaseBackup.delete({
      where: { id: input.id },
    })

    return { success: true }
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const duplicateDatabaseBackup = async ({
  input,
  ctx: { session },
}: apiInputFromSchema<typeof duplicateDatabaseBackupSchema>) => {
  try {
    ensureLoggedIn(session)

    const backup = await prisma.databaseBackup.findUnique({
      where: { id: input.id },
    })

    if (!backup) {
      ApiError("backupAutoNotFound")
    }

    await prisma.databaseBackup.create({
      data: {
        ...backup,
        id: undefined,
        name: `${backup.name} (copy)`,
      },
    })

    return { success: true }
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const backupNow = async ({ input, ctx: { session } }: apiInputFromSchema<typeof backupNowSchema>) => {
  try {
    ensureLoggedIn(session)

    const cron = await prisma.databaseBackup.findUnique({
      where: { id: input.id },
      include: {
        logs: {
          where: { status: "RUNNING" },
          take: 1,
        },
      },
    })

    if (!cron) {
      ApiError("backupAutoNotFound")
    }

    if (cron.logs.length > 0) {
      ApiError("backupAlreadyRunning")
    }

    await new Promise((resolve) => {
      dbackupCron(
        {
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
        },
        false,
        resolve
      )
    })

    return { success: true }
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const deleteLog = async ({ input, ctx: { session } }: apiInputFromSchema<typeof deleteLogSchema>) => {
  try {
    ensureLoggedIn(session)

    const backupSettings = await prisma.databaseBackupLog.findUnique({
      where: {
        id: input.id,
      },
      include: {
        databaseBackup: true,
      },
    })
    if (!backupSettings) {
      ApiError("backupLogNotFound")
    }

    if (backupSettings.status === "RUNNING" || !backupSettings.path) {
      ApiError("backupAlreadyRunning")
    }

    // Delete from S3
    if (!backupSettings.isDeleted) {
      const options = backupSettings?.databaseBackup
      const s3Client = new S3Client({
        region: options.s3Region,
        credentials: {
          accessKeyId: options.s3AccessKey,
          secretAccessKey: options.s3SecretKey,
        },
        endpoint: options.s3Endpoint,
      })
      const command = new DeleteObjectCommand({
        Bucket: options.s3BucketName,
        Key: backupSettings.path,
      })
      await s3Client.send(command).catch((e) => {
        logger.error(e)
        ApiError("failedToDeleteS3")
      })
    }

    await prisma.databaseBackupLog.delete({
      where: { id: input.id },
    })

    return { success: true }
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
