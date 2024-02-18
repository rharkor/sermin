import { Locale } from "i18n-config"

import { getDictionary } from "@/lib/langs"

export default async function DBackup({
  params: { lang },
}: {
  params: {
    lang: Locale
  }
}) {
  const dictionary = await getDictionary(lang)

  return (
    <main className="flex flex-col">
      <h1>{dictionary.dbackup.dbackup}</h1>
    </main>
  )
}
