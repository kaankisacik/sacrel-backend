import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params
    const { status } = req.body as { status: "pending" | "approved" | "rejected" }
    
    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ 
        error: "Validation error", 
        details: "Status must be pending, approved, or rejected" 
      })
    }
    
    // Get database connection
    const knex = req.scope.resolve("__pg_connection__")
    
    const [updated] = await knex('product_review')
      .where('id', id)
      .update({
        status,
        updated_at: new Date()
      })
      .returning('*')
    
    if (!updated) {
      return res.status(404).json({ error: "Review not found" })
    }
    
    res.json({ review: updated })
  } catch (error) {
    console.error("Error in PUT /admin/product-reviews/:id:", error)
    res.status(500).json({ error: "Internal server error", details: error.message })
  }
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params
    
    // Get database connection
    const knex = req.scope.resolve("__pg_connection__")
    
    const [deleted] = await knex('product_review')
      .where('id', id)
      .update({
        deleted_at: new Date()
      })
      .returning('id')
    
    if (!deleted) {
      return res.status(404).json({ error: "Review not found" })
    }
    
    res.json({ message: "Review deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /admin/product-reviews/:id:", error)
    res.status(500).json({ error: "Internal server error", details: error.message })
  }
}