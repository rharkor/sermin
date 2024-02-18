"use client"

import { useState } from "react"
import { DatabaseBackup, Expand, MoreHorizontal, Pencil } from "lucide-react"
import { z } from "zod"

import { Icons } from "@/components/icons"
import Searchbar from "@/components/ui/table/searchbar"
import { useDictionary } from "@/contexts/dictionary/utils"
import { getDatabaseBackupsResponseSchema } from "@/lib/schemas/backups"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
  Pagination,
  Skeleton,
  useDisclosure,
} from "@nextui-org/react"

import AddBackup from "./add-backup"

const skeletonRows: z.infer<ReturnType<typeof getDatabaseBackupsResponseSchema>>["backups"] = Array.from({
  length: 5,
}).map((_, i) => ({
  id: i.toString(),
  name: "",
  description: "",
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
  pgVersion: "15",
  pgCompressionLevel: 0,
  pgFormat: "custom",
  retention: 0,
  encryptionKey: "",
  createdAt: new Date(),
  updatedAt: new Date(),
}))

export default function Backups() {
  const dictionary = useDictionary()

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

  return (
    <section className="flex flex-1 flex-col gap-2 overflow-hidden p-1">
      <div className="flex w-full flex-row justify-between gap-2">
        <Searchbar placeholder={dictionary.dbackup.search} value={search} setValue={setSearch} />
        <Button onPress={onAddBackupOpen} color="primary" size="lg">
          {dictionary.dbackup.createBackup}
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {(backups.isLoading ? skeletonRows : backups.data?.backups ?? []).map((backup) => (
          <div key={backup.id} className="rounded-medium bg-content1 flex flex-row gap-2 p-2">
            <div className="flex w-[250px] flex-col">
              <p className="w-[150px] max-w-[150px] truncate">{backup.name}</p>
              <p className="text-muted-foreground w-[250px] max-w-[250px] truncate text-sm">{backup.description}</p>
            </div>
            <Skeleton isLoaded={!backups.isLoading} className="rounded-medium ml-auto w-max">
              <div className="flex flex-row items-center gap-2">
                <Dropdown>
                  <DropdownTrigger>
                    <Button variant="light" className="h-max min-w-0 shrink-0 p-3">
                      <MoreHorizontal className="size-4 shrink-0" />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="actions">
                    <DropdownSection showDivider>
                      <DropdownItem
                        key={"see-more"}
                        startContent={<Expand className="size-4" />}
                        onPress={() => {
                          //TODO
                        }}
                      >
                        {dictionary.seeMore}
                      </DropdownItem>
                      <DropdownItem
                        key={"backup"}
                        startContent={<DatabaseBackup className="size-4" />}
                        onPress={() => {
                          setUpdateBackupId(backup.id)
                          onUpdateOpen()
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
              </div>
            </Skeleton>
          </div>
        ))}
      </div>
      <Pagination
        total={backups.data?.numberOfPages ?? 1}
        page={offset / limit + 1}
        onChange={(page) => setOffset((page - 1) * limit)}
        className={cn({
          invisible: (backups.data?.numberOfPages ?? 1) <= 1,
        })}
      />
      <AddBackup isOpen={isAddBackupOpen} onClose={onAddBackupClose} onOpenChange={onAddBackupOpenChange} />
    </section>
  )
}
