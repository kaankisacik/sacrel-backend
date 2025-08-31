import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { type, locale, limit = 50, offset = 0 } = req.query as any
    
    // Get database connection 
    const knex = req.scope.resolve("__pg_connection__")
    
    let query = knex('ui_media')
      .select('id', 'type', 'title', 'image_url', 'link_url', 'sort_order', 'is_active', 'locale', 'created_at', 'updated_at')
    
    if (type) {
      query = query.where('type', type)
    }
    
    if (locale) {
      query = query.where('locale', locale)
    }
    
    const items = await query
      .orderBy('sort_order', 'asc')
      .orderBy('created_at', 'desc')
      .limit(Number(limit))
      .offset(Number(offset))
    
    res.json({ count: items.length, items })
  } catch (error) {
    console.error("Error in GET /admin/ui-media:", error)
    res.status(500).json({ error: "Internal server error", details: error.message })
  }
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const payload = req.body as any
    
    // Generate a UUID for the new record
    const { randomUUID } = await import('crypto')
    const id = randomUUID()
    const now = new Date()
    
    // Get database connection
    const knex = req.scope.resolve("__pg_connection__")
    
    const [created] = await knex('ui_media')
      .insert({
        id,
        type: payload.type,
        title: payload.title || null,
        image_url: payload.image_url,
        link_url: payload.link_url || null,
        sort_order: payload.sort_order || 0,
        is_active: payload.is_active !== undefined ? payload.is_active : true,
        locale: payload.locale || 'tr',
        created_at: now,
        updated_at: now
      })
      .returning('*')
    
    res.status(201).json({ item: created })
  } catch (error) {
    console.error("Error in POST /admin/ui-media:", error)
    res.status(500).json({ error: "Internal server error", details: error.message })
  }
}
