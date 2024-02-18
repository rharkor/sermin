import { Locale } from "i18n-config"

import { fontTitle } from "@/lib/fonts"
import { getDictionary } from "@/lib/langs"
import { cn } from "@/lib/utils"

import Backups from "./backups"

export default async function DBackup({
  params: { lang },
}: {
  params: {
    lang: Locale
  }
}) {
  const dictionary = await getDictionary(lang)

  return (
    <main className="container flex flex-1 flex-col gap-4 p-2 py-4">
      <h1 className={cn("p-1 text-2xl", fontTitle.className)}>{dictionary.dbackup.dbackup}</h1>
      <Backups />
    </main>
  )
}
