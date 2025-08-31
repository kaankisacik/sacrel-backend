import { model } from "@medusajs/framework/utils"

export const UiMedia = model
  .define("ui_media", {
    id: model.id().primaryKey(),
    type: model.enum(["carousel", "banner"]),
    title: model.text().nullable(),
    image_url: model.text(),
    link_url: model.text().nullable(),
    sort_order: model.number().default(0),
    is_active: model.boolean().default(true),
    locale: model.text().default("tr"),
    publish_at: model.dateTime().nullable(),
    unpublish_at: model.dateTime().nullable(),
  })
  .indexes([
    { name: "idx_ui_media_type", on: ["type"] },
    { name: "idx_ui_media_active", on: ["is_active"] },
    { name: "idx_ui_media_sort", on: ["type", "sort_order"] },
  ])

export type UiMediaType = typeof UiMedia
