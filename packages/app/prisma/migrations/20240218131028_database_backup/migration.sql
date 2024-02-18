-- CreateTable
CREATE TABLE "DatabaseBackup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "database" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "pgVersion" TEXT NOT NULL,
    "pgCompressionLevel" INTEGER NOT NULL,
    "s3BucketName" TEXT NOT NULL,
    "s3Region" TEXT NOT NULL,
    "s3AccessKey" TEXT NOT NULL,
    "s3SecretKey" TEXT NOT NULL,
    "s3Endpoint" TEXT NOT NULL,
    "s3Path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatabaseBackup_pkey" PRIMARY KEY ("id")
);
