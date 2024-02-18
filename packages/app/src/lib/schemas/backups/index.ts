import { z } from "zod"

import { postgresFormat, postgresVersion } from "@/types/constants"

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
    cron: z.string(),
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
      databaseBackupSchema().omit({
        password: true,
        s3SecretKey: true,
        encryptionKey: true,
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
    backup: databaseBackupSchema().omit({
      password: true,
      s3SecretKey: true,
      encryptionKey: true,
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
      .transform((v) => (v === "" ? null : v))
      .nullable(),
  })

export const createDatabaseBackupResponseSchema = () =>
  z.object({
    success: z.boolean(),
  })

export const updateDatabaseBackupSchema = () =>
  createDatabaseBackupSchema().partial().extend({
    id: z.string(),
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
