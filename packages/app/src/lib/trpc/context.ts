import { IncomingMessage } from "http"
import { WebSocket } from "ws"

import { ITrpcContext } from "@/types"
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch"
import type { CreateNextContextOptions } from "@trpc/server/adapters/next"
import { NodeHTTPCreateContextFnOptions } from "@trpc/server/adapters/node-http"

export function createContext(
  opts?:
    | NodeHTTPCreateContextFnOptions<IncomingMessage, WebSocket>
    | CreateNextContextOptions
    | FetchCreateContextFnOptions
) {
  const response: ITrpcContext = {
    session: null,
    req: opts?.req,
    res: opts && "res" in opts ? opts.res : null,
  }
  return response
}

export type Context = Awaited<ReturnType<typeof createContext>>
