import { useEffect, useState } from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"

interface ContactMessage {
  id: string
  name?: string
  email: string
  phone?: string
  subject?: string
  message: string
  order_id?: string
  status: "new" | "read" | "archived"
  created_at: string
  updated_at: string
}

function ContactPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null)

  const loadMessages = async () => {
    try {
      setLoading(true)
      const queryParams = selectedStatus !== "all" ? `?status=${selectedStatus}` : ""
      const response = await fetch(`/admin/contact${queryParams}`)
      const data = await response.json()
      
      if (response.ok) {
        setMessages(data.items || [])
      } else {
        console.error("Error loading contact messages:", data.error)
        setMessages([])
      }
    } catch (error) {
      console.error("Error loading contact messages:", error)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: "new" | "read" | "archived") => {
    try {
      const response = await fetch(`/admin/contact/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        loadMessages()
      } else {
        const data = await response.json()
        console.error("Error updating status:", data.error)
      }
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const deleteMessage = async (id: string) => {
    if (!confirm("Bu mesajı silmek istediğinizden emin misiniz?")) {
      return
    }

    try {
      const response = await fetch(`/admin/contact/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        loadMessages()
      } else {
        const data = await response.json()
        console.error("Error deleting message:", data.error)
      }
    } catch (error) {
      console.error("Error deleting message:", error)
    }
  }

  useEffect(() => {
    loadMessages()
  }, [selectedStatus])

  const getStatusBadge = (status: "new" | "read" | "archived") => {
    const colors: Record<string, string> = {
      new: "bg-blue-100 text-blue-800",
      read: "bg-green-100 text-green-800",
      archived: "bg-gray-100 text-gray-800"
    }
    
    const labels: Record<string, string> = {
      new: "Yeni",
      read: "Okundu",
      archived: "Arşivlendi"
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("tr-TR")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">İletişim Mesajları</h1>
        
        {/* Status Filter */}
        <div className="mb-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">Tüm Mesajlar</option>
            <option value="new">Yeni</option>
            <option value="read">Okundu</option>
            <option value="archived">Arşivlendi</option>
          </select>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Henüz mesaj bulunmamaktadır.
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {message.name || "İsimsiz"}
                    </h3>
                    {getStatusBadge(message.status)}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><strong>E-posta:</strong> {message.email}</div>
                    {message.phone && <div><strong>Telefon:</strong> {message.phone}</div>}
                    {message.subject && <div><strong>Konu:</strong> {message.subject}</div>}
                    {message.order_id && <div><strong>Sipariş ID:</strong> {message.order_id}</div>}
                    <div><strong>Tarih:</strong> {formatDate(message.created_at)}</div>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <select
                    value={message.status}
                    onChange={(e) => updateStatus(message.id, e.target.value as any)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="new">Yeni</option>
                    <option value="read">Okundu</option>
                    <option value="archived">Arşivlendi</option>
                  </select>
                  
                  <button
                    onClick={() => deleteMessage(message.id)}
                    className="text-red-600 hover:text-red-800 text-sm px-2 py-1 border border-red-300 rounded hover:bg-red-50"
                  >
                    Sil
                  </button>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <button
                  onClick={() => setExpandedMessage(
                    expandedMessage === message.id ? null : message.id
                  )}
                  className="text-sm text-blue-600 hover:text-blue-800 mb-2"
                >
                  {expandedMessage === message.id ? "Mesajı Gizle" : "Mesajı Göster"}
                </button>
                
                {expandedMessage === message.id && (
                  <div className="bg-gray-50 p-3 rounded border">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {message.message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "İletişim Mesajları",
})

export default ContactPage
