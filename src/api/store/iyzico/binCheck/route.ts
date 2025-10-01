import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { IyzicoBINCheckBody, IyzicoDirect } from "../../../../lib/iyzico-direct"

const InitSchema = z.object({
  binNumber: z.string().min(6).max(6),
  price: z.string().min(0),
})

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const parsed = InitSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ status: "error", error: "Invalid body", issues: parsed.error.flatten() })
    }

    const svc = new IyzicoDirect()
    const out = await svc.binCheck(parsed.data as unknown as IyzicoBINCheckBody)

    // örnek: doğrudan iyzico yanıtını geçiriyoruz
    return res.status(200).json(out)
  } catch (e: any) {
    return res.status(502).json({
      status: "error",
      error: e?.message || "iyzico BINCheck failed",
    })
  }
}

