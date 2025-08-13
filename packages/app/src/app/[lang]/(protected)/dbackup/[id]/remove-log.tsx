"use client"

import { useDictionary } from "@/contexts/dictionary/utils"
import { trpc } from "@/lib/trpc/client"
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/react"

export default function RemoveLog({
  isOpen,
  onOpenChange,
  logId,
}: {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onClose: () => void
  logId: string | null
}) {
  const dictionary = useDictionary()
  const trpcUtils = trpc.useUtils()

  const removeLogMutation = trpc.backups.deleteLog.useMutation()
  const handleRemoveLog = async () => {
    if (logId) {
      await removeLogMutation.mutateAsync({ id: logId })
      onOpenChange(false)
      trpcUtils.backups.getBackupLogs.invalidate()
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent className="scrollbar-thin max-h-[80vh] overflow-auto">
        {(onClose: () => void) => (
          <>
            <ModalHeader>{dictionary.dbackup.removeLog}</ModalHeader>
            <ModalBody className="flex flex-col gap-2">
              <p>{dictionary.dbackup.removeLogConfirmation}</p>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                {dictionary.cancel}
              </Button>
              <Button color="danger" type="submit" isLoading={removeLogMutation.isPending} onPress={handleRemoveLog}>
                {dictionary.delete}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
