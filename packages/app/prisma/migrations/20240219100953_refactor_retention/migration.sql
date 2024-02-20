/*
  Warnings:

  - The `retention` column on the `DatabaseBackupLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "DatabaseBackupLog" DROP COLUMN "retention",
ADD COLUMN     "retention" TIMESTAMP(3);
