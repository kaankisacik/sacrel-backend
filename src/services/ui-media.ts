import { MedusaService } from "@medusajs/framework/utils"
import { UiMedia } from "../models/ui-media"

type Filter = {
  type?: "carousel" | "banner"
  is_active?: boolean
  locale?: string
}

export default class UiMediaService extends MedusaService({
  UiMedia,
}) {
  // kısayol: this.__container__.resolve("uiMediaRepository")
  async listPublic(filter: Filter = {}, { limit = 20, offset = 0 } = {}) {
    const now = new Date()
    return await this.__container__
      .resolve("uiMediaRepository")
      .list(
        {
          where: {
            ...(filter.type ? { type: filter.type } : {}),
            ...(filter.locale ? { locale: filter.locale } : {}),
            is_active: filter.is_active ?? true,
            OR: [
              { publish_at: null },
              { publish_at: { lte: now } },
            ],
            AND: [
              { unpublish_at: null },
              { unpublish_at: { gte: now } },
            ],
          },
          order: { sort_order: "ASC", created_at: "DESC" },
          skip: offset,
          take: limit,
        },
        { relations: [] }
      )
  }
}
