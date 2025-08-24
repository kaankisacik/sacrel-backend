import { model, Model } from "@medusajs/framework/utils" // DML
// tablo: ui_media (postgres enum'u zaten migration'da)

export const UiMedia = model
  .define("ui_media", {
    id: model.id().primaryKey().uuid(),
    type: model.enum(["carousel", "banner"]).notNullable(),
    title: model.text().nullable(),
    image_url: model.text().notNullable(),
    link_url: model.text().nullable(),
    sort_order: model.int().notNullable().default(0),
    is_active: model.boolean().notNullable().default(true),
    locale: model.text().default("tr"),
    publish_at: model.timestamp().nullable(),
    unpublish_at: model.timestamp().nullable(),
    created_at: model.timestamp().notNullable().defaultNow(),
    updated_at: model.timestamp().notNullable().defaultNow(),
  })
  .indexes([
    { name: "idx_ui_media_type", on: ["type"] },
    { name: "idx_ui_media_active", on: ["is_active"] },
    { name: "idx_ui_media_sort", on: ["type", "sort_order"] },
  ])

export type UiMediaType = Model<typeof UiMedia>
