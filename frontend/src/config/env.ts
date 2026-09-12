import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string()
    .url("NEXT_PUBLIC_API_URL must be a valid URL")
    .default("http://localhost:5000/api/v1"),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL")
    .default("http://localhost:3000"),
  NEXT_PUBLIC_SOCKET_URL: z
    .string()
    .url("NEXT_PUBLIC_SOCKET_URL must be a valid URL")
    .default("http://localhost:5000"),
  NEXT_PUBLIC_MAP_PROVIDER: z
    .enum(["osm", "mapbox", "google"])
    .default("osm"),
  NEXT_PUBLIC_SENTRY_DSN: z
    .string()
    .optional()
    .default(""),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

function getRawEnv() {
  const vercelAppUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : undefined;

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    "http://localhost:5000/api/v1";

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    vercelAppUrl ||
    "http://localhost:3000";

  const socketUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    "http://localhost:5000";

  if (process.env.NODE_ENV === "production") {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      console.warn(
        "⚠️ Warning: NEXT_PUBLIC_API_URL is not set. Falling back to default during build."
      );
    }
    if (!process.env.NEXT_PUBLIC_APP_URL && !vercelAppUrl) {
      console.warn(
        "⚠️ Warning: NEXT_PUBLIC_APP_URL is not set. Falling back to default during build."
      );
    }
  }

  return {
    NEXT_PUBLIC_API_URL: apiUrl,
    NEXT_PUBLIC_APP_URL: appUrl,
    NEXT_PUBLIC_SOCKET_URL: socketUrl,
    NEXT_PUBLIC_MAP_PROVIDER: process.env.NEXT_PUBLIC_MAP_PROVIDER || "osm",
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
    NODE_ENV: process.env.NODE_ENV || "development",
  };
}

const parsed = envSchema.safeParse(getRawEnv());

if (!parsed.success) {
  console.error(
    "Invalid environment variables configuration:",
    parsed.error.flatten().fieldErrors
  );
  throw new Error(
    "Invalid environment variables. Check .env.example and configure environment variables in project settings."
  );
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
