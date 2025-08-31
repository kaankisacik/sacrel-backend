import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params as any
    const payload = req.body as any
    const now = new Date()
    
    // Get database connection
    const knex = req.scope.resolve("__pg_connection__")
    
    const [updated] = await knex('ui_media')
      .where('id', id)
      .update({
        type: payload.type,
        title: payload.title || null,
        image_url: payload.image_url,
        link_url: payload.link_url || null,
        sort_order: payload.sort_order || 0,
        is_active: payload.is_active !== undefined ? payload.is_active : true,
        locale: payload.locale || 'tr',
        updated_at: now
      })
      .returning('*')
    
    if (!updated) {
      return res.status(404).json({ error: "UI Media not found" })
    }
    
    res.json({ item: updated })
  } catch (error) {
    console.error("Error in PUT /admin/ui-media/[id]:", error)
    res.status(500).json({ error: "Internal server error", details: error.message })
  }
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params as any
    
    // Get database connection
    const knex = req.scope.resolve("__pg_connection__")
    
    const deleted = await knex('ui_media')
      .where('id', id)
      .del()
    
    if (deleted === 0) {
      return res.status(404).json({ error: "UI Media not found" })
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /admin/ui-media/[id]:", error)
    res.status(500).json({ error: "Internal server error", details: error.message })
  }
}
