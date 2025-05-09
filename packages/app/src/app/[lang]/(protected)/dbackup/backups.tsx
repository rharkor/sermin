"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Copy, DatabaseBackup, Expand, MoreHorizontal, Pencil } from "lucide-react"
import { z } from "zod"

import { Icons } from "@/components/icons"
import Searchbar from "@/components/ui/table/searchbar"
import { useDictionary } from "@/contexts/dictionary/utils"
import { backupDetailledStatusSchema, getDatabaseBackupsResponseSchema } from "@/lib/schemas/backups"
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
  useDisclosure,
} from "@nextui-org/react"

import AddBackup from "./add-backup"
import RemoveBackup from "./remove-backup"
import UpdateBackup from "./update-backup"

type TBackupDetailledStatus = z.infer<ReturnType<typeof backupDetailledStatusSchema>>

const skeletonRows: z.infer<ReturnType<typeof getDatabaseBackupsResponseSchema>>["backups"] = Array.from({
  length: 5,
}).map((_, i) => ({
  id: i.toString(),
  name: "test",
  description: "test",
  host: "",
  port: 0,
  database: "",
  username: "",
  s3BucketName: "",
  s3Region: "",
  s3AccessKey: "",
  s3SecretKey: "",
  s3Endpoint: "",
  s3Path: "",
  cron: "",
  pgVersion: "17",
  pgCompressionLevel: 0,
  pgFormat: "custom",
  retention: 0,
  encryptionKey: "",
  lastStatus: {
    id: "test",
    status: "SUCCESS",
  },
  createdAt: new Date(),
  updatedAt: new Date(),
}))

export default function Backups() {
  const router = useRouter()
  const dictionary = useDictionary()
  const utils = trpc.useUtils()
  const session = useSession()

  const {
    isOpen: isAddBackupOpen,
    onOpen: onAddBackupOpen,
    onOpenChange: onAddBackupOpenChange,
    onClose: onAddBackupClose,
  } = useDisclosure()

  const [search, setSearch] = useState("")
  const [offset, setOffset] = useState(0)

  const limit = 20
  const backups = trpc.backups.getDatabaseBackups.useQuery({
    search,
    offset,
    limit,
  })

  const [removeBackupId, setRemoveBackupId] = useState<string | null>(null)
  const { isOpen: isRemoveOpen, onOpen: onRemoveOpen, onClose: onRemoveClose } = useDisclosure()

  const [updateBackupId, setUpdateBackupId] = useState<string | null>(null)
  const { isOpen: isUpdateOpen, onOpen: onUpdateOpen, onClose: onUpdateClose } = useDisclosure()

  const duplicateBackup = trpc.backups.duplicateDatabaseBackup.useMutation()
  const handleDuplicate = async (id: string) => {
    await duplicateBackup.mutateAsync({ id })
    utils.backups.invalidate()
  }

  const instantBackup = trpc.backups.backupNow.useMutation()
  const handleInstantBackup = async (id: string) => {
    await instantBackup.mutateAsync({ id })
    utils.backups.invalidate()
  }

  const [backupStatusDetailled, setBackupStatusDetailled] = useState<{
    [key: string]: TBackupDetailledStatus["status"] | undefined
  }>({})
  trpc.backups.onBackupStatusChange.useSubscription(
    {
      uuid: session.data?.user.uuid ?? "",
      userId: session.data?.user.id ?? "",
      backupIds: backups.data?.backups.map((b) => b.id) ?? [],
    },
    {
      onData(data) {
        setBackupStatusDetailled((prev) => ({
          ...prev,
          [data.id]: data.status,
        }))
      },
      enabled: session.data?.user.uuid !== undefined,
    }
  )
  const statuses =
    backups.data?.backups.reduce<{
      [key: string]: TBackupDetailledStatus["status"] | "RUNNING" | "SUCCESS" | "FAILED"
    }>((acc, backup) => {
      const value: TBackupDetailledStatus["status"] | "RUNNING" | "SUCCESS" | "FAILED" =
        backupStatusDetailled[backup.id] ?? backup.lastStatus?.status ?? "SUCCESS"
      if (value) {
        acc[backup.id] = value
      }
      return acc
    }, {}) ?? {}

  return (
    <section className="flex flex-1 flex-col gap-2 overflow-hidden p-1">
      <div className="flex w-full flex-row justify-between gap-2">
        <Searchbar placeholder={dictionary.dbackup.search} value={search} setValue={setSearch} />
        <Button onPress={onAddBackupOpen} color="primary" size="lg">
          {dictionary.dbackup.createBackup}
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {(backups.isLoading ? skeletonRows : (backups.data?.backups ?? [])).map((backup) => (
          <Link
            key={backup.id}
            className={cn("rounded-medium bg-content1 group flex cursor-pointer flex-row items-center gap-4 p-2", {
              "hover:bg-content2 transition-colors duration-200 ease-in-out": !backups.isLoading,
            })}
            href={`/dbackup/${backup.id}`}
          >
            <div className="flex w-[250px] flex-1 flex-col">
              <Skeleton
                className={cn({
                  "rounded-medium": backups.isLoading,
                })}
                isLoaded={!backups.isLoading}
              >
                <p className="w-[150px] max-w-[150px] truncate">{backup.name}</p>
              </Skeleton>
              <Skeleton
                className={cn({
                  "rounded-medium": backups.isLoading,
                })}
                isLoaded={!backups.isLoading}
              >
                <p className="text-muted-foreground w-[250px] max-w-[250px] truncate text-sm">{backup.description}</p>
              </Skeleton>
            </div>
            <Skeleton
              className={cn({
                "rounded-medium": backups.isLoading,
              })}
              isLoaded={!backups.isLoading}
            >
              <p className="text-muted-foreground h-6 w-[150px] max-w-[150px] truncate">{backup.cron}</p>
            </Skeleton>
            <Skeleton
              className={cn({
                "rounded-medium": backups.isLoading,
              })}
              isLoaded={!backups.isLoading}
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
                <p>{dictionary.dbackup.status[statuses[backup.id]]}</p>
              </div>
            </Skeleton>
            <Skeleton
              className={cn({
                "rounded-medium": backups.isLoading,
              })}
              isLoaded={!backups.isLoading}
            >
              <p className="text-muted-foreground min-w-[180px] flex-1 truncate">
                {formatDate(backup.updatedAt, dictionary)}
              </p>
            </Skeleton>
            <Skeleton
              className={cn({
                "rounded-medium": backups.isLoading,
              })}
              isLoaded={!backups.isLoading}
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
                  isDisabled={backups.isLoading}
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                >
                  <MoreHorizontal className="size-4 shrink-0" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="actions">
                <DropdownSection showDivider>
                  <DropdownItem
                    key={"see-more"}
                    startContent={<Expand className="size-4" />}
                    onPress={() => {
                      router.push(`/dbackup/${backup.id}`)
                    }}
                  >
                    {dictionary.seeMore}
                  </DropdownItem>
                  <DropdownItem
                    key={"backup"}
                    startContent={<DatabaseBackup className="size-4" />}
                    onPress={() => {
                      handleInstantBackup(backup.id)
                    }}
                  >
                    {dictionary.dbackup.backupNow}
                  </DropdownItem>
                  <DropdownItem
                    key={"update"}
                    startContent={<Pencil className="size-4" />}
                    onPress={() => {
                      setUpdateBackupId(backup.id)
                      onUpdateOpen()
                    }}
                  >
                    {dictionary.update}
                  </DropdownItem>
                  <DropdownItem
                    key={"duplicate"}
                    startContent={<Copy className="size-4" />}
                    onPress={() => {
                      handleDuplicate(backup.id)
                    }}
                  >
                    {dictionary.duplicate}
                  </DropdownItem>
                </DropdownSection>
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
          </Link>
        ))}
      </div>
      {backups.data && (
        <Pagination
          total={backups.data.numberOfPages}
          page={offset / limit + 1}
          onChange={(page) => setOffset((page - 1) * limit)}
          className={cn({
            invisible: backups.data.numberOfPages <= 1,
          })}
        />
      )}
      <AddBackup isOpen={isAddBackupOpen} onClose={onAddBackupClose} onOpenChange={onAddBackupOpenChange} />
      <UpdateBackup
        isOpen={isUpdateOpen}
        onClose={onUpdateClose}
        onOpenChange={onUpdateClose}
        backupId={updateBackupId}
      />
      <RemoveBackup
        isOpen={isRemoveOpen}
        onClose={onRemoveClose}
        onOpenChange={onRemoveClose}
        backupId={removeBackupId}
      />
    </section>
  )
}
