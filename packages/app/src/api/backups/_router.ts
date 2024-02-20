import {
  backupNowResponseSchema,
  backupNowSchema,
  createDatabaseBackupResponseSchema,
  createDatabaseBackupSchema,
  deleteDatabaseBackupResponseSchema,
  deleteDatabaseBackupSchema,
  deleteLogResponseSchema,
  deleteLogSchema,
  duplicateDatabaseBackupResponseSchema,
  duplicateDatabaseBackupSchema,
  getBackupLogsResponseSchema,
  getBackupLogsSchema,
  getDatabaseBackupResponseSchema,
  getDatabaseBackupSchema,
  getDatabaseBackupsResponseSchema,
  getDatabaseBackupsSchema,
  onBackupStatusChangeSchema,
  onNewBackupSchema,
  updateDatabaseBackupResponseSchema,
  updateDatabaseBackupSchema,
} from "@/lib/schemas/backups"
import {
  authenticatedNoEmailVerificationProcedure,
  authenticatedProcedure,
  router,
  wsAuthenticatedProcedure,
} from "@/lib/server/trpc"

import {
  backupNow,
  createDatabaseBackup,
  deleteDatabaseBackup,
  deleteLog,
  duplicateDatabaseBackup,
  updateDatabaseBackup,
} from "./mutations"
import { getBackupLogs, getDatabaseBackup, getDatabaseBackups } from "./queries"
import { onBackupStatusChange, onNewBackup } from "./subscriptions"

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
  duplicateDatabaseBackup: authenticatedProcedure
    .input(duplicateDatabaseBackupSchema())
    .output(duplicateDatabaseBackupResponseSchema())
    .mutation(duplicateDatabaseBackup),
  backupNow: authenticatedProcedure.input(backupNowSchema()).output(backupNowResponseSchema()).mutation(backupNow),
  onBackupStatusChange: wsAuthenticatedProcedure.input(onBackupStatusChangeSchema()).subscription(onBackupStatusChange),
  getBackupLogs: authenticatedNoEmailVerificationProcedure
    .input(getBackupLogsSchema())
    .output(getBackupLogsResponseSchema())
    .query(getBackupLogs),
  onNewBackup: wsAuthenticatedProcedure.input(onNewBackupSchema()).subscription(onNewBackup),
  deleteLog: authenticatedProcedure.input(deleteLogSchema()).output(deleteLogResponseSchema()).mutation(deleteLog),
})
