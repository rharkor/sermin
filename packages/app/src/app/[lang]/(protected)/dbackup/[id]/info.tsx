"use client"

import { DatabaseBackup, Pencil } from "lucide-react"

import { Icons } from "@/components/icons"
import { useDictionary } from "@/contexts/dictionary/utils"
import { trpc } from "@/lib/trpc/client"
import { cn, formatDate } from "@/lib/utils"
import { Button, Skeleton, useDisclosure } from "@nextui-org/react"
import { DatabaseBackupStatus } from "@prisma/client"

import RemoveBackup from "../remove-backup"
import UpdateBackup from "../update-backup"

import { TBackupDetailledStatus } from "./content"

export default function DBackupInfo({
  backupId,
  status,
}: {
  backupId: string
  status: TBackupDetailledStatus["status"] | DatabaseBackupStatus
}) {
  const dictionary = useDictionary()
  const utils = trpc.useUtils()

  const backup = trpc.backups.getDatabaseBackup.useQuery({
    id: backupId,
  })

  const { isOpen: isRemoveOpen, onOpen: onRemoveOpen, onClose: onRemoveClose } = useDisclosure()

  const { isOpen: isUpdateOpen, onOpen: onUpdateOpen, onClose: onUpdateClose } = useDisclosure()

  const instantBackup = trpc.backups.backupNow.useMutation()
  const handleInstantBackup = async () => {
    await instantBackup.mutateAsync({ id: backupId })
    utils.backups.invalidate()
  }

  return (
    <section className="bg-default-50/50 border-primary rounded-medium flex w-full flex-col gap-6 border p-3 py-5">
      <div className="flex flex-row gap-6">
        <div className="flex grow flex-col gap-2">
          <h2 className="text-lg font-semibold">{dictionary.dbackup.general}</h2>
          <div className="grid grid-cols-4 gap-2">
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm">{dictionary.dbackup.description}</p>
              <Skeleton
                isLoaded={!backup.isLoading}
                className={cn("h-[24px] w-[200px] max-w-[200px] truncate", {
                  "rounded-medium": backup.isLoading,
                })}
              >
                <p>{backup.data?.backup.description}</p>
              </Skeleton>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm">{dictionary.dbackup.cron}</p>
              <Skeleton
                isLoaded={!backup.isLoading}
                className={cn("h-[24px] w-[200px] max-w-[200px] truncate", {
                  "rounded-medium": backup.isLoading,
                })}
              >
                <p>{backup.data?.backup.cron}</p>
              </Skeleton>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm">{dictionary.dbackup.version}</p>
              <Skeleton
                isLoaded={!backup.isLoading}
                className={cn("h-[24px] w-[200px] max-w-[200px] truncate", {
                  "rounded-medium": backup.isLoading,
                })}
              >
                <p>{backup.data?.backup.pgVersion}</p>
              </Skeleton>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm">{dictionary.dbackup.pgCompressionLevel}</p>
              <Skeleton
                isLoaded={!backup.isLoading}
                className={cn("h-[24px] w-[200px] max-w-[200px] truncate", {
                  "rounded-medium": backup.isLoading,
                })}
              >
                <p>{backup.data?.backup.pgCompressionLevel}</p>
              </Skeleton>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm">{dictionary.dbackup.formatLiteral}</p>
              <Skeleton
                isLoaded={!backup.isLoading}
                className={cn("h-[24px] w-[200px] max-w-[200px] truncate", {
                  "rounded-medium": backup.isLoading,
                })}
              >
                <p>{backup.data?.backup.pgFormat}</p>
              </Skeleton>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm">{dictionary.dbackup.retention}</p>
              <Skeleton
                isLoaded={!backup.isLoading}
                className={cn("h-[24px] w-[200px] max-w-[200px] truncate", {
                  "rounded-medium": backup.isLoading,
                })}
              >
                <p>{backup.data?.backup.retention}</p>
              </Skeleton>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm">{dictionary.dbackup.encryptionKey}</p>
              <Skeleton
                isLoaded={!backup.isLoading}
                className={cn("h-[24px] w-[200px] max-w-[200px] truncate", {
                  "rounded-medium": backup.isLoading,
                })}
              >
                <p>{backup.data?.backup.hasEncryptionKey ? dictionary.yes : dictionary.no}</p>
              </Skeleton>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm">{dictionary.createdAt}</p>
              <Skeleton
                isLoaded={!backup.isLoading}
                className={cn("h-[24px] w-[200px] max-w-[200px] truncate", {
                  "rounded-medium": backup.isLoading,
                })}
              >
                <p>{backup.data && formatDate(backup.data.backup.createdAt, dictionary)}</p>
              </Skeleton>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm">{dictionary.updatedAt}</p>
              <Skeleton
                isLoaded={!backup.isLoading}
                className={cn("h-[24px] w-[200px] max-w-[200px] truncate", {
                  "rounded-medium": backup.isLoading,
                })}
              >
                <p>{backup.data && formatDate(backup.data.backup.updatedAt, dictionary)}</p>
              </Skeleton>
            </div>
          </div>
        </div>
        <div className="flex min-w-[250px] flex-col gap-2">
          <h2 className="text-lg font-semibold">{dictionary.actions}</h2>
          <div className="flex flex-col gap-2">
            <Button
              color="primary"
              onPress={handleInstantBackup}
              isLoading={instantBackup.isLoading}
              isDisabled={
                instantBackup.isLoading ||
                (status !== "SUCCESS" && status !== "success" && status !== "FAILED" && status !== "failed")
              }
              startContent={!instantBackup.isLoading && <DatabaseBackup className="size-4" />}
            >
              {dictionary.dbackup.backupNow}
            </Button>
            <Button color="warning" onPress={onUpdateOpen} startContent={<Pencil className="size-4" />}>
              {dictionary.update}
            </Button>
            <Button color="danger" onPress={onRemoveOpen} startContent={<Icons.trash className="size-4" />}>
              {dictionary.dbackup.removeBackup}
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-row items-stretch gap-6">
        <div className="flex grow flex-col gap-2">
          <h2 className="text-lg font-semibold">{dictionary.dbackup.databaseLiteral}</h2>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm">{dictionary.dbackup.host}</p>
              <Skeleton
                isLoaded={!backup.isLoading}
                className={cn("h-[24px] w-[200px] max-w-[200px] truncate", {
                  "rounded-medium": backup.isLoading,
                })}
              >
                <p>{backup.data?.backup.host}</p>
              </Skeleton>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm">{dictionary.dbackup.port}</p>
              <Skeleton
                isLoaded={!backup.isLoading}
                className={cn("h-[24px] w-[200px] max-w-[200px] truncate", {
                  "rounded-medium": backup.isLoading,
                })}
              >
                <p>{backup.data?.backup.port}</p>
              </Skeleton>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm">{dictionary.dbackup.database}</p>
              <Skeleton
                isLoaded={!backup.isLoading}
                className={cn("h-[24px] w-[200px] max-w-[200px] truncate", {
                  "rounded-medium": backup.isLoading,
                })}
              >
                <p>{backup.data?.backup.database}</p>
              </Skeleton>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm">{dictionary.dbackup.username}</p>
              <Skeleton
                isLoaded={!backup.isLoading}
                className={cn("h-[24px] w-[200px] max-w-[200px] truncate", {
                  "rounded-medium": backup.isLoading,
                })}
              >
                <p>{backup.data?.backup.username}</p>
              </Skeleton>
            </div>
          </div>
        </div>
        <div className="flex grow flex-col gap-2">
          <h2 className="text-lg font-semibold">{dictionary.dbackup.s3}</h2>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm">{dictionary.dbackup.s3BucketName}</p>
              <Skeleton
                isLoaded={!backup.isLoading}
                className={cn("h-[24px] w-[200px] max-w-[200px] truncate", {
                  "rounded-medium": backup.isLoading,
                })}
              >
                <p>{backup.data?.backup.s3BucketName}</p>
              </Skeleton>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm">{dictionary.dbackup.s3Region}</p>
              <Skeleton
                isLoaded={!backup.isLoading}
                className={cn("h-[24px] w-[200px] max-w-[200px] truncate", {
                  "rounded-medium": backup.isLoading,
                })}
              >
                <p>{backup.data?.backup.s3Region}</p>
              </Skeleton>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm">{dictionary.dbackup.s3AccessKey}</p>
              <Skeleton
                isLoaded={!backup.isLoading}
                className={cn("h-[24px] w-[200px] max-w-[200px] truncate", {
                  "rounded-medium": backup.isLoading,
                })}
              >
                <p>{backup.data?.backup.s3AccessKey}</p>
              </Skeleton>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm">{dictionary.dbackup.s3Endpoint}</p>
              <Skeleton
                isLoaded={!backup.isLoading}
                className={cn("h-[24px] w-[200px] max-w-[200px] truncate", {
                  "rounded-medium": backup.isLoading,
                })}
              >
                <p>{backup.data?.backup.s3Endpoint}</p>
              </Skeleton>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm">{dictionary.dbackup.s3Path}</p>
              <Skeleton
                isLoaded={!backup.isLoading}
                className={cn("h-[24px] w-[200px] max-w-[200px] truncate", {
                  "rounded-medium": backup.isLoading,
                })}
              >
                <p>{backup.data?.backup.s3Path}</p>
              </Skeleton>
            </div>
          </div>
        </div>
      </div>
      <UpdateBackup isOpen={isUpdateOpen} onClose={onUpdateClose} onOpenChange={onUpdateClose} backupId={backupId} />
      <RemoveBackup
        isOpen={isRemoveOpen}
        onClose={onRemoveClose}
        onOpenChange={onRemoveClose}
        backupId={backupId}
        redirect
      />
    </section>
  )
}
