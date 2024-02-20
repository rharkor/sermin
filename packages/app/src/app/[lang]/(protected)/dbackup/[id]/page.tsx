import { Locale } from "i18n-config"
import { ChevronLeft } from "lucide-react"

import { getDictionary } from "@/lib/langs"
import { sectionClassName } from "@/types/constants"
import { Link } from "@nextui-org/react"

import DBackupContent from "./content"

export default async function DBackup({
  params: { id, lang },
}: {
  params: {
    lang: Locale
    id: string
  }
}) {
  const dictionary = await getDictionary(lang)

  return (
    <main className={sectionClassName}>
      <Link href={`/dbackup`}>
        <ChevronLeft className="size-6" />
        {dictionary.dbackup.dbackup}
      </Link>
      <DBackupContent backupId={id} />
    </main>
  )
}
