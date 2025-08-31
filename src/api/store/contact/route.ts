import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const payload = req.body as {
      name?: string
      email: string
      phone?: string
      subject?: string
      message: string
      order_id?: string
    }
    
    // Validate required fields
    if (!payload.email || !payload.message) {
      return res.status(400).json({ 
        error: "Validation error", 
        details: "Email and message are required" 
      })
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(payload.email)) {
      return res.status(400).json({ 
        error: "Validation error", 
        details: "Invalid email format" 
      })
    }
    
    // Generate a UUID for the new record
    const { randomUUID } = await import('crypto')
    const id = randomUUID()
    const now = new Date()
    
    // Get database connection
    const knex = req.scope.resolve("__pg_connection__")
    
    const [created] = await knex('contact_message')
      .insert({
        id,
        name: payload.name || null,
        email: payload.email,
        phone: payload.phone || null,
        subject: payload.subject || null,
        message: payload.message,
        order_id: payload.order_id || null,
        status: 'new',
        created_at: now,
        updated_at: now,
      })
      .returning('*')
    
    res.status(201).json({ 
      message: "Contact message created successfully",
      item: created 
    })
  } catch (error) {
    console.error("Error in POST /store/contact:", error)
    res.status(500).json({ error: "Internal server error", details: error.message })
  }
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    // This endpoint could be used to get contact form configuration or similar
    res.json({ 
      message: "Contact endpoint is available",
      fields: {
        required: ["email", "message"],
        optional: ["name", "phone", "subject", "order_id"]
      }
    })
  } catch (error) {
    console.error("Error in GET /store/contact:", error)
    res.status(500).json({ error: "Internal server error", details: error.message })
  }
}
