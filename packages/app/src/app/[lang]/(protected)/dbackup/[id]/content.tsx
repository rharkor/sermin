"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { z } from "zod"

import { useDictionary } from "@/contexts/dictionary/utils"
import { fontTitle } from "@/lib/fonts"
import { backupDetailledStatusSchema } from "@/lib/schemas/backups"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"
import { Chip, Skeleton } from "@nextui-org/react"

import DBackupInfo from "./info"
import DBackupLogs from "./logs"

export type TBackupDetailledStatus = z.infer<ReturnType<typeof backupDetailledStatusSchema>>

export default function DBackupContent({ backupId }: { backupId: string }) {
  const dictionary = useDictionary()
  const session = useSession()
  const backup = trpc.backups.getDatabaseBackup.useQuery({
    id: backupId,
  })

  const [backupStatusDetailled, setBackupStatusDetailled] = useState<TBackupDetailledStatus["status"] | null>(null)
  trpc.backups.onBackupStatusChange.useSubscription(
    {
      uuid: session.data?.user.uuid ?? "",
      userId: session.data?.user.id ?? "",
      backupIds: [backupId],
    },
    {
      onData(data) {
        setBackupStatusDetailled(data.status)
      },
      enabled: session.data?.user.uuid !== undefined,
    }
  )
  const status = backupStatusDetailled ?? backup.data?.backup.lastStatus?.status ?? "SUCCESS"

  return (
    <>
      <div className="flex flex-row items-center gap-2">
        <Skeleton
          isLoaded={!backup.isLoading}
          className={cn("m-1 w-max", {
            "rounded-medium": backup.isLoading,
          })}
        >
          <h1 className={cn("text-4xl", fontTitle.className)}>{backup.data?.backup.name ?? "loading"}</h1>
        </Skeleton>
        <Skeleton
          isLoaded={!backup.isLoading}
          className={cn({
            "rounded-medium": backup.isLoading,
          })}
        >
          <Chip
            color={
              status === "SUCCESS" || status === "success"
                ? "success"
                : status === "FAILED" || status === "failed"
                  ? "danger"
                  : "warning"
            }
            variant="flat"
          >
            {dictionary.dbackup.status[status]}
          </Chip>
        </Skeleton>
      </div>
      <DBackupInfo backupId={backupId} status={status} />
      <DBackupLogs backupId={backupId} />
    </>
  )
}
