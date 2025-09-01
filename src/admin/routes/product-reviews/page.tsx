import { useEffect, useState } from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"

interface ProductReview {
  id: string
  customer_id: string
  customer_email: string
  customer_first_name?: string
  customer_last_name?: string
  product_id: string
  product_title?: string
  product_handle?: string
  product_average_rating: number
  product_review_count: number
  rating: number
  title?: string
  comment?: string
  is_verified_purchase: boolean
  status: "pending" | "approved" | "rejected"
  helpful_count: number
  created_at: string
  updated_at: string
}

function ProductReviewsPage() {
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>("pending")
  const [productFilter, setProductFilter] = useState<string>("")

  const loadReviews = async () => {
    try {
      setLoading(true)
      const queryParams = selectedStatus !== "all" ? `?status=${selectedStatus}` : "?status=all"
      const response = await fetch(`/admin/product-reviews${queryParams}`)
      const data = await response.json()
      
      if (response.ok) {
        setReviews(data.reviews || [])
      } else {
        console.error("Error loading reviews:", data.error)
        setReviews([])
      }
    } catch (error) {
      console.error("Error loading reviews:", error)
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  const updateReviewStatus = async (id: string, status: "pending" | "approved" | "rejected") => {
    try {
      const response = await fetch(`/admin/product-reviews/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        loadReviews()
      } else {
        const data = await response.json()
        console.error("Error updating review status:", data.error)
      }
    } catch (error) {
      console.error("Error updating review status:", error)
    }
  }

  const deleteReview = async (id: string) => {
    if (!confirm("Bu incelemeyi silmek istediğinizden emin misiniz?")) {
      return
    }

    try {
      const response = await fetch(`/admin/product-reviews/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        loadReviews()
      } else {
        const data = await response.json()
        console.error("Error deleting review:", data.error)
      }
    } catch (error) {
      console.error("Error deleting review:", error)
    }
  }

  const getStatusBadge = (status: "pending" | "approved" | "rejected") => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800"
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
        {status === "pending" ? "Beklemede" : status === "approved" ? "Onaylandı" : "Reddedildi"}
      </span>
    )
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? "text-yellow-400" : "text-gray-300"}>
        ★
      </span>
    ))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const openProductInNewTab = (productId: string) => {
    const productUrl = `/app/products/${productId}`
    window.open(productUrl, '_blank')
  }

  // Filter reviews based on product name
  const filteredReviews = reviews.filter(review => {
    if (!productFilter) return true
    const productTitle = review.product_title?.toLowerCase() || ""
    const productId = review.product_id.toLowerCase()
    const filterLower = productFilter.toLowerCase()
    return productTitle.includes(filterLower) || productId.includes(filterLower)
  })

  useEffect(() => {
    loadReviews()
  }, [selectedStatus])

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
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Ürün İncelemeleri</h1>
        
        {/* Filters */}
        <div className="mb-4 flex gap-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="pending">Bekleyen İncelemeler</option>
            <option value="approved">Onaylanan İncelemeler</option>
            <option value="rejected">Reddedilen İncelemeler</option>
            <option value="all">Tüm İncelemeler</option>
          </select>
          
          <input
            type="text"
            placeholder="Ürün adı veya ID ile filtrele..."
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm flex-1 max-w-md"
          />
        </div>
      </div>

      {filteredReviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {productFilter ? "Filtre kriterlerine uygun inceleme bulunamadı." : "Henüz inceleme bulunmamaktadır."}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {review.customer_first_name} {review.customer_last_name}
                    </h3>
                    {getStatusBadge(review.status)}
                    {review.is_verified_purchase && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ✓ Doğrulanmış Alım
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><strong>E-posta:</strong> {review.customer_email}</div>
                    <div className="flex items-center gap-2">
                      <strong>Ürün:</strong> 
                      <button
                        onClick={() => openProductInNewTab(review.product_id)}
                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        title="Ürün sayfasını yeni sekmede aç"
                      >
                        {review.product_title || review.product_id}
                      </button>
                      {review.product_average_rating > 0 && (
                        <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                          ⭐ {review.product_average_rating.toFixed(1)} ({review.product_review_count} inceleme)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <strong>Bu İncelemenin Puanı:</strong> 
                      <div className="flex">{renderStars(review.rating)}</div>
                      <span>({review.rating}/5)</span>
                    </div>
                    <div><strong>Tarih:</strong> {formatDate(review.created_at)}</div>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <select
                    value={review.status}
                    onChange={(e) => updateReviewStatus(review.id, e.target.value as any)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="pending">Beklemede</option>
                    <option value="approved">Onayla</option>
                    <option value="rejected">Reddet</option>
                  </select>
                  
                  <button
                    onClick={() => deleteReview(review.id)}
                    className="text-red-600 hover:text-red-800 text-sm px-2 py-1 border border-red-300 rounded hover:bg-red-50"
                  >
                    Sil
                  </button>
                </div>
              </div>

              {(review.title || review.comment) && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="font-medium text-gray-900">Yorum Başlığı:</span> {review.title && (
                    <h4 className="text-gray-900 mb-2">{review.title}</h4>
                  )}
                  <span className="font-medium text-gray-900">Yorum İçeriği:</span> {review.comment && (
                    <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Ürün İncelemeleri",
})

export default ProductReviewsPage