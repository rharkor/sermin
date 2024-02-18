import { router } from "../lib/server/trpc"

import { authRouter } from "./auth/_router"
import { backupsRouter } from "./backups/_router"
import { meRouter } from "./me/_router"
import { uploadRouter } from "./upload/_router"

export const appRouter = router({
  auth: authRouter,
  me: meRouter,
  upload: uploadRouter,
  backups: backupsRouter,
})

export type AppRouter = typeof appRouter
