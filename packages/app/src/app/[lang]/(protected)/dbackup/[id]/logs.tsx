"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { MoreHorizontal } from "lucide-react"
import { z } from "zod"

import { Icons } from "@/components/icons"
import Searchbar from "@/components/ui/table/searchbar"
import { useDictionary } from "@/contexts/dictionary/utils"
import { getBackupLogsResponseSchema } from "@/lib/schemas/backups"
import { trpc } from "@/lib/trpc/client"
import { cn, formatDate } from "@/lib/utils"
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
  Pagination,
  Skeleton,
  Spinner,
  Tooltip,
  useDisclosure,
} from "@nextui-org/react"

import { TBackupDetailledStatus } from "./content"
import RemoveLog from "./remove-log"

const skeletonRows: z.infer<ReturnType<typeof getBackupLogsResponseSchema>>["logs"] = Array.from({
  length: 5,
}).map((_, i) => ({
  id: i.toString(),
  name: "test",
  databaseBackupId: "test",
  error: "test",
  finishedAt: new Date(),
  isDeleted: false,
  path: "test",
  pgCompressionLevel: 0,
  pgFormat: "test",
  pgVersion: "test",
  retention: new Date(),
  size: 0,
  startedAt: new Date(),
  status: "RUNNING",
  createdAt: new Date(),
  updatedAt: new Date(),
}))

export default function DBackupLogs({ backupId }: { backupId: string }) {
  const dictionary = useDictionary()
  const session = useSession()

  const [search, setSearch] = useState("")
  const [offset, setOffset] = useState(0)
  const limit = 20

  const logs = trpc.backups.getBackupLogs.useQuery({
    search,
    offset,
    limit,
    backupId,
  })

  const [logsStatus, setLogsStatus] = useState<{
    [key: string]: TBackupDetailledStatus["status"] | undefined
  }>({})
  trpc.backups.onBackupStatusChange.useSubscription(
    {
      uuid: session.data?.user.uuid ?? "",
      userId: session.data?.user.id ?? "",
      backupIds: [backupId],
    },
    {
      onData(data) {
        setLogsStatus((prev) => ({
          ...prev,
          [data.logId]: data.status,
        }))
        if (data.status === "success" || data.status === "failed") {
          logs.refetch()
        }
      },
      enabled: session.data?.user.uuid !== undefined,
    }
  )
  const statuses =
    logs.data?.logs.reduce<{
      [key: string]: TBackupDetailledStatus["status"] | "RUNNING" | "SUCCESS" | "FAILED"
    }>((acc, log) => {
      const value: TBackupDetailledStatus["status"] | "RUNNING" | "SUCCESS" | "FAILED" =
        logsStatus[log.id] ?? log.status
      if (value) {
        acc[log.id] = value
      }
      return acc
    }, {}) ?? {}

  trpc.backups.onNewBackup.useSubscription(
    {
      uuid: session.data?.user.uuid ?? "",
      userId: session.data?.user.id ?? "",
    },
    {
      onData() {
        logs.refetch()
      },
      enabled: session.data?.user.uuid !== undefined,
    }
  )

  const [removeBackupId, setRemoveBackupId] = useState<string | null>(null)

  const { isOpen: isRemoveOpen, onOpen: onRemoveOpen, onClose: onRemoveClose } = useDisclosure()

  return (
    <section className="flex flex-1 flex-col gap-2 overflow-hidden p-1">
      <div className="flex w-full flex-row justify-between gap-2">
        <Searchbar placeholder={dictionary.dbackup.searchName} value={search} setValue={setSearch} />
      </div>
      <div className="flex flex-col gap-2">
        {(logs.isLoading ? skeletonRows : (logs.data?.logs ?? [])).map((backup) => (
          <div
            key={backup.id}
            className={cn("rounded-medium bg-content1 group flex flex-row items-center gap-4 p-2", {})}
          >
            <Skeleton
              className={cn({
                "rounded-medium": logs.isLoading,
              })}
              isLoaded={!logs.isLoading}
            >
              <p className="w-[450px] max-w-[550px] truncate">{backup.name ?? "-"}</p>
            </Skeleton>
            <Skeleton
              className={cn({
                "rounded-medium": logs.isLoading,
              })}
              isLoaded={!logs.isLoading}
            >
              <div
                className={cn("text-warning flex w-[150px] max-w-[150px] flex-row items-center gap-2 truncate", {
                  "text-danger": statuses[backup.id] === "FAILED" || statuses[backup.id] === "failed",
                  "text-success": statuses[backup.id] === "SUCCESS" || statuses[backup.id] === "success",
                })}
              >
                {statuses[backup.id] !== "FAILED" &&
                  statuses[backup.id] !== "failed" &&
                  statuses[backup.id] !== "SUCCESS" &&
                  statuses[backup.id] !== "success" && (
                    <Spinner
                      size="sm"
                      color="current"
                      classNames={{
                        wrapper: "size-4",
                      }}
                    />
                  )}
                {(statuses[backup.id] === "FAILED" || statuses[backup.id] === "failed") && backup.error ? (
                  <Tooltip content={backup.error}>
                    <p>{dictionary.dbackup.status[statuses[backup.id]]}</p>
                  </Tooltip>
                ) : (
                  <p>{dictionary.dbackup.status[statuses[backup.id]]}</p>
                )}
              </div>
            </Skeleton>
            <Skeleton
              className={cn({
                "rounded-medium": logs.isLoading,
              })}
              isLoaded={!logs.isLoading}
            >
              <p className="text-muted-foreground min-w-[180px] flex-1 truncate">
                {dictionary.took}{" "}
                {(() => {
                  const startedAt = backup.startedAt.getTime()
                  const finishedAt = backup.finishedAt?.getTime() ?? Date.now()
                  const diff = finishedAt - startedAt
                  const hours = Math.floor(diff / 1000 / 60 / 60)
                  const minutes = Math.floor((diff / 1000 / 60) % 60)
                  const seconds = Math.floor((diff / 1000) % 60)
                  if (hours > 0) {
                    return `${hours}${dictionary.hourFirstChar} ${minutes}${dictionary.minuteFirstChar}`
                  } else if (minutes > 0) {
                    return `${minutes}${dictionary.minuteFirstChar} ${seconds}${dictionary.secondFirstChar}`
                  }
                  return `${seconds}${dictionary.secondFirstChar}`
                })()}
              </p>
            </Skeleton>
            <Skeleton
              className={cn({
                "rounded-medium": logs.isLoading,
              })}
              isLoaded={!logs.isLoading}
            >
              <p className="text-muted-foreground min-w-[180px] flex-1 truncate">
                {!!backup.size ? `~ ${Math.round(backup.size / 1024 / 1024)} MB` : "-"}
              </p>
            </Skeleton>
            <Skeleton
              className={cn({
                "rounded-medium": logs.isLoading,
              })}
              isLoaded={!logs.isLoading}
            >
              <p className="text-muted-foreground min-w-[180px] flex-1 truncate">
                {backup.isDeleted
                  ? dictionary.dbackup.deleted
                  : (() => {
                      if (backup.retention !== null) {
                        const now = Date.now()
                        const retention = backup.retention.getTime()
                        if (now > retention) {
                          return dictionary.dbackup.willBeDeleted
                        }
                        const diff = retention - now
                        const days = Math.floor(diff / 1000 / 60 / 60 / 24)
                        const hours = Math.floor((diff / 1000 / 60 / 60) % 24)
                        const minutes = Math.floor((diff / 1000 / 60) % 60)
                        const seconds = Math.floor((diff / 1000) % 60)
                        if (days > 0) {
                          return `${days}${dictionary.dayFirstChar} ${dictionary.left}`
                        } else if (hours > 0) {
                          return `${hours}${dictionary.hourFirstChar} ${dictionary.left}`
                        } else if (minutes > 0) {
                          return `${minutes}${dictionary.minuteFirstChar} ${dictionary.left}`
                        } else {
                          return `${seconds}${dictionary.secondFirstChar} ${dictionary.left}`
                        }
                      }
                      return dictionary.dbackup.never
                    })()}
              </p>
            </Skeleton>
            <Skeleton
              className={cn({
                "rounded-medium": logs.isLoading,
              })}
              isLoaded={!logs.isLoading}
            >
              <p className="text-muted-foreground min-w-[180px] flex-1 truncate">
                {formatDate(backup.updatedAt, dictionary)}
              </p>
            </Skeleton>
            <Skeleton
              className={cn({
                "rounded-medium": logs.isLoading,
              })}
              isLoaded={!logs.isLoading}
            >
              <p className="text-muted-foreground min-w-[180px] flex-1 truncate">
                {formatDate(backup.createdAt, dictionary)}
              </p>
            </Skeleton>
            <Dropdown>
              <DropdownTrigger>
                <Button
                  variant="light"
                  className="ml-auto h-max min-w-0 shrink-0 p-3"
                  isDisabled={logs.isLoading}
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                >
                  <MoreHorizontal className="size-4 shrink-0" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="actions">
                {/* <DropdownSection showDivider>
                  <DropdownItem
                    key={"see-more"}
                    startContent={<ArchiveRestore className="size-4" />}
                    onPress={() => {
                    }}
                  >
                    {dictionary.dbackup.restore}
                  </DropdownItem>
                </DropdownSection> */}
                <DropdownSection>
                  <DropdownItem
                    key={"delete"}
                    className={"text-danger"}
                    color={"danger"}
                    startContent={<Icons.trash className="size-4" />}
                    onPress={() => {
                      setRemoveBackupId(backup.id)
                      onRemoveOpen()
                    }}
                  >
                    {dictionary.delete}
                  </DropdownItem>
                </DropdownSection>
              </DropdownMenu>
            </Dropdown>
          </div>
        ))}
      </div>
      {logs.data && (
        <Pagination
          total={logs.data.numberOfPages}
          page={offset / limit + 1}
          onChange={(page) => setOffset((page - 1) * limit)}
          className={cn({
            invisible: logs.data.numberOfPages <= 1,
          })}
        />
      )}
      <RemoveLog isOpen={isRemoveOpen} onOpenChange={onRemoveClose} onClose={onRemoveClose} logId={removeBackupId} />
    </section>
  )
}
