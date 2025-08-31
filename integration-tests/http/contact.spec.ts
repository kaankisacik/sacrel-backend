import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
jest.setTimeout(60 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api }) => {
    describe("Contact API", () => {
      let contactMessageId: string

      it("should create a new contact message", async () => {
        const payload = {
          name: "Test User",
          email: "test@example.com",
          phone: "+90 555 123 4567",
          subject: "Test Subject",
          message: "This is a test message",
          order_id: "order_123"
        }

        const response = await api.post('/store/contact', payload)
        expect(response.status).toEqual(201)
        expect(response.data.item).toBeDefined()
        expect(response.data.item.email).toEqual(payload.email)
        expect(response.data.item.status).toEqual('new')
        
        contactMessageId = response.data.item.id
      })

      it("should fail to create contact message without required fields", async () => {
        const payload = {
          name: "Test User"
        }

        const response = await api.post('/store/contact', payload)
        expect(response.status).toEqual(400)
        expect(response.data.error).toEqual("Validation error")
      })

      it("should fail with invalid email format", async () => {
        const payload = {
          email: "invalid-email",
          message: "Test message"
        }

        const response = await api.post('/store/contact', payload)
        expect(response.status).toEqual(400)
        expect(response.data.details).toEqual("Invalid email format")
      })

      it("should get contact form configuration", async () => {
        const response = await api.get('/store/contact')
        expect(response.status).toEqual(200)
        expect(response.data.fields).toBeDefined()
        expect(response.data.fields.required).toContain("email")
        expect(response.data.fields.required).toContain("message")
      })
    })

    describe("Admin Contact API", () => {
      let contactMessageId: string

      beforeAll(async () => {
        // Create a test contact message first
        const payload = {
          name: "Admin Test User",
          email: "admin-test@example.com",
          message: "This is an admin test message"
        }

        const response = await api.post('/store/contact', payload)
        contactMessageId = response.data.item.id
      })

      it("should list contact messages", async () => {
        const response = await api.get('/admin/contact')
        expect(response.status).toEqual(200)
        expect(response.data.items).toBeDefined()
        expect(Array.isArray(response.data.items)).toBeTruthy()
      })

      it("should get a specific contact message", async () => {
        const response = await api.get(`/admin/contact/${contactMessageId}`)
        expect(response.status).toEqual(200)
        expect(response.data.item).toBeDefined()
        expect(response.data.item.id).toEqual(contactMessageId)
      })

      it("should update contact message status", async () => {
        const response = await api.put(`/admin/contact/${contactMessageId}`, {
          status: 'read'
        })
        expect(response.status).toEqual(200)
        expect(response.data.item.status).toEqual('read')
      })

      it("should filter contact messages by status", async () => {
        const response = await api.get('/admin/contact?status=read')
        expect(response.status).toEqual(200)
        expect(response.data.items).toBeDefined()
        
        // All returned items should have 'read' status
        response.data.items.forEach((item: any) => {
          expect(item.status).toEqual('read')
        })
      })

      it("should delete a contact message", async () => {
        const response = await api.delete(`/admin/contact/${contactMessageId}`)
        expect(response.status).toEqual(200)
        expect(response.data.message).toEqual("Contact message deleted successfully")
      })

      it("should return 404 for non-existent contact message", async () => {
        const response = await api.get(`/admin/contact/${contactMessageId}`)
        expect(response.status).toEqual(404)
        expect(response.data.error).toEqual("Contact message not found")
      })
    })
  },
})
