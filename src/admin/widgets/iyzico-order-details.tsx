import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types"
import { useEffect, useState } from "react"

interface IyzicoOrderInfo {
  iyzico_payment_id?: string
  found: boolean
}

const IyzicoOrderDetailsWidget = ({ data }: DetailWidgetProps<AdminOrder>) => {
  const [iyzicoInfo, setIyzicoInfo] = useState<IyzicoOrderInfo>({ found: false })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchIyzicoInfo = async () => {
      try {
        setLoading(true)
        
        const response = await fetch(`/admin/iyzico/order-info/${data.id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const info = await response.json()
          setIyzicoInfo(info)
        } else {
          setIyzicoInfo({ found: false })
        }
      } catch (error) {
        console.error("İyzico bilgileri alınamadı:", error)
        setIyzicoInfo({ found: false })
      } finally {
        setLoading(false)
      }
    }

    if (data?.id) {
      fetchIyzicoInfo()
    }
  }, [data?.id])

  if (loading) {
    return (
      <div style={{
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "16px",
        margin: "16px 0",
        backgroundColor: "#fff"
      }}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: "18px", fontWeight: "600" }}>
          İyzico Payment
        </h2>
        <p style={{ margin: 0, color: "#6b7280" }}>Loading...</p>
      </div>
    )
  }

  if (!iyzicoInfo.found || !iyzicoInfo.iyzico_payment_id) {
    return (
      <div style={{
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "16px",
        margin: "16px 0",
        backgroundColor: "#fff"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>İyzico Payment</h2>
          <span style={{
            backgroundColor: "#f59e0b",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "500"
          }}>
            Not İyzico
          </span>
        </div>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
          Bu sipariş İyzico ile ödenmemiş.
        </p>
      </div>
    )
  }

  return (
    <div style={{
      border: "1px solid #343437",
      borderRadius: "8px",
      padding: "16px",
      margin: "16px 0",
      backgroundColor: "#212124"
    }}>
     
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#fff", fontSize: "16px" }}>İyzico Payment ID</span>
        <span style={{
          fontFamily: "monospace",
          fontSize: "14px",
          fontWeight: "500",
          padding: "4px 8px",
          borderRadius: "4px",
          border: "1px solid #d1d5db"
        }}>
          {iyzicoInfo.iyzico_payment_id}
        </span>
      </div>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.after", // Order detay sayfasının sonunda gösterilecek
})

export default IyzicoOrderDetailsWidget