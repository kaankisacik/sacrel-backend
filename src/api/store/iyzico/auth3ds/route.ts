import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { IyzicoDirect, IyzicoAuth3DSBody } from "../../../../lib/iyzico-direct"
import { Modules } from "@medusajs/framework/utils"
import { 
  completeCartWorkflow,
  capturePaymentWorkflow
} from "@medusajs/medusa/core-flows"

const AuthSchema = z.object({
  locale: z.string().default("tr"),
  paymentId: z.string(),
  conversationId: z.string(),
  conversationData: z.string().optional(),
  cartId: z.string().optional(), // Cart ID'yi almak için
})

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const parsed = AuthSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ status: "error", error: "Invalid body", issues: parsed.error.flatten() })
    }

    console.log("🔍 İyzico Auth3DS Request:", {
      paymentId: parsed.data.paymentId,
      conversationId: parsed.data.conversationId,
      cartId: parsed.data.cartId
    })

    const svc = new IyzicoDirect()
    const out = await svc.auth3DS(parsed.data as unknown as IyzicoAuth3DSBody)

    console.log("📥 İyzico Auth3DS Full Response:", JSON.stringify(out, null, 2))

    // İyzico response'unu daha detaylı analiz et
    const iyzicoStatus = out?.status
    const iyzicoPaymentStatus = out?.paymentStatus || out?.payment_status
    const iyzicoErrorCode = out?.errorCode || out?.error_code
    const iyzicoErrorMessage = out?.errorMessage || out?.error_message

    console.log("📊 İyzico Response Analysis:", {
      status: iyzicoStatus,
      paymentStatus: iyzicoPaymentStatus,
      errorCode: iyzicoErrorCode,
      errorMessage: iyzicoErrorMessage,
      allKeys: Object.keys(out || {})
    })

    // İyzico'dan başarılı yanıt geldi mi kontrol et
    // İyzico'da status: "success" genellikle başarılı ödeme anlamına gelir
    const isSuccessful = (
      iyzicoStatus === "success" && 
      (!iyzicoErrorCode || iyzicoErrorCode === "0")
    )

    console.log("🎯 Payment Success Check:", {
      isSuccessful,
      status: iyzicoStatus,
      errorCode: iyzicoErrorCode,
      hasPaymentStatus: !!iyzicoPaymentStatus
    })

    if (isSuccessful) {
      console.log("🎉 İyzico payment successful! Converting cart to order...")
      
      try {
        // Medusa service'lerini al
        const cartModuleService = req.scope.resolve(Modules.CART)
        const paymentModuleService = req.scope.resolve(Modules.PAYMENT)
        const query = req.scope.resolve("query")

        // Cart ID'yi conversation ID'den veya request'ten al
        let cartId = parsed.data.cartId || parsed.data.conversationId
        
        if (!cartId) {
          console.warn("❌ Cart ID not found, cannot convert to order")
          return res.status(200).json({
            ...out,
            medusa: {
              cart_completed: false,
              error: "Cart ID not found"
            }
          })
        }

        console.log(`🛒 Processing cart: ${cartId}`)

        // Cart'ı getir
        const cart = await cartModuleService.retrieveCart(cartId)

        if (!cart) {
          console.warn(`❌ Cart not found: ${cartId}`)
          return res.status(200).json({
            ...out,
            medusa: {
              cart_completed: false,
              error: `Cart not found: ${cartId}`
            }
          })
        }

        // Eğer cart zaten completed ise, tekrar işlem yapma
        if (cart.completed_at) {
          console.log("⚠️ Cart already completed, skipping conversion")
          return res.status(200).json({
            ...out,
            medusa: {
              cart_completed: true,
              cart_id: cartId,
              message: "Cart already completed"
            }
          })
        }

        // Cart ile ilişkili payment collection'ı getir
        const cartPaymentLinks = await query.graph({
          entity: "cart_payment_collection",
          fields: ["cart_id", "payment_collection_id"],
          filters: { cart_id: cartId }
        })

        if (!cartPaymentLinks?.data?.length) {
          console.warn("❌ No payment collection found for cart")
          return res.status(200).json({
            ...out,
            medusa: {
              cart_completed: false,
              error: "No payment collection found for cart"
            }
          })
        }

        const paymentCollectionId = cartPaymentLinks.data[0].payment_collection_id
        console.log(`💳 Payment collection found: ${paymentCollectionId}`)

        // Payment session'ları getir
        const paymentSessionsResult = await query.graph({
          entity: "payment_session",
          fields: ["id", "provider_id", "status", "payment_collection_id"],
          filters: { payment_collection_id: paymentCollectionId }
        })

        if (!paymentSessionsResult?.data?.length) {
          console.warn("❌ No payment sessions found")
          return res.status(200).json({
            ...out,
            medusa: {
              cart_completed: false,
              error: "No payment sessions found"
            }
          })
        }

        // İyzico payment session'ını bul
        const iyzicoSession = paymentSessionsResult.data.find(
          session => session.provider_id === "pp_iyzico_iyzico"
        )

        if (!iyzicoSession) {
          console.warn("❌ İyzico payment session not found")
          return res.status(200).json({
            ...out,
            medusa: {
              cart_completed: false,
              error: "İyzico payment session not found"
            }
          })
        }

        console.log(`🔐 Found İyzico session: ${iyzicoSession.id}, Status: ${iyzicoSession.status}`)

        // İyzico payment ID'sini log'a kaydet (session update karmaşık olduğu için skip)
        console.log(`🆔 İyzico PaymentId stored for tracking: ${parsed.data.paymentId}`)
        console.log(`� MAPPING: İyzico[${parsed.data.paymentId}] <-> Session[${iyzicoSession.id}]`)

        // Eğer session henüz authorized değilse, authorize et
        if (iyzicoSession.status !== "authorized") {
          console.log("🔑 Authorizing payment session...")
          
          try {
            // Payment session'ı direkt olarak authorize et
            await paymentModuleService.authorizePaymentSession(iyzicoSession.id, {
              paymentId: parsed.data.paymentId,
              conversationId: parsed.data.conversationId,
              iyzico_auth_success: true
            })
            console.log("✅ Payment session authorized")
          } catch (authError: any) {
            console.error("❌ Failed to authorize payment session:", authError.message)
            return res.status(200).json({
              ...out,
              medusa: {
                cart_completed: false,
                error: `Payment authorization failed: ${authError.message}`
              }
            })
          }
        }

        // Cart'ı order'a çevir
        console.log("🔄 Converting cart to order...")
        const { result: completedOrder } = await completeCartWorkflow(req.scope).run({
          input: {
            id: cartId
          }
        })

        console.log(`✅ Cart converted to order successfully: ${completedOrder.id}`)

        // Payment'ları getir ve capture et
        const paymentsResult = await query.graph({
          entity: "payment",
          fields: ["id", "amount", "payment_collection_id"],
          filters: { payment_collection_id: paymentCollectionId }
        })

        let paymentCaptured = false
        if (paymentsResult?.data?.length > 0) {
          const payment = paymentsResult.data[0]
          
          try {
            console.log(`💰 Capturing payment: ${payment.id}`)
            
            // Payment capture workflow kullan
            await capturePaymentWorkflow(req.scope).run({
              input: {
                payment_id: payment.id,
                amount: payment.amount
              }
            })

            console.log(`✅ Payment captured successfully: ${payment.id}`)
            paymentCaptured = true
          } catch (captureError: any) {
            console.error("❌ Failed to capture payment:", captureError.message)
            // Capture hatası olsa bile order oluşmuş olabilir
          }
        }
        
        // Başarılı response'a ek bilgiler ekle
        return res.status(200).json({
          ...out,
          medusa: {
            cart_completed: true,
            cart_id: cartId,
            order_id: completedOrder.id,
            iyzico_payment_id: parsed.data.paymentId, // Admin'de görmek için
            payment_captured: paymentCaptured,
            payment_session_id: iyzicoSession.id,
            mapping: `İyzico[${parsed.data.paymentId}] <-> Order[${completedOrder.id}]` // Mapping bilgisi
          }
        })

      } catch (conversionError: any) {
        console.error("❌ Cart to order conversion failed:", conversionError.message)
        console.error(conversionError.stack)
        
        // Conversion hatası olsa bile iyzico response'unu döndür
        return res.status(200).json({
          ...out,
          medusa: {
            cart_completed: false,
            error: conversionError.message
          }
        })
      }
    } else {
      // İyzico'dan hata yanıtı geldi
      console.warn("❌ İyzico payment failed:", {
        status: out?.status,
        paymentStatus: out?.paymentStatus,
        errorCode: out?.errorCode,
        errorMessage: out?.errorMessage
      })
    }

    return res.status(200).json(out)
  } catch (e: any) {
    console.error("❌ İyzico auth3DS endpoint failed:", e.message)
    return res.status(502).json({
      status: "error",
      error: e?.message || "iyzico auth3DS failed",
    })
  }
}
