import { describe, expect, it } from "vitest";
import { applyVoiceDraft, classificationToDraft, getFirstIncompleteStep, getVoiceBookingCompleteness, resolveSkills } from "./classification";
import type { JobCreationFormState, ServiceSkill } from "@/features/jobs/types";

describe("voice booking skill resolution", () => {
  const skills: ServiceSkill[] = [
    { id: "pipe-id", name: "Pipe Leak Repair", slug: "pipe-leak-repair", categoryId: "plumbing" },
    { id: "tap-id", name: "Tap Installation", slug: "tap-installation", categoryId: "plumbing" },
  ];

  it("uses only backend skill IDs and never fabricates one", () => {
    expect(resolveSkills(["leak repair", "unknown task"], skills).map((skill) => skill.id)).toEqual(["pipe-id"]);
  });

  it("leaves requirements empty when there is no safe match", () => {
    expect(resolveSkills(["electrical rewiring"], skills)).toEqual([]);
  });

  it("turns the kitchen-sink voice request into an API-ready plumbing review", () => {
    const draft = classificationToDraft({
      transcript: "Book a plumber, my kitchen sink is leaking today.",
      category: { id: "plumbing-id", name: "Plumbing", slug: "plumbing" },
      skills: [skills[0]!],
      confidenceState: "READY",
      classification: {
        categorySlug: "plumbing", suggestedSkills: ["leak repair"], confidence: 0.9,
        title: "Book a plumber, my kitchen sink is leaking today.", description: "My kitchen sink is leaking.", timingIntent: "TODAY", urgency: "TODAY",
      },
    }, { id: "home", label: "Home", addressLine: "12 Palm Road", city: "Mumbai", state: "Maharashtra", pincode: "400001", coordinates: [72.88, 19.07], isDefault: true });
    const blank: JobCreationFormState = { categoryId: "", requiredSkills: [], title: "", description: "", urgency: "FLEXIBLE", timingOption: "ASAP", scheduledAt: "", addressLine: "", locality: "", city: "", state: "", pincode: "", images: [] };
    const form = applyVoiceDraft(blank, draft);

    expect(form).toMatchObject({ source: "VOICE", categoryId: "plumbing-id", requiredSkills: ["pipe-id"], title: "Kitchen sink leaking", timingOption: "TODAY", addressLine: "12 Palm Road" });
    expect(getVoiceBookingCompleteness(form).canReview).toBe(true);
    expect(getFirstIncompleteStep(form)).toBe(6);
  });

  it("asks only for the problem when voice selected a category and the default address exists", () => {
    const form: JobCreationFormState = { categoryId: "plumbing-id", requiredSkills: [], title: "", description: "", urgency: "FLEXIBLE", timingOption: "ASAP", scheduledAt: "", addressLine: "12 Palm Road", locality: "Mumbai", city: "Mumbai", state: "Maharashtra", pincode: "400001", latitude: 19.07, longitude: 72.88, images: [], source: "VOICE" };
    expect(getVoiceBookingCompleteness(form).missing).toEqual(["problem"]);
    expect(getFirstIncompleteStep(form)).toBe(2);
  });

  it("does not mistake a bare service request for a completed problem", () => {
    const draft = classificationToDraft({
      transcript: "Book a plumber.", category: { id: "plumbing-id", name: "Plumbing", slug: "plumbing" }, skills: [], confidenceState: "READY",
      classification: { categorySlug: "plumbing", suggestedSkills: [], confidence: 0.9 },
    });
    expect(draft).toMatchObject({ source: "VOICE", categoryId: "plumbing-id", title: "", description: "", timingOption: "ASAP" });
  });
});
