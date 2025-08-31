import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query as any
    
    // Get database connection
    const knex = req.scope.resolve("__pg_connection__")
    
    let query = knex('contact_message')
      .select('id', 'name', 'email', 'phone', 'subject', 'message', 'order_id', 'status', 'created_at', 'updated_at')
    
    if (status) {
      query = query.where('status', status)
    }
    
    const items = await query
      .orderBy('created_at', 'desc')
      .limit(Number(limit))
      .offset(Number(offset))
    
    res.json({ count: items.length, items })
  } catch (error) {
    console.error("Error in GET /admin/contact:", error)
    res.status(500).json({ error: "Internal server error", details: error.message })
  }
}
