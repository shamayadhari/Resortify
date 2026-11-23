import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),

  // Database
  MONGODB_URI: z
    .string({ required_error: "MONGODB_URI is required" })
    .min(1, "MONGODB_URI is required")
    .regex(/^mongodb(\+srv)?:\/\//, "MONGODB_URI must start with mongodb:// or mongodb+srv://"),

  // Auth
  JWT_SECRET: z
    .string({ required_error: "JWT_SECRET is required" })
    .min(32, "JWT_SECRET must be at least 32 characters")
    .refine((v) => !/replace-with|changeme|secret-here/i.test(v), "JWT_SECRET is still the placeholder"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  BCRYPT_COST: z.coerce.number().int().min(10).max(15).default(12),

  // URLs
  // Where the interface runs; added to the CORS allow-list.
  CLIENT_URL: z.string().url().default("http://localhost:8080"),
  CORS_ORIGINS: z.string().default(""),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),

  // Files
  UPLOAD_DIR: z.string().default("uploads"),

  // Rate limiting (per IP, per 15 minutes) on sign-up / sign-in / contact
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(10),

});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("\nInvalid server configuration (check backend/.env):");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".") || "env"}: ${issue.message}`);
  }
  console.error("\nCopy backend/.env.example to backend/.env and fill it in.\n");
  process.exit(1);
}

const e = parsed.data;

const defaultOrigins = ["http://localhost:8080", "http://localhost:5173", "http://127.0.0.1:8080"];
const origins = new Set(
  [...e.CORS_ORIGINS.split(","), new URL(e.CLIENT_URL).origin, ...(e.NODE_ENV === "production" ? [] : defaultOrigins)]
    .map((s) => s.trim())
    .filter(Boolean),
);

export const env = {
  ...e,
  isProd: e.NODE_ENV === "production",
  isTest: e.NODE_ENV === "test",
  corsOrigins: [...origins],
};
