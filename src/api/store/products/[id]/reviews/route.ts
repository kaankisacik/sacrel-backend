import type { MedusaRequest, MedusaResponse, AuthenticatedMedusaRequest } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id: product_id } = req.params
    const { limit = 20, offset = 0, status = "approved" } = req.query as any
    
    // Get database connection
    const knex = req.scope.resolve("__pg_connection__")
    
    const reviews = await knex('product_review')
      .select(
        'product_review.id', 'product_review.rating', 'product_review.title', 
        'product_review.comment', 'product_review.is_verified_purchase', 
        'product_review.helpful_count', 'product_review.created_at',
        'customer.first_name', 'customer.last_name'
      )
      .leftJoin('customer', 'product_review.customer_id', 'customer.id')
      .where('product_review.product_id', product_id)
      .where('product_review.status', status)
      .whereNull('product_review.deleted_at')
      .orderBy('product_review.created_at', 'desc')
      .limit(Number(limit))
      .offset(Number(offset))

    // Mask customer names for privacy
    const maskedReviews = reviews.map(review => {
      const maskName = (firstName, lastName) => {
        if (!firstName && !lastName) return "Anonim Müşteri"
        
        const first = firstName ? `${firstName.charAt(0)}${'*'.repeat(Math.max(firstName.length - 1, 2))}` : ""
        const last = lastName ? `${lastName.charAt(0)}${'*'.repeat(Math.max(lastName.length - 1, 2))}` : ""
        
        return [first, last].filter(Boolean).join(" ") || "Anonim Müşteri"
      }

      return {
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        is_verified_purchase: review.is_verified_purchase,
        helpful_count: review.helpful_count,
        created_at: review.created_at,
        customer_name: maskName(review.first_name, review.last_name)
      }
    })

    // Get average rating and total count
    const stats = await knex('product_review')
      .where('product_id', product_id)
      .where('status', 'approved')
      .whereNull('deleted_at')
      .select(
        knex.avg('rating').as('average_rating'),
        knex.count('*').as('total_reviews')
      )
      .first()

    res.json({
      reviews: maskedReviews,
      stats: {
        average_rating: stats?.average_rating ? parseFloat(stats.average_rating) : 0,
        total_reviews: parseInt(stats?.total_reviews || '0')
      }
    })
  } catch (error) {
    console.error("Error in GET /store/products/:id/reviews:", error)
    res.status(500).json({ error: "Internal server error", details: error.message })
  }
}

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  try {
    const { id: product_id } = req.params
    const payload = req.body as {
      rating: number
      title?: string
      comment?: string
    }

    // Validate required fields
    if (!payload.rating) {
      return res.status(400).json({ 
        error: "Validation error", 
        details: "Rating is required" 
      })
    }

    if (payload.rating < 1 || payload.rating > 5) {
      return res.status(400).json({ 
        error: "Validation error", 
        details: "Rating must be between 1 and 5" 
      })
    }

    // Get customer from auth using Medusa's authentication
    const customer_id = req.auth_context?.actor_id
    if (!customer_id) {
      return res.status(401).json({ error: "Authentication required" })
    }

    // Get database connection
    const knex = req.scope.resolve("__pg_connection__")

    // Verify that customer has purchased and received any variant of this product
    const deliveredPurchase = await knex('order_line_item')
      .join('fulfillment_item', 'order_line_item.id', 'fulfillment_item.line_item_id')
      .join('fulfillment', 'fulfillment_item.fulfillment_id', 'fulfillment.id')
      .join('order_item', 'order_line_item.id', 'order_item.item_id')
      .join('order', 'order_item.order_id', 'order.id')
      .where('order.customer_id', customer_id)
      .where('order_line_item.product_id', product_id)
      .whereNotNull('fulfillment.delivered_at')
      .whereNull('order_line_item.deleted_at')
      .whereNull('fulfillment_item.deleted_at')
      .whereNull('fulfillment.deleted_at')
      .whereNull('order_item.deleted_at')
      .whereNull('order.deleted_at')
      .first()

    if (!deliveredPurchase) {
      return res.status(403).json({ 
        error: "Purchase verification failed", 
        details: "You can only review products that you have purchased and received" 
      })
    }

    // Check if customer already reviewed this product
    const existingReview = await knex('product_review')
      .where('customer_id', customer_id)
      .where('product_id', product_id)
      .whereNull('deleted_at')
      .first()

    if (existingReview) {
      return res.status(400).json({ 
        error: "Review already exists", 
        details: "You have already reviewed this product" 
      })
    }

    // Generate a UUID for the new record
    const { randomUUID } = await import('crypto')
    const id = randomUUID()
    const now = new Date()
    
    const [created] = await knex('product_review')
      .insert({
        id,
        customer_id,
        product_id,
        rating: payload.rating,
        title: payload.title || null,
        comment: payload.comment || null,
        is_verified_purchase: true,
        status: 'pending', // Reviews need approval
        helpful_count: 0,
        created_at: now,
        updated_at: now
      })
      .returning('*')
    
    res.status(201).json({ 
      message: "Review submitted successfully and is pending approval",
      review: created 
    })
  } catch (error) {
    console.error("Error in POST /store/products/:id/reviews:", error)
    res.status(500).json({ error: "Internal server error", details: error.message })
  }
}