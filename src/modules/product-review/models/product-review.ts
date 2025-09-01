import { model } from "@medusajs/framework/utils"

export const ProductReview = model.define("product_review", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  product_id: model.text(),
  rating: model.number(),
  title: model.text().nullable(),
  comment: model.text().nullable(),
  is_verified_purchase: model.boolean().default(true),
  status: model.enum(["pending", "approved", "rejected"]).default("pending"),
  helpful_count: model.number().default(0),
})