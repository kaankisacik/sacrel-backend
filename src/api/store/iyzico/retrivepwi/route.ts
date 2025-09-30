import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { IyzicoDirect, IyzicoRetrivePWIBody } from "../../../../lib/iyzico-direct"

const RetrivePWISchema = z.object({
  locale: z.string().default("tr"),
  conversationId: z.string(),
  token: z.string(),
})

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const parsed = RetrivePWISchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ 
        status: "error", 
        error: "Invalid body", 
        issues: parsed.error.flatten() 
      })
    }

    const svc = new IyzicoDirect()
    const out = await svc.retrivePWI(parsed.data as unknown as IyzicoRetrivePWIBody)

    return res.status(200).json(out)
  } catch (e: any) {
    return res.status(502).json({
      status: "error",
      error: e?.message || "iyzico retrivePWI failed",
    })
  }
}