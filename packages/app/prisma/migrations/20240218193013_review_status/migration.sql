/*
  Warnings:

  - The values [PENDING] on the enum `DatabaseBackupStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DatabaseBackupStatus_new" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');
ALTER TABLE "DatabaseBackupLog" ALTER COLUMN "status" TYPE "DatabaseBackupStatus_new" USING ("status"::text::"DatabaseBackupStatus_new");
ALTER TYPE "DatabaseBackupStatus" RENAME TO "DatabaseBackupStatus_old";
ALTER TYPE "DatabaseBackupStatus_new" RENAME TO "DatabaseBackupStatus";
DROP TYPE "DatabaseBackupStatus_old";
COMMIT;
