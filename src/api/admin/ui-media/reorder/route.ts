import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { updates } = req.body as { updates: { id: string, sort_order: number }[] }
    
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ error: "Invalid updates array" })
    }
    
    // Get database connection
    const knex = req.scope.resolve("__pg_connection__")
    const now = new Date()
    
    // Update each item's sort_order
    for (const update of updates) {
      await knex('ui_media')
        .where('id', update.id)
        .update({
          sort_order: update.sort_order,
          updated_at: now
        })
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error("Error in PUT /admin/ui-media/reorder:", error)
    res.status(500).json({ error: "Internal server error", details: error.message })
  }
}
