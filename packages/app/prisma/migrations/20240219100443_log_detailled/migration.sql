/*
  Warnings:

  - Added the required column `pgCompressionLevel` to the `DatabaseBackupLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pgFormat` to the `DatabaseBackupLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pgVersion` to the `DatabaseBackupLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `retention` to the `DatabaseBackupLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DatabaseBackupLog" ADD COLUMN     "encryptionKey" TEXT,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pgCompressionLevel" INTEGER NOT NULL,
ADD COLUMN     "pgFormat" TEXT NOT NULL,
ADD COLUMN     "pgVersion" TEXT NOT NULL,
ADD COLUMN     "retention" INTEGER NOT NULL;
