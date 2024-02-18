/*
  Warnings:

  - Added the required column `cron` to the `DatabaseBackup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pgFormat` to the `DatabaseBackup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `retention` to the `DatabaseBackup` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DatabaseBackup" ADD COLUMN     "cron" TEXT NOT NULL,
ADD COLUMN     "encryptionKey" TEXT,
ADD COLUMN     "pgFormat" TEXT NOT NULL,
ADD COLUMN     "retention" INTEGER NOT NULL;
