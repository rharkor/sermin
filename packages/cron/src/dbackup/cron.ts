import { exec } from "child_process"
import { CronJob, CronTime } from "cron"
import * as fs from "fs/promises"
import path from "path"
import { promisify } from "util"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3"
import { logger } from "@lib/logger"

export const dumpOptionsSchema = z.object({
  PGHOST: z.string(),
  PGPORT: z.string(),
  PGUSER: z.string(),
  PGDATABASE: z.string(),
  PGPASSWORD: z.string(),
  PG_VERSION: z.enum(["13", "14", "15"]),
  PG_COMPRESSION_LEVEL: z.number().min(0).max(9),
  PG_FORMAT: z.enum(["custom", "directory", "tar", "plain"]).transform((v) => v.at(0)),
  ENCRYPTION_KEY: z.string().nullable(),
  RETENTION: z.number(),
  S3_BUCKET: z.string(),
  S3_REGION: z.string(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_ENDPOINT: z.string(),
  S3_PATH: z.string(),
})

const execS = promisify(exec)

const currentPath = process.cwd()

const dbackupCron = async (_options: z.infer<typeof dumpOptionsSchema>, isTesting?: boolean) => {
  const now = new Date()
  const maxDurationWarning = 1000 * 60 * 60 // 60 minutes
  const name = "DBackup"

  try {
    const options = dumpOptionsSchema.parse(_options)
    const uniqueId = now.getTime()

    async function full() {
      logger.debug(`[${now.toLocaleString()}] ${name} started`)
      let finalPath = ""
      //* DUMP
      const PG_OUTPUT_FILE = path.join(currentPath, "backups", `backup-${uniqueId}`)
      const PG_DUMP_PATH = `/usr/lib/postgresql/${options.PG_VERSION}/bin/pg_dump`
      await execS(path.join(currentPath, "scripts", "db-backup.sh"), {
        env: {
          PGHOST: options.PGHOST,
          PGPORT: options.PGPORT,
          PGUSER: options.PGUSER,
          PGDATABASE: options.PGDATABASE,
          PGPASSWORD: options.PGPASSWORD,
          PG_VERSION: options.PG_VERSION,
          PG_COMPRESSION_LEVEL: options.PG_COMPRESSION_LEVEL.toString(),
          PG_OUTPUT_FILE,
          PG_DUMP_PATH,
          PG_FORMAT: options.PG_FORMAT,
        },
      }).catch((err) => {
        logger.error(`[${now.toLocaleString()}] ${name} failed executing dump script`)
        throw err
      })
      finalPath = PG_OUTPUT_FILE
      logger.debug(`[${now.toLocaleString()}] ${name} dump file created at ${PG_OUTPUT_FILE}`)
      //* COMPRESS
      const PG_COMPRESSED_FILE = `${PG_OUTPUT_FILE}.tar.gz`
      await execS("tar -czf $PG_COMPRESSED_FILE $PG_OUTPUT_FILE", {
        env: {
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
      logger.debug(`[${now.toLocaleString()}] ${name} compressed dump file created at ${PG_COMPRESSED_FILE}`)
      //* ENCRYPT (gpg)
      if (options.ENCRYPTION_KEY) {
        const PG_ENCRYPTED_FILE = `${PG_COMPRESSED_FILE}.gpg`
        const ENCRYPTION_KEY = options.ENCRYPTION_KEY
        const ENCRYPTION_KEY_FILE = path.join(currentPath, "backups", `key-${uniqueId}`)
        await fs.writeFile(ENCRYPTION_KEY_FILE, ENCRYPTION_KEY)
        await execS(
          "gpg --output $PG_ENCRYPTED_FILE --yes --batch --passphrase-file $ENCRYPTION_KEY_FILE -c $PG_COMPRESSED_FILE",
          {
            env: {
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
        logger.debug(`[${now.toLocaleString()}] ${name} encrypted dump file created at ${PG_ENCRYPTED_FILE}`)
      }

      //* UPLOAD
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
        const key = path.basename(finalPath)
        const tenMB = 10 * 1024 * 1024

        // const twentyFiveMB = 25 * 1024 * 1024
        // const createString = (size = twentyFiveMB) => {
        //   return "x".repeat(size)
        // }
        // const str = createString()
        // const buffer = Buffer.from(str, "utf8")
        const buffer = await fs.readFile(finalPath)

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
      logger.debug(`[${now.toLocaleString()}] ${name} uploaded dump file to S3`)
      logger.debug(`[${now.toLocaleString()}] ${name} finished`)
    }
    await full()
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

export default dbackupCron

const cronJobs: {
  id: string
  kind: "dbackup"
  cron: CronJob
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
    if (!cron) return
    const cronJob = new CronJob(
      cron.cron,
      () =>
        dbackupCron({
          PGHOST: cron.host,
          PGPORT: cron.port.toString(),
          PGUSER: cron.username,
          PGDATABASE: cron.database,
          PGPASSWORD: cron.password,
          PG_VERSION: cron.pgVersion as z.infer<typeof dumpOptionsSchema>["PG_VERSION"],
          PG_COMPRESSION_LEVEL: cron.pgCompressionLevel,
          PG_FORMAT: cron.pgFormat,
          ENCRYPTION_KEY: cron.encryptionKey,
          RETENTION: cron.retention,
          S3_BUCKET: cron.s3BucketName,
          S3_REGION: cron.s3Region,
          S3_ACCESS_KEY: cron.s3AccessKey,
          S3_SECRET_KEY: cron.s3SecretKey,
          S3_ENDPOINT: cron.s3Endpoint,
          S3_PATH: cron.s3Path,
        }),
      null,
      true,
      "UTC"
    )
    cronJobs.push({ id, kind: "dbackup", cron: cronJob })
    cronJob.start()
    logger.debug(`CronJob ${id} started`)
  })
  const toUpdate = dbackupIds.filter((d) => cronIds.includes(d))
  toUpdate.forEach((id) => {
    const cron = dbackup.find((d) => d.id === id)
    if (!cron) return
    const cronJob = cronJobs.find((c) => c.id === id)
    if (!cronJob) return
    if (cronJob.cron.cronTime.source === cron.cron) return
    cronJob.cron.setTime(new CronTime(cron.cron))
    logger.debug(`CronJob ${id} updated`)
  })
}
