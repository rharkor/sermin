-- CreateEnum
CREATE TYPE "DatabaseBackupStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "DatabaseBackupLog" (
    "id" TEXT NOT NULL,
    "databaseBackupId" TEXT NOT NULL,
    "status" "DatabaseBackupStatus" NOT NULL,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "size" INTEGER,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatabaseBackupLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DatabaseBackupLog" ADD CONSTRAINT "DatabaseBackupLog_databaseBackupId_fkey" FOREIGN KEY ("databaseBackupId") REFERENCES "DatabaseBackup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
