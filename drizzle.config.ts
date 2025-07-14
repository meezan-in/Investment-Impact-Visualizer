import { defineConfig } from "drizzle-kit";

// Removed DATABASE_URL check for deployments without a database

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
