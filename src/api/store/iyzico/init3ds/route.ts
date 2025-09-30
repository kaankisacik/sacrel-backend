import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { IyzicoDirect, IyzicoInit3DSBody } from "../../../../lib/iyzico-direct"

const InitSchema = z.object({
  locale: z.string().default("tr"),
  conversationId: z.string(),
  price: z.number().or(z.string()),
  paidPrice: z.number().or(z.string()),
  currency: z.string().default("TRY"),
  installment: z.number().int().positive().default(1),
  paymentChannel: z.string().default("WEB"),
  basketId: z.string(),
  paymentGroup: z.string().default("PRODUCT"),
  callbackUrl: z.string().url(),
  paymentCard: z.object({
    cardHolderName: z.string(),
    cardNumber: z.string().min(12),
    expireYear: z.string().min(2),
    expireMonth: z.string().min(1),
    cvc: z.string().min(3),
    registerCard: z.number().int().optional(),
  }),
  buyer: z.record(z.string(), z.any()),
  shippingAddress: z.record(z.string(), z.any()),
  billingAddress: z.record(z.string(), z.any()),
  basketItems: z.array(z.record(z.string(), z.any())).min(1),
})

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const parsed = InitSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ status: "error", error: "Invalid body", issues: parsed.error.flatten() })
    }

    const svc = new IyzicoDirect()
    const out = await svc.init3DS(parsed.data as unknown as IyzicoInit3DSBody)

    // örnek: doğrudan iyzico yanıtını geçiriyoruz
    return res.status(200).json(out)
  } catch (e: any) {
    return res.status(502).json({
      status: "error",
      error: e?.message || "iyzico init3DS failed",
    })
  }
}
