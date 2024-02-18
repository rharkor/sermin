"use client"

import { redirect } from "next/navigation"
import { Session } from "next-auth"

export default function Providers({
  searchParams,
  session,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
  session: Session | null
}) {
  const callbackUrl = searchParams.callbackUrl ? searchParams.callbackUrl.toString() : undefined

  //? If session and callbackUrl, redirect to callbackUrl
  if (session && callbackUrl) {
    redirect(callbackUrl)
  }

  return <></>
}
