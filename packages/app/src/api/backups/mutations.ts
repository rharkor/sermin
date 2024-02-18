import { prisma } from "@/lib/prisma"
import {
  createDatabaseBackupSchema,
  deleteDatabaseBackupSchema,
  updateDatabaseBackupSchema,
} from "@/lib/schemas/backups"
import { ensureLoggedIn, handleApiError } from "@/lib/utils/server-utils"
import { apiInputFromSchema } from "@/types"

export const createDatabaseBackup = async ({
  input,
  ctx: { session },
}: apiInputFromSchema<typeof createDatabaseBackupSchema>) => {
  try {
    ensureLoggedIn(session)

    await prisma.databaseBackup.create({
      data: input,
    })

    return { success: true }
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const updateDatabaseBackup = async ({
  input,
  ctx: { session },
}: apiInputFromSchema<typeof updateDatabaseBackupSchema>) => {
  try {
    ensureLoggedIn(session)

    await prisma.databaseBackup.update({
      where: { id: input.id },
      data: input,
    })

    return { success: true }
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const deleteDatabaseBackup = async ({
  input,
  ctx: { session },
}: apiInputFromSchema<typeof deleteDatabaseBackupSchema>) => {
  try {
    ensureLoggedIn(session)

    await prisma.databaseBackup.delete({
      where: { id: input.id },
    })

    return { success: true }
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
