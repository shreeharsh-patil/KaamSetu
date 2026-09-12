import { describe, expect, it } from "vitest";
import { mapApiOfferToView, mapJobCreationFormToApi } from "./mappers";

describe("job API contracts", () => {
  it("maps form state to the backend schema with real ids and [longitude, latitude]", () => {
    const now = new Date("2026-09-12T08:00:00.000Z");
    const request = mapJobCreationFormToApi({
      categoryId: "507f1f77bcf86cd799439011",
      requiredSkills: ["507f1f77bcf86cd799439012"],
      title: "Repair leaking kitchen pipe",
      description: "The pipe below the sink is leaking.",
      urgency: "TODAY",
      timingOption: "ASAP",
      addressLine: "Flat 4, Green House",
      locality: "Andheri West",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400053",
      longitude: 72.836,
      latitude: 19.136,
      images: [{ key: "uploads/job_image/user/image.jpg", mimeType: "image/jpeg" }],
    }, now);

    expect(request.categoryId).toMatch(/^[a-f0-9]{24}$/);
    expect(request.urgency).toBe("TODAY");
    expect(request.location).toEqual({ type: "Point", coordinates: [72.836, 19.136] });
    expect(request.address).toEqual({ line: "Flat 4, Green House, Andheri West", city: "Mumbai", state: "Maharashtra", pincode: "400053" });
    expect(new Date(request.preferredTime).getTime()).toBeGreaterThan(now.getTime());
    expect(request.images[0]?.key).not.toMatch(/^blob:/);
  });

  it("maps the sanitized worker offer without requiring private address fields", () => {
    const offer = mapApiOfferToView({
      id: "offer", jobId: "job", distanceKm: 2.4, matchScore: 91, status: "PENDING",
      expiresAt: "2026-09-12T09:00:00.000Z", createdAt: "2026-09-12T08:00:00.000Z",
      job: { category: { id: "cat", name: "Plumbing", slug: "plumbing" }, title: "Leaking pipe", description: "Under the kitchen sink", urgency: "TODAY", approximateLocality: "Mumbai", preferredTime: "2026-09-12T10:00:00.000Z", estimatedAmount: 500 },
    });
    expect(offer.approximateLocality).toBe("Mumbai");
    expect(offer).not.toHaveProperty("location");
    expect(offer).not.toHaveProperty("customer");
  });
});
