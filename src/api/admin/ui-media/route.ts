import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import UiMediaService from "../../../services/ui-media"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const svc = req.scope.resolve<UiMediaService>("uiMediaService")
  const { type, locale, limit = 50, offset = 0 } = req.query as any
  const data = await svc.list(
    {
      where: {
        ...(type ? { type } : {}),
        ...(locale ? { locale } : {}),
      },
      order: { sort_order: "ASC", created_at: "DESC" },
      skip: Number(offset),
      take: Number(limit),
    },
    {}
  )
  res.json({ count: data.length, items: data })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const svc = req.scope.resolve<UiMediaService>("uiMediaService")
  const payload = req.body // type, title, image_url, link_url, sort_order, is_active, locale, publish_at, unpublish_at
  const created = await svc.createUiMedia(payload)
  res.status(201).json({ item: created })
}
