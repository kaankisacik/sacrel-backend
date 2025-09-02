import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import fs from "fs"
import path from "path"

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
    
    // First, get the ui-media record to extract the image URL
    const [uiMedia] = await knex('ui_media')
      .where('id', id)
      .select('*')
    
    if (!uiMedia) {
      return res.status(404).json({ error: "UI Media not found" })
    }
    
    // Extract filename from image_url and delete the file
    if (uiMedia.image_url) {
      try {
        // Extract the filename from the URL (e.g., "http://localhost:9000/static/filename.jpg" -> "filename.jpg")
        const urlParts = uiMedia.image_url.split('/')
        const filename = urlParts[urlParts.length - 1]
        
        // Construct the file path (static directory is in the project root)
        const filePath = path.join(process.cwd(), 'static', filename)
        
        // Check if file exists before attempting to delete
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
          console.log(`Deleted file: ${filePath}`)
        } else {
          console.warn(`File not found: ${filePath}`)
        }
      } catch (fileError) {
        console.error("Error deleting file:", fileError)
        // Continue with database deletion even if file deletion fails
      }
    }
    
    // Delete the database record
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
