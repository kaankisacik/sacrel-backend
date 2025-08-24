// src/subscribers/dev-log-reset-token.ts
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

type ResetPayload = {
  entity_id: string        // e.g. email
  actor_type: "user" | "customer" | string
  token: string
}

export default async function devLogResetToken(
  { event: { data }, container }: SubscriberArgs<ResetPayload>
) {
  // Yalnızca local/dev'de çalışsın
  if (process.env.NODE_ENV !== "development" && process.env.DEBUG_RESET_TOKENS !== "1") {
    return
  }

  const logger = container.resolve("logger")

  // Admin ve Storefront için örnek reset linkleri
  const ADMIN_URL = process.env.MEDUSA_ADMIN_URL ?? "http://localhost:9000/app"
  const STOREFRONT_URL = process.env.STOREFRONT_URL ?? "http://localhost:3000"

  const resetUrl =
    data.actor_type === "user"
      ? `${ADMIN_URL}/reset-password?token=${encodeURIComponent(data.token)}&email=${encodeURIComponent(data.entity_id)}`
      : `${STOREFRONT_URL}/reset-password?token=${encodeURIComponent(data.token)}&email=${encodeURIComponent(data.entity_id)}`

  logger.warn(
    `[DEV] Password reset token generated for ${data.actor_type}:${data.entity_id}\n` +
    `Token: ${data.token}\nURL: ${resetUrl}`
  )
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}
