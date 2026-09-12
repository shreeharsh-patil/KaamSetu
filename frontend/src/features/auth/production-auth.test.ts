import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("production authentication boundary", () => {
  it("does not load offline auth mocks or persist access tokens", () => {
    const client = readFileSync(new URL("../../lib/api/client.ts", import.meta.url), "utf8");
    const authContext = readFileSync(new URL("./auth-context.tsx", import.meta.url), "utf8");
    expect(client).not.toContain("mock-fallback");
    expect(client).not.toContain("handleOfflineMockResponse");
    expect(authContext).not.toContain("kaamsetu_token");
    expect(authContext).not.toContain("localStorage.setItem");
  });
});
