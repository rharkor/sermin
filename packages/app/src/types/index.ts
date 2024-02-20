import { NextApiRequest, NextApiResponse } from "next"
import { Session } from "next-auth"
import { IncomingMessage } from "http"
import { WebSocket } from "ws"
import { z } from "zod"

export type ITrpcContext = {
  session: Session | null | undefined
  req: NextApiRequest | IncomingMessage | Request | null | undefined
  res: NextApiResponse | WebSocket | null | undefined
}

export type apiInputFromSchema<T extends (() => z.Schema) | undefined> = {
  input: T extends () => z.Schema ? z.infer<ReturnType<T>> : unknown
  ctx: ITrpcContext
}

export type ValueOf<T> = T[keyof T]

export const isPossiblyUndefined = <T>(value: T): T | undefined => value

export type Path<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T]-?: K extends string
        ? `${Prefix}${Prefix extends "" ? "" : "."}${K}` | Path<T[K], `${Prefix}${Prefix extends "" ? "" : "."}${K}`>
        : never
    }[keyof T]
  : never
