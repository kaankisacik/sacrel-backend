import { model } from "@medusajs/framework/utils"

export const ContactMessage = model.define("contact_message", {
  id: model.id().primaryKey(),
  name: model.text().nullable(),
  email: model.text(),
  phone: model.text().nullable(),
  subject: model.text().nullable(),
  message: model.text(),
  order_id: model.text().nullable(),
  status: model.enum(["new", "read", "archived"]).default("new")
})
