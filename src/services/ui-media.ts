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
  async listPublic(filter: Filter = {}, { limit = 20, offset = 0 } = {}) {
    const now = new Date()
    return await this.listAndCountUiMedia(
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
      }
    )
  }

  async list(options: any = {}, context: any = {}) {
    return await this.listAndCountUiMedia(options)
  }

  async createUiMedia(data: any) {
    return await this.createUiMedia(data)
  }

  async listAndCountUiMedia(options: any = {}) {
    // Use the underlying repository directly
    const repo = this.container.resolve("manager").getRepository("UiMedia")
    return await repo.findAndCount(options)
  }

  async createUiMediaItem(data: any) {
    const repo = this.container.resolve("manager").getRepository("UiMedia")
    const item = repo.create(data)
    return await repo.save(item)
  }
}
