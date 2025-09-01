import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { 
      status = "pending", 
      product_id, 
      limit = 50, 
      offset = 0 
    } = req.query as any
    
    // Get database connection
    const knex = req.scope.resolve("__pg_connection__")
    
    let query = knex('product_review')
      .select(
        'product_review.*',
        'customer.email as customer_email',
        'customer.first_name as customer_first_name',
        'customer.last_name as customer_last_name',
        'product.title as product_title',
        'product.handle as product_handle'
      )
      .leftJoin('customer', 'product_review.customer_id', 'customer.id')
      .leftJoin('product', 'product_review.product_id', 'product.id')
      .whereNull('product_review.deleted_at')
    
    if (status && status !== 'all') {
      query = query.where('product_review.status', status)
    }
    
    if (product_id) {
      query = query.where('product_review.product_id', product_id)
    }
    
    const reviews = await query
      .orderBy('product_review.created_at', 'desc')
      .limit(Number(limit))
      .offset(Number(offset))

    // Get total count for pagination
    const countQuery = knex('product_review')
      .whereNull('deleted_at')
    
    if (status && status !== 'all') {
      countQuery.where('status', status)
    }
    
    if (product_id) {
      countQuery.where('product_id', product_id)
    }
    
    const [{ count }] = await countQuery.count('* as count')

    // Get product statistics - average rating per product
    const productStats = await knex('product_review')
      .select(
        'product_id',
        knex.avg('rating').as('average_rating'),
        knex.count('*').as('review_count')
      )
      .where('status', 'approved')
      .whereNull('deleted_at')
      .groupBy('product_id')

    // Add statistics to reviews
    const reviewsWithStats = reviews.map(review => {
      const stats = productStats.find(stat => stat.product_id === review.product_id)
      return {
        ...review,
        product_average_rating: stats ? parseFloat(stats.average_rating) : 0,
        product_review_count: stats ? parseInt(stats.review_count) : 0
      }
    })

    res.json({
      reviews: reviewsWithStats,
      count: Number(count),
      limit: Number(limit),
      offset: Number(offset)
    })
  } catch (error) {
    console.error("Error in GET /admin/product-reviews:", error)
    res.status(500).json({ error: "Internal server error", details: error.message })
  }
}