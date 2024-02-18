"use client"

import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import FormField from "@/components/ui/form"
import { useDictionary } from "@/contexts/dictionary/utils"
import { createDatabaseBackupSchema } from "@/lib/schemas/backups"
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

const formSchema = createDatabaseBackupSchema
type IForm = z.infer<ReturnType<typeof formSchema>>

export default function AddBackup({
  isOpen,
  onOpenChange,
  onClose,
}: {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onClose: () => void
}) {
  const dictionary = useDictionary()
  const trpcUtils = trpc.useUtils()

  const createBackupMutation = trpc.backups.createDatabaseBackup.useMutation()

  //* Form
  const form = useForm<IForm>({
    resolver: zodResolver(formSchema()),
    values: {
      name: "",
      description: "",
      host: "",
      port: 5432,
      database: "",
      username: "",
      password: "",
      s3Endpoint: "",
      s3BucketName: "",
      s3Region: "",
      s3AccessKey: "",
      s3SecretKey: "",
      s3Path: "",
      cron: "0 2 * * *",
      // Additionals
      pgVersion: "15",
      pgCompressionLevel: 9,
      pgFormat: "custom",
      encryptionKey: "",
      retention: 30, // -1 for infinite, 30 days by default
    },
  })

  //* Create backup
  const onSubmit = async (data: IForm) => {
    await createBackupMutation.mutateAsync(data)

    await trpcUtils.backups.invalidate()
    onClose()
  }

  useEffect(() => {
    if (!isOpen) form.reset()
  }, [isOpen, form])

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent className="scrollbar-thin max-h-[80vh] overflow-auto">
        {(onClose) => (
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ModalHeader>{dictionary.dbackup.createBackup}</ModalHeader>
            <ModalBody className="flex flex-col gap-2">
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
              />
              <FormField
                form={form}
                name="port"
                type="number"
                label={dictionary.dbackup.port}
                isRequired
                placeholder={dictionary.dbackup.portPlaceholder}
              />
              <FormField
                form={form}
                name="database"
                type="text"
                label={dictionary.dbackup.database}
                isRequired
                placeholder={dictionary.dbackup.databasePlaceholder}
              />
              <FormField
                form={form}
                name="username"
                type="text"
                label={dictionary.dbackup.username}
                isRequired
                placeholder={dictionary.dbackup.usernamePlaceholder}
              />
              <FormField
                form={form}
                name="password"
                type="password"
                label={dictionary.dbackup.password}
                isRequired
                placeholder={dictionary.dbackup.passwordPlaceholder}
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
              />
              <FormField
                form={form}
                name="s3BucketName"
                type="text"
                label={dictionary.dbackup.s3BucketName}
                isRequired
                placeholder={dictionary.dbackup.s3BucketNamePlaceholder}
              />
              <FormField
                form={form}
                name="s3Region"
                type="text"
                label={dictionary.dbackup.s3Region}
                isRequired
                placeholder={dictionary.dbackup.s3RegionPlaceholder}
              />
              <FormField
                form={form}
                name="s3AccessKey"
                type="text"
                label={dictionary.dbackup.s3AccessKey}
                isRequired
                placeholder={dictionary.dbackup.s3AccessKeyPlaceholder}
              />
              <FormField
                form={form}
                name="s3SecretKey"
                type="password"
                label={dictionary.dbackup.s3SecretKey}
                isRequired
                placeholder={dictionary.dbackup.s3SecretKeyPlaceholder}
              />
              <FormField
                form={form}
                name="s3Path"
                type="text"
                label={dictionary.dbackup.s3Path}
                isRequired
                placeholder={dictionary.dbackup.s3PathPlaceholder}
              />
              <FormField
                form={form}
                name="cron"
                type="text"
                label={dictionary.dbackup.cron}
                isRequired
                placeholder={dictionary.dbackup.cronPlaceholder}
              />
              <Accordion>
                <AccordionItem
                  key="advancedOptions"
                  aria-label={dictionary.dbackup.advancedOptions}
                  title={dictionary.dbackup.advancedOptions}
                >
                  <div className="flex flex-col gap-2">
                    <FormField
                      form={form}
                      name="retention"
                      type="number"
                      label={dictionary.dbackup.retention}
                      isRequired
                      placeholder={dictionary.dbackup.retentionPlaceholder}
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
                          onChange={() => {}}
                          selectedKeys={[form.getValues("pgVersion")]}
                          onSelectionChange={(value) =>
                            form.setValue("pgVersion", value as z.infer<ReturnType<typeof formSchema>>["pgVersion"])
                          }
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
                          onChange={() => {}}
                          selectedKeys={[form.getValues("pgFormat")]}
                          onSelectionChange={(value) =>
                            form.setValue("pgFormat", value as z.infer<ReturnType<typeof formSchema>>["pgFormat"])
                          }
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
                      type="text"
                      label={dictionary.dbackup.encryptionKey}
                      placeholder={dictionary.dbackup.encryptionKeyPlaceholder}
                    />
                  </div>
                </AccordionItem>
              </Accordion>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                {dictionary.cancel}
              </Button>
              <Button color="primary" type="submit" isLoading={createBackupMutation.isLoading}>
                {dictionary.create}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  )
}
