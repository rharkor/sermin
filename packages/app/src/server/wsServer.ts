import { exit } from "process"
import { WebSocketServer } from "ws"

import { appRouter } from "@/api/_app"
import { createContext } from "@/lib/trpc/context"
import { logger } from "@lib/logger"
import { applyWSSHandler } from "@trpc/server/adapters/ws"

const wss = new WebSocketServer({
  port: 3001,
})
const handler = applyWSSHandler({ wss, router: appRouter, createContext })

wss.on("connection", (ws) => {
  logger.debug(`+ Connection (${wss.clients.size})`)
  ws.once("close", () => {
    logger.debug(`- Connection (${wss.clients.size})`)
  })
})
logger.info("WebSocket Server listening on ws://localhost:3001")

process.on("SIGTERM", () => {
  handler.broadcastReconnectNotification()
  wss.close()
  exit(0)
})
