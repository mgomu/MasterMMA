import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit no carga .env.local por defecto; lo hacemos explícito.
config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
