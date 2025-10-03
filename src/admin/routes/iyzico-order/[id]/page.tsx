import { useEffect, useState } from "react"

interface IyzicoInfo {
  found: boolean
  iyzico_payment_id?: string
  payment_session_id?: string
  payment_collection_id?: string
  session_data?: any
}

export default function IyzicoOrderInfo() {
  // URL'den order ID'yi al
  const orderId = typeof window !== 'undefined' ? 
    window.location.pathname.split('/').pop() : null
    
  const [iyzicoInfo, setIyzicoInfo] = useState<IyzicoInfo>({ found: false })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchIyzicoInfo = async () => {
      if (!orderId) return

      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/admin/iyzico/order-info/${orderId}`)
        
        if (response.ok) {
          const data = await response.json()
          setIyzicoInfo(data)
        } else {
          const errorData = await response.json()
          setError(errorData.error || `HTTP ${response.status}`)
        }
      } catch (err: any) {
        setError(err.message || "Bilinmeyen hata")
      } finally {
        setLoading(false)
      }
    }

    fetchIyzicoInfo()
  }, [orderId])

  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        <h1>İyzico Order Info</h1>
        <p>Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <h1>İyzico Order Info</h1>
        <div style={{ 
          backgroundColor: "#fee", 
          border: "1px solid #fcc", 
          padding: "12px", 
          borderRadius: "4px" 
        }}>
          <strong>Hata:</strong> {error}
        </div>
        <p style={{ marginTop: "16px" }}>
          <strong>Order ID:</strong> {orderId}
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>İyzico Order Info</h1>
      
      <div style={{ 
        backgroundColor: "#f9f9f9", 
        border: "1px solid #ddd", 
        padding: "16px", 
        borderRadius: "8px",
        marginBottom: "20px"
      }}>
        <p><strong>Order ID:</strong> {orderId}</p>
        <p><strong>İyzico Status:</strong> {iyzicoInfo.found ? "✅ Found" : "❌ Not Found"}</p>
      </div>

      {iyzicoInfo.found ? (
        <div style={{ 
          backgroundColor: "#f0f9ff", 
          border: "1px solid #0ea5e9", 
          padding: "16px", 
          borderRadius: "8px" 
        }}>
          <h2>İyzico Payment Details</h2>
          
          {iyzicoInfo.iyzico_payment_id && (
            <div style={{ marginBottom: "12px" }}>
              <strong>İyzico Payment ID:</strong>
              <div style={{ 
                fontFamily: "monospace", 
                backgroundColor: "#fff", 
                padding: "8px", 
                border: "1px solid #ccc", 
                borderRadius: "4px",
                marginTop: "4px"
              }}>
                {iyzicoInfo.iyzico_payment_id}
              </div>
            </div>
          )}
          
          {iyzicoInfo.payment_session_id && (
            <div style={{ marginBottom: "12px" }}>
              <strong>Payment Session ID:</strong>
              <div style={{ 
                fontFamily: "monospace", 
                fontSize: "12px",
                backgroundColor: "#fff", 
                padding: "8px", 
                border: "1px solid #ccc", 
                borderRadius: "4px",
                marginTop: "4px"
              }}>
                {iyzicoInfo.payment_session_id}
              </div>
            </div>
          )}
          
          {iyzicoInfo.payment_collection_id && (
            <div style={{ marginBottom: "12px" }}>
              <strong>Payment Collection ID:</strong>
              <div style={{ 
                fontFamily: "monospace", 
                fontSize: "12px",
                backgroundColor: "#fff", 
                padding: "8px", 
                border: "1px solid #ccc", 
                borderRadius: "4px",
                marginTop: "4px"
              }}>
                {iyzicoInfo.payment_collection_id}
              </div>
            </div>
          )}

          {iyzicoInfo.session_data && (
            <div style={{ marginTop: "20px" }}>
              <strong>Session Data (Debug):</strong>
              <pre style={{ 
                backgroundColor: "#fff", 
                padding: "12px", 
                border: "1px solid #ccc", 
                borderRadius: "4px",
                fontSize: "11px",
                overflow: "auto",
                marginTop: "4px"
              }}>
                {JSON.stringify(iyzicoInfo.session_data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <div style={{ 
          backgroundColor: "#fef3c7", 
          border: "1px solid #f59e0b", 
          padding: "16px", 
          borderRadius: "8px" 
        }}>
          <h2>İyzico Payment Not Found</h2>
          <p>Bu sipariş İyzico ile ödenmemiş veya İyzico payment bilgileri bulunamadı.</p>
          <p>Diğer ödeme yöntemleri kullanılmış olabilir.</p>
        </div>
      )}
    </div>
  )
}