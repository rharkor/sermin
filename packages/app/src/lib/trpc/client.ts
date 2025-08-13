import { env } from "env.mjs"
import SuperJSON from "superjson"

import { type AppRouter } from "@/api/_app"
import { createTRPCReact, createWSClient, httpBatchLink, loggerLink, splitLink, wsLink } from "@trpc/react-query"

import { getUrl } from "./utils"

export const trpc = createTRPCReact<AppRouter>({})

export const trpcClient = trpc.createClient({
  transformer: SuperJSON,
  links: [
    // adds pretty logs to your console in development and logs errors in production
    loggerLink({
      enabled: (opts) =>
        (process.env.NODE_ENV === "development" && typeof window !== "undefined") ||
        (opts.direction === "down" && opts.result instanceof Error),
    }),
    splitLink({
      condition(op) {
        return op.type === "subscription"
      },
      true: (() => {
        const wsClient = createWSClient({
          url: env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001",
        })
        return wsLink({
          client: wsClient,
        })
      })(),
      false: httpBatchLink({
        url: getUrl(),
      }),
    }),
    httpBatchLink({
      url: getUrl(),
    }),
  ],
})
