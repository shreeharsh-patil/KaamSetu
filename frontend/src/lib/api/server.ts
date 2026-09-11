import { cookies } from "next/headers";
import { apiClient, type RequestOptions } from "./client";

/**
 * Helper to execute API requests from Next.js Server Components, forwarding incoming cookies.
 */
export async function serverApiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const headers = new Headers(options.headers);
  if (cookieHeader) {
    headers.set("Cookie", cookieHeader);
  }

  return apiClient<T>(endpoint, {
    ...options,
    headers,
  });
}
