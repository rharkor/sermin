export const rolesAsObject = {
  admin: "ADMIN",
  user: "USER",
} as const

export const resetPasswordExpiration = 1000 * 60 * 60 * 24 // 24 hours
export const resendResetPasswordExpiration = 1000 * 60 * 5 // 5 minutes
export const emailVerificationExpiration = 1000 * 60 * 60 * 24 * 3 // 3 days
export const resendEmailVerificationExpiration = 1000 * 60 * 2 // 5 minutes
export const defaultMaxPerPage = 100
export const maxUploadSize = 1024 * 1024 * 10 // 10 MB

export const postgresVersion = ["13", "14", "15"] as const
export const postgresFormat = ["custom", "directory", "tar", "plain"] as const

export const sectionClassName = "container m-auto flex flex-1 flex-col gap-4 p-2 py-4"
