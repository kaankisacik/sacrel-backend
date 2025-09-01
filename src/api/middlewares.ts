import { 
  defineMiddlewares,
  authenticate,
} from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/products/*/reviews",
      method: "POST",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
  ],
})
