import { z } from "zod"

import { redis } from "@/lib/redis"
import {
  onBackupStatusChangeResponseSchema,
  onBackupStatusChangeSchema,
  onNewBackupResponseSchema,
} from "@/lib/schemas/backups"
import { ensureLoggedIn } from "@/lib/utils/server-utils"
import { ITrpcContext } from "@/types"
import { logger } from "@lib/logger"
import { observable } from "@trpc/server/observable"

export const onBackupStatusChange = ({
  ctx: { session },
  input,
}: {
  ctx: ITrpcContext
  input: z.infer<ReturnType<typeof onBackupStatusChangeSchema>>
}) => {
  ensureLoggedIn(session)
  return observable<z.infer<ReturnType<typeof onBackupStatusChangeResponseSchema>>>((emit) => {
    const subscriber = redis.duplicate()
    const onBackupStatusChange = (_: string, data: string) => {
      try {
        const dataParsed = JSON.parse(data)
        const dataValidated = onBackupStatusChangeResponseSchema().parse(dataParsed)
        emit.next(dataValidated)
      } catch (error) {
        logger.error(error)
      }
    }
    const subscribe = async () => {
      await subscriber.connect().catch(() => {})
      for (const backupId of input.backupIds) {
        const key = `db-backup:status:${backupId}`
        subscriber.subscribe(key)
        logger.debug(`Subscribed to ${key}`)
        subscriber.on("message", onBackupStatusChange)
      }
    }
    subscribe()

    return () => {
      for (const backupId of input.backupIds) {
        const key = `db-backup:status:${backupId}`
        logger.debug(`Unsubscribed from ${key}`)
        subscriber.unsubscribe(key)
      }
      subscriber.disconnect()
    }
  })
}

export const onNewBackup = ({ ctx: { session } }: { ctx: ITrpcContext }) => {
  ensureLoggedIn(session)
  return observable<z.infer<ReturnType<typeof onNewBackupResponseSchema>>>((emit) => {
    const subscriber = redis.duplicate()
    const onNewBackup = (_: string, data: string) => {
      emit.next(onNewBackupResponseSchema().parse(JSON.parse(data)))
    }
    const subscribe = async () => {
      await subscriber.connect().catch(() => {})
      subscriber.subscribe("db-backup:new")
      subscriber.on("message", onNewBackup)
    }
    subscribe()

    return () => {
      subscriber.unsubscribe("db-backup:new")
      subscriber.disconnect()
    }
  })
}
