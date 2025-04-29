import { Session } from "next-auth"
import { env } from "env.mjs"
import { IncomingMessage } from "http"
import superjson from "superjson"
import { z, ZodError } from "zod"

import { getAuthApi } from "@/components/auth/require-auth"
import { User } from "@prisma/client"
import { initTRPC } from "@trpc/server"

import { redis } from "../redis"
import { wsAuthenticatedSchema } from "../schemas/auth"
import { sessionsSchema } from "../schemas/user"
import { Context } from "../trpc/context"
import { ApiError } from "../utils/server-utils"

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter(opts) {
    const { shape, error } = opts
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.code === "BAD_REQUEST" && error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})
/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router
export const middleware = t.middleware
export const publicProcedure = t.procedure
const isAuthenticated = middleware(async (opts) => {
  const { session } = await getAuthApi()

  if (!session) {
    ApiError("unauthorized", "UNAUTHORIZED")
  }
  return opts.next({
    ctx: {
      ...opts.ctx,
      session,
    },
  })
})
const hasVerifiedEmail = middleware(async (opts) => {
  const { ctx } = opts
  const session = ctx.session as (Session & { user: Omit<User, "password"> }) | null
  if (!session || (!session.user.emailVerified && env.NEXT_PUBLIC_ENABLE_MAILING_SERVICE === true)) {
    ApiError("emailNotVerified", "UNAUTHORIZED", {
      redirect: false,
    })
  }
  return opts.next()
})
export const authenticatedProcedure = publicProcedure.use(isAuthenticated).use(hasVerifiedEmail)
export const authenticatedNoEmailVerificationProcedure = publicProcedure.use(isAuthenticated)

const wsIsAuthenticated = middleware(async (opts) => {
  const input = await wsAuthenticatedSchema()
    .parseAsync(opts.input)
    .catch(() => null)
  if (!input) return ApiError("unknownError", "BAD_REQUEST")
  if (!opts.ctx.req || !opts.ctx.res) return ApiError("unauthorized", "UNAUTHORIZED")
  if (!(opts.ctx.req instanceof IncomingMessage)) {
    return ApiError("unauthorized", "UNAUTHORIZED")
  }

  const key = `session:${input.userId}:${input.uuid}`
  const loginSession = await redis.get(key)
  if (!loginSession) {
    return ApiError("unauthorized", "UNAUTHORIZED")
  }
  const data = JSON.parse(loginSession) as z.infer<ReturnType<typeof sessionsSchema>>
  return opts.next({
    ctx: {
      ...opts.ctx,
      session: { user: data.user } as Session,
    },
  })
})
export const wsAuthenticatedProcedure = publicProcedure.use(wsIsAuthenticated)
