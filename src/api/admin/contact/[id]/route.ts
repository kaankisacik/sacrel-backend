import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params
    
    // Get database connection
    const knex = req.scope.resolve("__pg_connection__")
    
    const item = await knex('contact_message')
      .select('id', 'name', 'email', 'phone', 'subject', 'message', 'order_id', 'status', 'created_at', 'updated_at')
      .where('id', id)
      .first()
    
    if (!item) {
      return res.status(404).json({ error: "Contact message not found" })
    }
    
    res.json({ item })
  } catch (error) {
    console.error("Error in GET /admin/contact/:id:", error)
    res.status(500).json({ error: "Internal server error", details: error.message })
  }
}

export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params
    const payload = req.body as any
    
    // Get database connection
    const knex = req.scope.resolve("__pg_connection__")
    
    const now = new Date()
    
    const [updated] = await knex('contact_message')
      .where('id', id)
      .update({
        ...payload,
        updated_at: now,
      })
      .returning('*')
    
    if (!updated) {
      return res.status(404).json({ error: "Contact message not found" })
    }
    
    res.json({ item: updated })
  } catch (error) {
    console.error("Error in PUT /admin/contact/:id:", error)
    res.status(500).json({ error: "Internal server error", details: error.message })
  }
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params
    
    // Get database connection
    const knex = req.scope.resolve("__pg_connection__")
    
    const deleted = await knex('contact_message')
      .where('id', id)
      .del()
    
    if (deleted === 0) {
      return res.status(404).json({ error: "Contact message not found" })
    }
    
    res.json({ message: "Contact message deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /admin/contact/:id:", error)
    res.status(500).json({ error: "Internal server error", details: error.message })
  }
}
