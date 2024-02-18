"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import SignoutButton from "@/components/auth/sign-out-button"
import { fontTitle } from "@/lib/fonts"
import { TDictionary } from "@/lib/langs"
import { cn } from "@/lib/utils"
import { Button } from "@nextui-org/react"

export default function Sidebar({ dictionary }: { dictionary: TDictionary }) {
  const pathname = usePathname()
  const pathnameWithoutLang = pathname.replace(/^\/[a-z]{2}/, "")

  return (
    <>
      <nav className="roudned-r-medium bg-content1 fixed flex h-screen w-[260px] flex-col p-3">
        <h2 className={cn("text-primary ml-4 text-4xl font-bold", fontTitle.className)}>{dictionary.appName}</h2>
        <ul className="mt-4 flex flex-1 flex-col">
          <li>
            <Link href="/">
              <Button
                className={cn("text-foreground w-full justify-start", {
                  "bg-primary text-primary-foreground": pathnameWithoutLang === "",
                })}
                variant="light"
                color="primary"
              >
                {dictionary.home}
              </Button>
            </Link>
          </li>
          <li>
            <Link href="/dbackup">
              <Button
                className={cn("text-foreground w-full justify-start", {
                  "bg-primary text-primary-foreground": pathnameWithoutLang === "/dbackup",
                })}
                variant="light"
                color="primary"
              >
                {dictionary.dbackup.dbackup}
              </Button>
            </Link>
          </li>
        </ul>
        <SignoutButton>{dictionary.signOut}</SignoutButton>
      </nav>
      <div className="w-[260px]"></div> {/* Sidebar placeholder */}
    </>
  )
}
