"use client"

import { useRouter } from "next/navigation"

import { useDictionary } from "@/contexts/dictionary/utils"
import { trpc } from "@/lib/trpc/client"
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/react"

export default function RemoveBackup({
  isOpen,
  onOpenChange,
  backupId,
  redirect,
}: {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onClose: () => void
  backupId: string | null
  redirect?: boolean
}) {
  const dictionary = useDictionary()
  const router = useRouter()
  const trpcUtils = trpc.useUtils()

  const removeBackupMutation = trpc.backups.deleteDatabaseBackup.useMutation()
  const handleRemoveBackup = async () => {
    if (backupId) {
      await removeBackupMutation.mutateAsync({ id: backupId })
      onOpenChange(false)
      if (redirect) {
        router.push("/dbackup")
        trpcUtils.backups.getDatabaseBackups.invalidate()
      } else {
        trpcUtils.backups.invalidate()
      }
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent className="scrollbar-thin max-h-[80vh] overflow-auto">
        {(onClose: () => void) => (
          <>
            <ModalHeader>{dictionary.dbackup.removeBackup}</ModalHeader>
            <ModalBody className="flex flex-col gap-2">
              <p>{dictionary.dbackup.removeBackupConfirmation}</p>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                {dictionary.cancel}
              </Button>
              <Button
                color="danger"
                type="submit"
                isLoading={removeBackupMutation.isPending}
                onPress={handleRemoveBackup}
              >
                {dictionary.delete}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
