import {
  createDatabaseBackupResponseSchema,
  createDatabaseBackupSchema,
  deleteDatabaseBackupResponseSchema,
  deleteDatabaseBackupSchema,
  getDatabaseBackupResponseSchema,
  getDatabaseBackupSchema,
  getDatabaseBackupsResponseSchema,
  getDatabaseBackupsSchema,
  updateDatabaseBackupResponseSchema,
  updateDatabaseBackupSchema,
} from "@/lib/schemas/backups"
import { authenticatedNoEmailVerificationProcedure, authenticatedProcedure, router } from "@/lib/server/trpc"

import { createDatabaseBackup, deleteDatabaseBackup, updateDatabaseBackup } from "./mutations"
import { getDatabaseBackup, getDatabaseBackups } from "./queries"

export const backupsRouter = router({
  getDatabaseBackups: authenticatedNoEmailVerificationProcedure
    .input(getDatabaseBackupsSchema())
    .output(getDatabaseBackupsResponseSchema())
    .query(getDatabaseBackups),
  getDatabaseBackup: authenticatedNoEmailVerificationProcedure
    .input(getDatabaseBackupSchema())
    .output(getDatabaseBackupResponseSchema())
    .query(getDatabaseBackup),
  createDatabaseBackup: authenticatedProcedure
    .input(createDatabaseBackupSchema())
    .output(createDatabaseBackupResponseSchema())
    .mutation(createDatabaseBackup),
  updateDatabaseBackup: authenticatedProcedure
    .input(updateDatabaseBackupSchema())
    .output(updateDatabaseBackupResponseSchema())
    .mutation(updateDatabaseBackup),
  deleteDatabaseBackup: authenticatedProcedure
    .input(deleteDatabaseBackupSchema())
    .output(deleteDatabaseBackupResponseSchema())
    .mutation(deleteDatabaseBackup),
})
