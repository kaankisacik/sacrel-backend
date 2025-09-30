import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { IyzicoDirect, IyzicoAuth3DSBody } from "../../../../lib/iyzico-direct"

const AuthSchema = z.object({
  locale: z.string().default("tr"),
  paymentId: z.string(),
  conversationId: z.string(),
  conversationData: z.string().optional(),
})

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const parsed = AuthSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ status: "error", error: "Invalid body", issues: parsed.error.flatten() })
    }

    const svc = new IyzicoDirect()
    const out = await svc.auth3DS(parsed.data as unknown as IyzicoAuth3DSBody)

    return res.status(200).json(out)
  } catch (e: any) {
    return res.status(502).json({
      status: "error",
      error: e?.message || "iyzico auth3DS failed",
    })
  }
}
