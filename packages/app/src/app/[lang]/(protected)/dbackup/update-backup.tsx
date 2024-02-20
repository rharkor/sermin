"use client"

import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import FormField from "@/components/ui/form"
import { useDictionary } from "@/contexts/dictionary/utils"
import { updateDatabaseBackupSchema } from "@/lib/schemas/backups"
import { trpc } from "@/lib/trpc/client"
import { postgresFormat, postgresVersion } from "@/types/constants"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Accordion,
  AccordionItem,
  Button,
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from "@nextui-org/react"

const formSchema = updateDatabaseBackupSchema
type IForm = z.infer<ReturnType<typeof formSchema>>

export default function UpdateBackup({
  isOpen,
  onOpenChange,
  onClose,
  backupId,
}: {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onClose: () => void
  backupId: string | null
}) {
  const dictionary = useDictionary()
  const trpcUtils = trpc.useUtils()

  const updateBackupMutation = trpc.backups.updateDatabaseBackup.useMutation()
  const backup = trpc.backups.getDatabaseBackup.useQuery(
    {
      id: backupId ?? "",
    },
    {
      enabled: !!backupId && isOpen,
    }
  )

  //* Form
  const form = useForm<IForm>({
    resolver: zodResolver(formSchema()),
    values: {
      id: backupId ?? "",
      name: backup.data?.backup.name ?? "",
      description: backup.data?.backup.description ?? "",
      host: backup.data?.backup.host ?? "",
      port: backup.data?.backup.port ?? 5432,
      database: backup.data?.backup.database ?? "",
      username: backup.data?.backup.username ?? "",
      password: "",
      s3Endpoint: backup.data?.backup.s3Endpoint ?? "",
      s3BucketName: backup.data?.backup.s3BucketName ?? "",
      s3Region: backup.data?.backup.s3Region ?? "",
      s3AccessKey: backup.data?.backup.s3AccessKey ?? "",
      s3SecretKey: "",
      s3Path: backup.data?.backup.s3Path ?? "",
      cron: backup.data?.backup.cron ?? "0 2 * * *",
      // Additionals
      pgVersion: (backup.data?.backup.pgVersion as z.infer<ReturnType<typeof formSchema>>["pgVersion"]) ?? "16",
      pgCompressionLevel: backup.data?.backup.pgCompressionLevel ?? 9,
      pgFormat: (backup.data?.backup.pgFormat as z.infer<ReturnType<typeof formSchema>>["pgFormat"]) ?? "custom",
      encryptionKey: "",
      retention: backup.data?.backup.retention ?? -1,
    },
  })

  //* Update backup
  const onSubmit = async (data: IForm) => {
    await updateBackupMutation.mutateAsync(data)

    await trpcUtils.backups.invalidate()
    onClose()
  }

  useEffect(() => {
    if (!isOpen) form.reset()
  }, [isOpen, form])

  const pgVersion = form.watch("pgVersion")
  const pgFormat = form.watch("pgFormat")

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent className="scrollbar-thin max-h-[80vh] overflow-auto">
        {(onClose) => (
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ModalHeader>{dictionary.update}</ModalHeader>
            <ModalBody className="flex flex-col gap-2 px-5 py-1">
              <div className="flex flex-col gap-2 p-1 pb-0">
                <FormField form={form} name="name" type="text" label={dictionary.dbackup.name} isRequired />
                <FormField form={form} name="description" type="text" label={dictionary.dbackup.description} />
                <Divider />
                <p className="text-lg font-semibold">{dictionary.dbackup.databaseLiteral}</p>
                <FormField
                  form={form}
                  name="host"
                  type="text"
                  label={dictionary.dbackup.host}
                  isRequired
                  placeholder={dictionary.dbackup.hostPlaceholder}
                  isDisabled={backup.isLoading}
                />
                <FormField
                  form={form}
                  name="port"
                  type="number"
                  label={dictionary.dbackup.port}
                  isRequired
                  placeholder={dictionary.dbackup.portPlaceholder}
                  isDisabled={backup.isLoading}
                />
                <FormField
                  form={form}
                  name="database"
                  type="text"
                  label={dictionary.dbackup.database}
                  isRequired
                  placeholder={dictionary.dbackup.databasePlaceholder}
                  isDisabled={backup.isLoading}
                />
                <FormField
                  form={form}
                  name="username"
                  type="text"
                  label={dictionary.dbackup.username}
                  isRequired
                  placeholder={dictionary.dbackup.usernamePlaceholder}
                  isDisabled={backup.isLoading}
                />
                <FormField
                  form={form}
                  name="password"
                  type="password"
                  label={dictionary.dbackup.password}
                  isRequired
                  placeholder={dictionary.dbackup.passwordPlaceholder}
                  isDisabled={backup.isLoading}
                  replacementContent="*******"
                />
                <Divider />
                <p className="text-lg font-semibold">{dictionary.dbackup.s3}</p>
                <FormField
                  form={form}
                  name="s3Endpoint"
                  type="text"
                  label={dictionary.dbackup.s3Endpoint}
                  isRequired
                  placeholder={dictionary.dbackup.s3EndpointPlaceholder}
                  isDisabled={backup.isLoading}
                />
                <FormField
                  form={form}
                  name="s3BucketName"
                  type="text"
                  label={dictionary.dbackup.s3BucketName}
                  isRequired
                  placeholder={dictionary.dbackup.s3BucketNamePlaceholder}
                  isDisabled={backup.isLoading}
                />
                <FormField
                  form={form}
                  name="s3Region"
                  type="text"
                  label={dictionary.dbackup.s3Region}
                  isRequired
                  placeholder={dictionary.dbackup.s3RegionPlaceholder}
                  isDisabled={backup.isLoading}
                />
                <FormField
                  form={form}
                  name="s3AccessKey"
                  type="text"
                  label={dictionary.dbackup.s3AccessKey}
                  isRequired
                  placeholder={dictionary.dbackup.s3AccessKeyPlaceholder}
                  isDisabled={backup.isLoading}
                />
                <FormField
                  form={form}
                  name="s3SecretKey"
                  type="password"
                  label={dictionary.dbackup.s3SecretKey}
                  isRequired
                  placeholder={dictionary.dbackup.s3SecretKeyPlaceholder}
                  isDisabled={backup.isLoading}
                  replacementContent="*******"
                />
                <FormField
                  form={form}
                  name="s3Path"
                  type="text"
                  label={dictionary.dbackup.s3Path}
                  isRequired
                  placeholder={dictionary.dbackup.s3PathPlaceholder}
                  isDisabled={backup.isLoading}
                />
                <FormField
                  form={form}
                  name="cron"
                  type="text"
                  label={dictionary.dbackup.cron}
                  placeholder={dictionary.dbackup.cronPlaceholder}
                  isDisabled={backup.isLoading}
                />
              </div>
              <Accordion className="!p-0">
                <AccordionItem
                  key="advancedOptions"
                  aria-label={dictionary.dbackup.advancedOptions}
                  title={dictionary.dbackup.advancedOptions}
                  classNames={{
                    title: "pl-1",
                  }}
                >
                  <div className="flex flex-col gap-2 p-1 pt-0">
                    <FormField
                      form={form}
                      name="retention"
                      type="number"
                      label={dictionary.dbackup.retention}
                      isRequired
                      placeholder={dictionary.dbackup.retentionPlaceholder}
                      description={dictionary.dbackup.retentionDescription}
                      isDisabled={backup.isLoading}
                    />
                    <Controller
                      name="pgVersion"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          label={dictionary.dbackup.selectVersion}
                          {...field}
                          isRequired
                          value={undefined}
                          selectedKeys={pgVersion ? [pgVersion] : undefined}
                          onChange={(e) =>
                            form.setValue(
                              "pgVersion",
                              e.target.value as z.infer<ReturnType<typeof formSchema>>["pgVersion"]
                            )
                          }
                          isDisabled={backup.isLoading}
                        >
                          {postgresVersion.map((version) => (
                            <SelectItem
                              key={version}
                              value={version}
                              textValue={dictionary.dbackup.version + " " + version}
                            >
                              {dictionary.dbackup.version} {version}
                            </SelectItem>
                          ))}
                        </Select>
                      )}
                    />
                    <FormField
                      form={form}
                      name="pgCompressionLevel"
                      type="number"
                      label={dictionary.dbackup.pgCompressionLevel}
                      isRequired
                      placeholder={dictionary.dbackup.pgCompressionLevelPlaceholder}
                      min={0}
                      max={9}
                      isDisabled={backup.isLoading}
                    />
                    <Controller
                      name="pgFormat"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          label={dictionary.dbackup.selectFormat}
                          {...field}
                          isRequired
                          value={undefined}
                          selectedKeys={pgFormat ? [pgFormat] : undefined}
                          onChange={(e) =>
                            form.setValue(
                              "pgFormat",
                              e.target.value as z.infer<ReturnType<typeof formSchema>>["pgFormat"]
                            )
                          }
                          isDisabled={backup.isLoading}
                        >
                          {postgresFormat.map((format) => (
                            <SelectItem key={format} value={format} textValue={dictionary.dbackup.format[format]}>
                              {dictionary.dbackup.format[format]}
                            </SelectItem>
                          ))}
                        </Select>
                      )}
                    />
                    <FormField
                      form={form}
                      name="encryptionKey"
                      type="password"
                      label={dictionary.dbackup.encryptionKey}
                      placeholder={dictionary.dbackup.encryptionKeyPlaceholder}
                      isDisabled={backup.isLoading}
                      replacementContent={backup.data?.backup.hasEncryptionKey ? "*******" : undefined}
                    />
                  </div>
                </AccordionItem>
              </Accordion>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                {dictionary.cancel}
              </Button>
              <Button
                color="primary"
                type="submit"
                isLoading={updateBackupMutation.isLoading}
                isDisabled={backup.isLoading || updateBackupMutation.isLoading}
              >
                {dictionary.update}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  )
}
