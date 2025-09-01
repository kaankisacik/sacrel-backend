import { MedusaService } from "@medusajs/framework/utils"
import { ProductReview } from "./models/product-review"

class ProductReviewModuleService extends MedusaService({
  ProductReview,
}) {
  async createReview(data: {
    customer_id: string
    product_id: string
    order_id: string
    rating: number
    title?: string
    comment?: string
  }) {
    return await this.createProductReviews(data)
  }

  async getProductReviews(product_id: string, filters?: {
    status?: string
    limit?: number
    offset?: number
  }) {
    const { limit = 20, offset = 0, status = "approved" } = filters || {}
    
    return await this.listProductReviews({
      product_id,
      status,
    }, {
      take: limit,
      skip: offset,
      order: { created_at: "DESC" }
    })
  }

  async getCustomerReviewForProduct(customer_id: string, product_id: string) {
    const reviews = await this.listProductReviews({
      customer_id,
      product_id,
    })
    return reviews[0] || null
  }

  async updateReviewStatus(id: string, status: "pending" | "approved" | "rejected") {
    return await this.updateProductReviews({ id }, { status })
  }
}

export default ProductReviewModuleService