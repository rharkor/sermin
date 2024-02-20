import { z } from "zod"

import { prisma } from "@/lib/prisma"
import {
  getBackupLogsResponseSchema,
  getBackupLogsSchema,
  getDatabaseBackupResponseSchema,
  getDatabaseBackupSchema,
  getDatabaseBackupsResponseSchema,
  getDatabaseBackupsSchema,
} from "@/lib/schemas/backups"
import { ApiError, ensureLoggedIn, handleApiError } from "@/lib/utils/server-utils"
import { apiInputFromSchema } from "@/types"
import { Prisma } from "@prisma/client"

export const getDatabaseBackups = async ({
  ctx: { session },
  input,
}: apiInputFromSchema<typeof getDatabaseBackupsSchema>) => {
  try {
    ensureLoggedIn(session)

    const { offset, search, limit } = input

    const condition: Prisma.DatabaseBackupWhereInput = {
      OR: search
        ? [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: search,
                mode: "insensitive",
              },
            },
          ]
        : undefined,
    }

    const backups = await prisma.databaseBackup.findMany({
      where: condition,
      take: limit,
      skip: offset,
      orderBy: [
        {
          name: "asc",
        },
      ],
      include: {
        logs: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    })
    const numberOfPages = Math.ceil((await prisma.databaseBackup.count({ where: condition })) / limit)

    const data: z.infer<ReturnType<typeof getDatabaseBackupsResponseSchema>> = {
      backups: backups.map((backup) => ({
        ...backup,
        lastStatus: backup.logs.length > 0 ? backup.logs[0] : null,
      })),
      count: backups.length,
      page: offset / limit + 1,
      numberOfPages,
    }

    return data
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const getDatabaseBackup = async ({
  ctx: { session },
  input,
}: apiInputFromSchema<typeof getDatabaseBackupSchema>) => {
  try {
    ensureLoggedIn(session)

    const backup = await prisma.databaseBackup.findUnique({
      where: {
        id: input.id,
      },
      include: {
        logs: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    })

    if (!backup) {
      ApiError("backupAutoNotFound")
    }

    const data: z.infer<ReturnType<typeof getDatabaseBackupResponseSchema>> = {
      backup: {
        ...backup,
        hasEncryptionKey: !!backup.encryptionKey,
        lastStatus: backup.logs.length > 0 ? backup.logs[0] : null,
      },
    }

    return data
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const getBackupLogs = async ({ ctx: { session }, input }: apiInputFromSchema<typeof getBackupLogsSchema>) => {
  try {
    ensureLoggedIn(session)

    const { backupId, offset, limit, search } = input

    const condition: Prisma.DatabaseBackupLogWhereInput = {
      databaseBackupId: backupId,
      OR: search
        ? [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          ]
        : undefined,
    }

    const logs = await prisma.databaseBackupLog.findMany({
      where: condition,
      take: limit,
      skip: offset,
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
    })

    const numberOfPages = Math.ceil((await prisma.databaseBackupLog.count({ where: condition })) / limit)

    const data: z.infer<ReturnType<typeof getBackupLogsResponseSchema>> = {
      logs,
      count: logs.length,
      page: offset / limit + 1,
      numberOfPages,
    }

    return data
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
