import {
  deleteAccountResponseSchema,
  forgotPasswordResponseSchema,
  forgotPasswordSchema,
  getAccountResponseSchema,
  resetPasswordResponseSchema,
  resetPasswordSchema,
  sendVerificationEmailResponseSchema,
  sendVerificationEmailSchema,
  updateUserResponseSchema,
  updateUserSchema,
  verifyEmailResponseSchema,
  verifyEmailSchema,
} from "@/lib/schemas/user"
import {
  authenticatedNoEmailVerificationProcedure,
  authenticatedProcedure,
  publicProcedure,
  router,
} from "@/lib/server/trpc"

import { sendVerificationEmail, verifyEmail } from "./email/mutations"
import { forgotPassword, resetPassword } from "./password/mutations"
import { deleteAccount, updateUser } from "./mutations"
import { getAccount } from "./queries"

export const meRouter = router({
  updateUser: authenticatedProcedure.input(updateUserSchema()).output(updateUserResponseSchema()).mutation(updateUser),
  getAccount: authenticatedNoEmailVerificationProcedure.output(getAccountResponseSchema()).query(getAccount),
  deleteAccount: authenticatedNoEmailVerificationProcedure
    .output(deleteAccountResponseSchema())
    .mutation(deleteAccount),
  forgotPassword: publicProcedure
    .input(forgotPasswordSchema())
    .output(forgotPasswordResponseSchema())
    .mutation(forgotPassword),
  resetPassword: publicProcedure
    .input(resetPasswordSchema())
    .output(resetPasswordResponseSchema())
    .mutation(resetPassword),
  sendVerificationEmail: authenticatedNoEmailVerificationProcedure
    .input(sendVerificationEmailSchema())
    .output(sendVerificationEmailResponseSchema())
    .mutation(sendVerificationEmail),
  verifyEmail: publicProcedure.input(verifyEmailSchema()).output(verifyEmailResponseSchema()).mutation(verifyEmail),
})
