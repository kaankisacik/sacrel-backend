import { loadEnv, defineConfig } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseDriverOptions:{
      connection:{
        ssl:false
      }
    },
    databaseLogging:true,
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:3000",
      adminCors: process.env.ADMIN_CORS || "http://localhost:9000",
      authCors:
        process.env.AUTH_CORS || "http://localhost:3000,http://localhost:9000",
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  modules: [
      { resolve: "./src/modules/contact" },
      { resolve: "./src/modules/ui-media" },
      { resolve: "./src/modules/product-review" },
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/notification-local",
            id: "local",
            options: {
              channels: ["email"],
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/fake-cc",
            id: "dev-fake-cc", // will be stored as pp_fake-cc_dev-fake-cc
            options: { testMode: true },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/file-local",
            id: "local",
            options: {
              // Dosyaların yazılacağı klasör (proje köküne göre)
              upload_dir: "static",           // örn: static veya static/uploads
              // Dosyaların servis edildiği public URL kökü
              backend_url: "http://localhost:9000/static",
            },
          },
        ],
      },
    },
  ],
});
