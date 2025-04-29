import { Locale } from "i18n-config"

import { fontTitle } from "@/lib/fonts"
import { getDictionary } from "@/lib/langs"
import { cn } from "@/lib/utils"
import { sectionClassName } from "@/types/constants"

import Backups from "./backups"

export default async function DBackup({
  params,
}: {
  params: Promise<{
    lang: Locale
  }>
}) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <main className={sectionClassName}>
      <h1 className={cn("m-1 text-4xl", fontTitle.className)}>{dictionary.dbackup.dbackup}</h1>
      <Backups />
    </main>
  )
}
