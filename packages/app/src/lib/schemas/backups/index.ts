import { z } from "zod"

import { postgresFormat, postgresVersion } from "@/types/constants"

import { wsAuthenticatedSchema } from "../auth"

export const databaseBackupSchema = () =>
  z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    host: z.string(),
    port: z.number(),
    database: z.string(),
    username: z.string(),
    password: z.string(),
    s3BucketName: z.string(),
    s3Region: z.string(),
    s3AccessKey: z.string(),
    s3SecretKey: z.string(),
    s3Endpoint: z.string(),
    s3Path: z.string(),
    cron: z.string().nullable(),
    pgVersion: z.string(),
    pgCompressionLevel: z.number(),
    pgFormat: z.string(),
    retention: z.number(),
    encryptionKey: z.string().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })

export const getDatabaseBackupsSchema = () =>
  z.object({
    offset: z.number(),
    search: z.string().optional(),
    limit: z.literal(20),
  })

export const getDatabaseBackupsResponseSchema = () =>
  z.object({
    backups: z.array(
      databaseBackupSchema()
        .omit({
          password: true,
          s3SecretKey: true,
          encryptionKey: true,
        })
        .extend({
          lastStatus: z
            .object({
              id: z.string(),
              status: z.enum(["RUNNING", "SUCCESS", "FAILED"]),
            })
            .nullable(),
        })
    ),
    page: z.number(),
    numberOfPages: z.number(),
    count: z.number(),
  })

export const getDatabaseBackupSchema = () =>
  z.object({
    id: z.string(),
  })

export const getDatabaseBackupResponseSchema = () =>
  z.object({
    backup: databaseBackupSchema()
      .omit({
        password: true,
        s3SecretKey: true,
        encryptionKey: true,
      })
      .extend({
        hasEncryptionKey: z.boolean(),
        lastStatus: z
          .object({
            id: z.string(),
            status: z.enum(["RUNNING", "SUCCESS", "FAILED"]),
          })
          .nullable(),
      }),
  })

export const createDatabaseBackupSchema = () =>
  z.object({
    name: z.string(),
    description: z
      .string()
      .transform((v) => (v === "" ? null : v))
      .nullable(),
    host: z.string(),
    port: z.coerce.number(),
    database: z.string(),
    username: z.string(),
    password: z.string(),
    s3BucketName: z.string(),
    s3Region: z.string(),
    s3AccessKey: z.string(),
    s3SecretKey: z.string(),
    s3Endpoint: z.string(),
    s3Path: z.string(),
    cron: z.string(),
    pgVersion: z.enum(postgresVersion),
    pgCompressionLevel: z.coerce.number().min(0).max(9),
    pgFormat: z.enum(postgresFormat),
    retention: z.coerce.number().min(-1), // -1 for infinite
    encryptionKey: z
      .string()
      .transform((v) => (v === "" ? undefined : v))
      .optional(),
  })

export const createDatabaseBackupResponseSchema = () =>
  z.object({
    success: z.boolean(),
  })

export const updateDatabaseBackupSchema = () =>
  createDatabaseBackupSchema()
    .partial()
    .extend({
      id: z.string(),
      password: z
        .string()
        .transform((v) => (v === "" ? undefined : v))
        .optional(),
      s3SecretKey: z
        .string()
        .transform((v) => (v === "" ? undefined : v))
        .optional(),
    })

export const updateDatabaseBackupResponseSchema = () =>
  z.object({
    success: z.boolean(),
  })

export const deleteDatabaseBackupSchema = () =>
  z.object({
    id: z.string(),
  })

export const deleteDatabaseBackupResponseSchema = () =>
  z.object({
    success: z.boolean(),
  })

export const duplicateDatabaseBackupSchema = () =>
  z.object({
    id: z.string(),
  })

export const duplicateDatabaseBackupResponseSchema = () =>
  z.object({
    success: z.boolean(),
  })

export const backupNowSchema = () =>
  z.object({
    id: z.string(),
  })

export const backupNowResponseSchema = () =>
  z.object({
    success: z.boolean(),
  })

export const backupDetailledStatusSchema = () =>
  z.object({
    status: z.enum(["deletingOldBackups", "dumping", "compressing", "encrypting", "uploading", "success", "failed"]),
    error: z.string().nullable(),
    id: z.string(),
    logId: z.string(),
  })

export const onBackupStatusChangeSchema = () =>
  wsAuthenticatedSchema().extend({
    backupIds: z.array(z.string()),
  })

export const onBackupStatusChangeResponseSchema = () => backupDetailledStatusSchema()

export const backupLogSchema = () =>
  z.object({
    id: z.string(),
    databaseBackupId: z.string(),
    status: z.enum(["RUNNING", "SUCCESS", "FAILED"]),
    error: z.string().nullable(),
    startedAt: z.date(),
    finishedAt: z.date().nullable(),
    size: z.number().nullable(),
    name: z.string().nullable(),
    path: z.string().nullable(),
    retention: z.date().nullable(),
    encryptionKey: z.string().nullable(),
    pgVersion: z.string(),
    pgCompressionLevel: z.number(),
    pgFormat: z.string(),
    isDeleted: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })

export const getBackupLogsSchema = () =>
  z.object({
    backupId: z.string(),
    offset: z.number(),
    search: z.string().optional(),
    limit: z.literal(20),
  })

export const getBackupLogsResponseSchema = () =>
  z.object({
    logs: z.array(backupLogSchema().omit({ encryptionKey: true })),
    page: z.number(),
    numberOfPages: z.number(),
    count: z.number(),
  })

export const onNewBackupSchema = () => wsAuthenticatedSchema()

export const onNewBackupResponseSchema = () =>
  z.object({
    backupId: z.string(),
    logId: z.string(),
  })

export const deleteLogSchema = () =>
  z.object({
    id: z.string(),
  })

export const deleteLogResponseSchema = () =>
  z.object({
    success: z.boolean(),
  })
