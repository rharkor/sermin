import { z } from "zod"

import { prisma } from "@/lib/prisma"
import {
  getDatabaseBackupResponseSchema,
  getDatabaseBackupSchema,
  getDatabaseBackupsResponseSchema,
  getDatabaseBackupsSchema,
} from "@/lib/schemas/backups"
import { ensureLoggedIn, handleApiError } from "@/lib/utils/server-utils"
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
    })
    const numberOfPages = Math.ceil((await prisma.databaseBackup.count({ where: condition })) / limit)

    const data: z.infer<ReturnType<typeof getDatabaseBackupsResponseSchema>> = {
      backups,
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
    })

    if (!backup) {
      throw new Error("Backup not found")
    }

    const data: z.infer<ReturnType<typeof getDatabaseBackupResponseSchema>> = {
      backup,
    }

    return data
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
