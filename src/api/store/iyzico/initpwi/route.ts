import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { IyzicoDirect, IyzicoInitPWIBody } from "../../../../lib/iyzico-direct"

const BuyerSchema = z.object({
  id: z.string(),
  name: z.string(),
  surname: z.string(),
  gsmNumber: z.string(),
  email: z.string(),
  identityNumber: z.string(),
  lastLoginDate: z.string().optional(),
  registrationDate: z.string().optional(),
  registrationAddress: z.string(),
  ip: z.string(),
  city: z.string(),
  country: z.string(),
  zipCode: z.string().optional(),
})

const AddressSchema = z.object({
  contactName: z.string(),
  city: z.string(),
  country: z.string(),
  address: z.string(),
  zipCode: z.string().optional(),
})

const BasketItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category1: z.string(),
  category2: z.string().optional(),
  itemType: z.string(),
  price: z.union([z.number(), z.string()]),
})

const InitPWISchema = z.object({
  locale: z.string().default("tr"),
  conversationId: z.string(),
  price: z.union([z.number(), z.string()]),
  basketId: z.string(),
  paymentGroup: z.string().default("PRODUCT"),
  callbackUrl: z.string(),
  currency: z.string().default("TRY"),
  paidPrice: z.number(),
  buyer: BuyerSchema,
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema,
  basketItems: z.array(BasketItemSchema),
})

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const parsed = InitPWISchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ 
        status: "error", 
        error: "Invalid body", 
        issues: parsed.error.flatten() 
      })
    }

    const svc = new IyzicoDirect()
    const out = await svc.initPWI(parsed.data as unknown as IyzicoInitPWIBody)

    return res.status(200).json(out)
  } catch (e: any) {
    return res.status(502).json({
      status: "error",
      error: e?.message || "iyzico initPWI failed",
    })
  }
}