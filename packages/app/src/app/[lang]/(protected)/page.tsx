import { Locale } from "i18n-config"

import { getDictionary } from "@/lib/langs"

export default async function Home({
  params: { lang },
}: {
  params: {
    lang: Locale
  }
}) {
  const dictionary = await getDictionary(lang)

  return (
    <main className="flex flex-col">
      <h1>{dictionary.home}</h1>
    </main>
  )
}
