import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import UiMediaService from "../../../services/ui-media"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const svc = req.scope.resolve<UiMediaService>("uiMediaService")
  const { type = "carousel", locale = "tr", limit = 20, offset = 0 } = req.query as any
  const items = await svc.listPublic({ type, locale, is_active: true }, { limit: Number(limit), offset: Number(offset) })
  res.json({ items })
}
