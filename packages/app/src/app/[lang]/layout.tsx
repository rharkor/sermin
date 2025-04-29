import React from "react"
import { Metadata } from "next"
import { redirect } from "next/navigation"
import { i18n, Locale } from "i18n-config"

import { fontSans } from "@/lib/fonts"
import { getDictionary } from "@/lib/langs"
import { cn } from "@/lib/utils"

import RootProviders from "./providers"

import "../globals.css"

export const metadata: Metadata = {
  title: "Dbackup",
  description: "Manage your backups with ease",
}

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }))
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{
    lang: string
  }>
}) {
  const { lang } = await params
  //? If locale is not found, return 404
  if (!i18n.locales.includes(lang)) return redirect(`/${i18n.defaultLocale}/${lang}`)

  const dictionary = await getDictionary(lang as Locale)

  return (
    <html lang={lang}>
      <body className={cn("antialiaseds bg-background min-h-screen font-sans", fontSans.variable)}>
        <RootProviders dictionary={dictionary}>{children}</RootProviders>
      </body>
    </html>
  )
}
