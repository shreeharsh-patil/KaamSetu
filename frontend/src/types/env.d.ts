declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_URL: string;
    NEXT_PUBLIC_APP_URL: string;
    NEXT_PUBLIC_SOCKET_URL: string;
    NEXT_PUBLIC_MAP_PROVIDER?: "osm" | "mapbox" | "google";
    NEXT_PUBLIC_SENTRY_DSN?: string;
    NODE_ENV: "development" | "production" | "test";
  }
}
