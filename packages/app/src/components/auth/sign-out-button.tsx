"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"

import { logger } from "@lib/logger"
import { Button } from "@nextui-org/react"

export default function SignoutButton({ children }: { children: React.ReactNode }) {
  const [signOutLoading, setSignOutLoading] = useState(false)
  const handleSignOut = async () => {
    setSignOutLoading(true)
    try {
    } catch (e) {
      logger.error(e)
    }
    await signOut()
    setSignOutLoading(false)
  }

  return (
    <Button
      variant="ghost"
      onClick={handleSignOut}
      isLoading={signOutLoading}
      color="danger"
      startContent={<LogOut className="size-4" />}
    >
      {children}
    </Button>
  )
}
