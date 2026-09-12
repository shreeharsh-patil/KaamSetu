import { describe, it, expect } from "vitest";
import { ApiError } from "./errors";

describe("ApiError class", () => {
  it("creates an instance with message and status", () => {
    const error = new ApiError("Validation failed", 422, "VALIDATION_ERROR");
    expect(error.message).toBe("Validation failed");
    expect(error.status).toBe(422);
    expect(error.code).toBe("VALIDATION_ERROR");
  });

  it("correctly identifies unauthorized errors", () => {
    const error = new ApiError("Session expired", 401, "UNAUTHORIZED");
    expect(error.isUnauthorized()).toBe(true);
    expect(error.isForbidden()).toBe(false);
  });

  it("correctly identifies not found errors", () => {
    const error = new ApiError("Job not found", 404, "NOT_FOUND");
    expect(error.isNotFound()).toBe(true);
  });

  it("correctly identifies validation errors", () => {
    const error = new ApiError("Invalid phone", 422, "VALIDATION_ERROR", {
      fieldErrors: [{ field: "phone", message: "Invalid format" }],
    });
    const details = error.details as { fieldErrors?: unknown[] };
    expect(details?.fieldErrors?.length).toBe(1);
  });
});
