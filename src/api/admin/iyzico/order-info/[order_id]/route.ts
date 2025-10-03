import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { order_id } = req.params

    if (!order_id) {
      return res.status(400).json({ error: "Order ID is required" })
    }

    const query = req.scope.resolve("query")
    
    try {
      // Order'ı ve payment collection'ını getir
      const orderResult = await query.graph({
        entity: "order",
        fields: ["id", "payment_collections.id"],
        filters: { id: order_id }
      })

      if (!orderResult?.data?.length) {
        return res.status(404).json({ 
          found: false,
          error: "Order not found" 
        })
      }

      const order = orderResult.data[0]
      const paymentCollections = order.payment_collections || []

      if (!paymentCollections.length) {
        return res.status(200).json({
          found: false,
          message: "No payment collections found for this order"
        })
      }

      // İyzico payment session'ları ara
      for (const collection of paymentCollections) {
        if (!collection?.id) continue
        
        const paymentSessionResult = await query.graph({
          entity: "payment_session",
          fields: ["id", "data", "provider_id", "payment_collection_id"],
          filters: { 
            payment_collection_id: collection.id,
            provider_id: "pp_iyzico_iyzico"
          }
        })

        if (paymentSessionResult?.data?.length) {
          const session = paymentSessionResult.data[0]
          const sessionData = session.data || {}
          
          // İyzico payment ID'sini session data'dan al
          const iyzicoPaymentId = sessionData.paymentId || 
                                sessionData.iyzico_payment_id || 
                                sessionData.payment_id

          return res.status(200).json({
            found: true,
            order_id,
            iyzico_payment_id: iyzicoPaymentId,
            payment_session_id: session.id,
            payment_collection_id: collection.id,
            session_data: sessionData // Debug için
          })
        }
      }

      return res.status(200).json({
        found: false,
        message: "No İyzico payment sessions found for this order"
      })

    } catch (queryError: any) {
      console.error("❌ Order info query failed:", queryError.message)
      return res.status(500).json({ 
        found: false,
        error: "Database query failed", 
        details: queryError.message 
      })
    }

  } catch (e: any) {
    console.error("❌ İyzico order info endpoint failed:", e.message)
    return res.status(500).json({
      found: false,
      error: e?.message || "Order info lookup failed"
    })
  }
}