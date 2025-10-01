import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  return res.status(200).json({
    message: "✅ Admin test endpoint is working",
    endpoint: "/admin/iyzico/test",
    timestamp: new Date().toISOString(),
    description: "This endpoint tests that admin API is accessible for Iyzico endpoints"
  });
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  return res.status(200).json({
    message: "✅ Admin POST test endpoint is working",
    endpoint: "/admin/iyzico/test",
    body: req.body,
    timestamp: new Date().toISOString(),
    description: "This endpoint tests POST requests to admin API"
  });
}