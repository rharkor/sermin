import { exec } from "child_process"
import * as fs from "fs/promises"
import path from "path"
import { promisify } from "util"
import { z } from "zod"

import { backupDetailledStatusSchema } from "@app/src/lib/schemas/backups"
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3"
import { prisma } from "@cron/src/lib/prisma"
import { redis } from "@cron/src/lib/redis"

import { logger } from "./logger"

export const dumpOptionsSchema = z.object({
  id: z.string(),
  PGHOST: z.string(),
  PGPORT: z.string(),
  PGUSER: z.string(),
  PGDATABASE: z.string(),
  PGPASSWORD: z.string(),
  PG_VERSION: z.enum(["13", "14", "15", "16"]),
  PG_COMPRESSION_LEVEL: z.number().min(0).max(9),
  PG_FORMAT: z.enum(["custom", "directory", "tar", "plain"]),
  ENCRYPTION_KEY: z.string().nullable(),
  RETENTION: z.number(),
  S3_BUCKET: z.string(),
  S3_REGION: z.string(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_ENDPOINT: z.string(),
  S3_PATH: z.string(),
})

type TBackupDetailledStatus = z.infer<ReturnType<typeof backupDetailledStatusSchema>>

const execS = promisify(exec)
export const dbackupCron = async (
  _options: z.infer<typeof dumpOptionsSchema>,
  isTesting?: boolean,
  onStarted?: (id: string) => void
) => {
  const currentPath = path.dirname(import.meta.url.replace("file://", "").replace("file:", ""))
  const now = new Date()
  const maxDurationWarning = 1000 * 60 * 60 // 60 minutes
  const name = "DBackup"

  const options = dumpOptionsSchema.parse(_options)
  //? Ensure the database is not already being backed up
  const runningBackup = await prisma.databaseBackupLog.findFirst({
    where: {
      databaseBackupId: options.id,
      status: "RUNNING",
    },
  })
  if (runningBackup) {
    throw new Error(`Backup for database ${options.id} is already running`)
  }
  const dbl = await prisma.databaseBackupLog.create({
    data: {
      databaseBackupId: options.id,
      startedAt: now,
      status: "RUNNING",
      retention: options.RETENTION !== -1 ? new Date(now.getTime() + options.RETENTION * 24 * 60 * 60 * 1000) : null,
      encryptionKey: options.ENCRYPTION_KEY,
      pgVersion: options.PG_VERSION,
      pgCompressionLevel: options.PG_COMPRESSION_LEVEL,
      pgFormat: options.PG_FORMAT,
    },
  })
  const emitter = redis.duplicate()
  await emitter.connect().catch(() => {})
  await emitter.publish("db-backup:new", JSON.stringify({ backupId: options.id, logId: dbl.id }))
  if (onStarted) onStarted(dbl.id)
  const updateDetailledStatus = async (
    status: TBackupDetailledStatus["status"],
    error: TBackupDetailledStatus["error"] = null
  ) => {
    const emitter = redis.duplicate()
    await emitter.connect().catch(() => {})
    await emitter.publish(
      `db-backup:status:${options.id}`,
      JSON.stringify({ status, error, id: options.id, logId: dbl.id })
    )
  }
  try {
    // max 8 characters
    const smallId = Math.random().toString(36).substring(2, 10)
    const uniqueId = now.getTime() + "-" + smallId

    // Based on retention, delete old backups
    async function deleteOldBackups() {
      await updateDetailledStatus("deletingOldBackups")
      const dbls = await prisma.databaseBackupLog.findMany({
        where: {
          databaseBackupId: options.id,
          status: "SUCCESS",
          isDeleted: false,
          retention: {
            lt: new Date(),
          },
        },
        orderBy: {
          startedAt: "desc",
        },
      })
      //? Delete old backups
      for (const dbl of dbls) {
        if (dbl.path === null) continue
        const s3Client = new S3Client({
          region: options.S3_REGION,
          credentials: {
            accessKeyId: options.S3_ACCESS_KEY,
            secretAccessKey: options.S3_SECRET_KEY,
          },
          endpoint: options.S3_ENDPOINT,
        })
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: options.S3_BUCKET,
            Key: dbl.path,
          })
        )
        await prisma.databaseBackupLog.update({
          where: {
            id: dbl.id,
          },
          data: {
            isDeleted: true,
          },
        })
        logger.debug(`[${now.toLocaleString()}] ${name} deleted old backup ${dbl.id}`)
      }

      //? Delete old logs
      const oldLogs = await prisma.databaseBackupLog.findMany({
        where: {
          databaseBackupId: options.id,
          // 3 months
          updatedAt: {
            lt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30 * 3),
          },
          isDeleted: true,
        },
      })
      for (const log of oldLogs) {
        await prisma.databaseBackupLog.delete({
          where: {
            id: log.id,
          },
        })
        logger.debug(`[${now.toLocaleString()}] ${name} deleted old log ${log.id}`)
      }
    }
    await deleteOldBackups()

    async function full() {
      logger.debug(`[${now.toLocaleString()}] ${name} started`)
      let finalPath = ""
      //* DUMP
      await updateDetailledStatus("dumping")
      const PG_OUTPUT_FILE = path.join(currentPath, "backups", `backup-${uniqueId}`)
      const PG_DUMP_PATH = `/usr/lib/postgresql/${options.PG_VERSION}/bin/pg_dump`
      await execS(path.join(currentPath, "scripts", "db-backup.sh"), {
        env: {
          ...process.env,
          PGHOST: options.PGHOST,
          PGPORT: options.PGPORT,
          PGUSER: options.PGUSER,
          PGDATABASE: options.PGDATABASE,
          PGPASSWORD: options.PGPASSWORD,
          PG_VERSION: options.PG_VERSION,
          PG_COMPRESSION_LEVEL: options.PG_COMPRESSION_LEVEL.toString(),
          PG_OUTPUT_FILE,
          PG_DUMP_PATH,
          PG_FORMAT: options.PG_FORMAT.at(0),
        },
      }).catch((err) => {
        logger.error(`[${now.toLocaleString()}] ${name} failed executing dump script`)
        throw err
      })
      finalPath = PG_OUTPUT_FILE
      //* COMPRESS
      await updateDetailledStatus("compressing")
      const PG_COMPRESSED_FILE = `${PG_OUTPUT_FILE}.tar.gz`
      await execS("tar -czf $PG_COMPRESSED_FILE $PG_OUTPUT_FILE", {
        env: {
          ...process.env,
          PG_OUTPUT_FILE: path.basename(PG_OUTPUT_FILE),
          PG_COMPRESSED_FILE: path.basename(PG_COMPRESSED_FILE),
        },
        cwd: path.dirname(PG_OUTPUT_FILE),
      }).catch((err) => {
        logger.error(`[${now.toLocaleString()}] ${name} failed compressing dump`)
        throw err
      })
      if (!isTesting)
        await fs.rm(PG_OUTPUT_FILE, {
          recursive: true,
        })
      finalPath = PG_COMPRESSED_FILE
      //* ENCRYPT (gpg)
      if (options.ENCRYPTION_KEY) {
        await updateDetailledStatus("encrypting")
        const PG_ENCRYPTED_FILE = `${PG_COMPRESSED_FILE}.gpg`
        const ENCRYPTION_KEY = options.ENCRYPTION_KEY
        const ENCRYPTION_KEY_FILE = path.join(currentPath, "backups", `key-${uniqueId}`)
        await fs.writeFile(ENCRYPTION_KEY_FILE, ENCRYPTION_KEY)
        await execS(
          "gpg --output $PG_ENCRYPTED_FILE --yes --batch --passphrase-file $ENCRYPTION_KEY_FILE -c $PG_COMPRESSED_FILE",
          {
            env: {
              ...process.env,
              PG_COMPRESSED_FILE,
              PG_ENCRYPTED_FILE,
              ENCRYPTION_KEY_FILE,
            },
          }
        ).catch((err) => {
          logger.error(`[${now.toLocaleString()}] ${name} failed encrypting dump`)
          throw err
        })
        if (!isTesting) {
          await fs.rm(PG_COMPRESSED_FILE)
          await fs.rm(ENCRYPTION_KEY_FILE)
        }
        finalPath = PG_ENCRYPTED_FILE
      }

      //* UPLOAD
      await updateDetailledStatus("uploading")
      const key = options.S3_PATH ? path.join(options.S3_PATH, path.basename(finalPath)) : path.basename(finalPath)
      let size = 0
      const upload = async () => {
        const s3Client = new S3Client({
          region: options.S3_REGION,
          credentials: {
            accessKeyId: options.S3_ACCESS_KEY,
            secretAccessKey: options.S3_SECRET_KEY,
          },
          endpoint: options.S3_ENDPOINT,
        })
        const bucketName = options.S3_BUCKET
        const tenMB = 10 * 1024 * 1024

        // const twentyFiveMB = 25 * 1024 * 1024
        // const createString = (size = twentyFiveMB) => {
        //   return "x".repeat(size)
        // }
        // const str = createString()
        // const buffer = Buffer.from(str, "utf8")
        const buffer = await fs.readFile(finalPath)
        size = buffer.length

        const multipartUpload = async () => {
          let uploadId: string | undefined = ""
          try {
            const multipartUpload = await s3Client.send(
              new CreateMultipartUploadCommand({
                Bucket: bucketName,
                Key: key,
              })
            )

            uploadId = multipartUpload.UploadId

            const uploadPromises = []
            // Multipart uploads require a minimum size of 5 MB per part.
            const numberOfParts = Math.ceil(buffer.length / tenMB)
            const partSize = Math.ceil(buffer.length / numberOfParts)

            // Upload each part.
            for (let i = 0; i < numberOfParts; i++) {
              const start = i * partSize
              const end = start + partSize
              uploadPromises.push(
                s3Client
                  .send(
                    new UploadPartCommand({
                      Bucket: bucketName,
                      Key: key,
                      UploadId: uploadId,
                      Body: buffer.subarray(start, end),
                      PartNumber: i + 1,
                    })
                  )
                  .then((d) => {
                    console.log("Part", i + 1, "uploaded")
                    return d
                  })
              )
            }

            const uploadResults = await Promise.all(uploadPromises)

            return await s3Client.send(
              new CompleteMultipartUploadCommand({
                Bucket: bucketName,
                Key: key,
                UploadId: uploadId,
                MultipartUpload: {
                  Parts: uploadResults.map(({ ETag }, i) => ({
                    ETag,
                    PartNumber: i + 1,
                  })),
                },
              })
            )
          } catch (err) {
            logger.error(`[${now.toLocaleString()}] ${name} failed uploading dump`)

            if (uploadId) {
              const abortCommand = new AbortMultipartUploadCommand({
                Bucket: bucketName,
                Key: key,
                UploadId: uploadId,
              })

              await s3Client.send(abortCommand)
            }
          }
        }
        const singlePartUpload = async () => {
          return await s3Client.send(
            new PutObjectCommand({
              Bucket: bucketName,
              Key: key,
              Body: buffer,
            })
          )
        }

        logger.debug(
          `[${now.toLocaleString()}] ${name} uploading dump (${Math.round((buffer.length / 1024 / 1024) * 100) / 100} MB) file to S3`
        )
        if (buffer.length > tenMB) {
          await multipartUpload()
        } else {
          await singlePartUpload()
        }
      }
      await upload()
      if (!isTesting) await fs.rm(finalPath)
      logger.debug(`[${now.toLocaleString()}] ${name} finished`)

      return {
        size,
        name: path.basename(finalPath),
        path: key,
      }
    }
    const data = await full()
    await prisma.databaseBackupLog.update({
      where: {
        id: dbl.id,
      },
      data: {
        finishedAt: new Date(),
        status: "SUCCESS",
        size: data.size,
        name: data.name,
        path: data.path,
      },
    })
    await updateDetailledStatus("success")
    const took = new Date().getTime() - now.getTime()
    if (took > maxDurationWarning) logger.warn(`[${now.toLocaleString()}] ${name} took ${took}ms`)
  } catch (e) {
    logger.error(
      `[${now.toLocaleString()}] ${name} started at ${now.toLocaleString()} and failed after ${
        new Date().getTime() - now.getTime()
      }ms`,
      e
    )
    const eString = typeof e === "string" ? e : e instanceof Error ? e.message : JSON.stringify(e)
    await updateDetailledStatus("failed", eString)
    await prisma.databaseBackupLog.update({
      where: {
        id: dbl.id,
      },
      data: {
        finishedAt: new Date(),
        status: "FAILED",
        error: eString,
      },
    })
  }
}
