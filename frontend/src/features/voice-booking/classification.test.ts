import { describe, expect, it } from "vitest";
import { resolveSkills } from "./classification";

describe("voice booking skill resolution", () => {
  const skills = [
    { id: "pipe-id", name: "Pipe Leak Repair", slug: "pipe-leak-repair", categoryId: "plumbing" },
    { id: "tap-id", name: "Tap Installation", slug: "tap-installation", categoryId: "plumbing" },
  ];

  it("uses only backend skill IDs and never fabricates one", () => {
    expect(resolveSkills(["leak repair", "unknown task"], skills).map((skill) => skill.id)).toEqual(["pipe-id"]);
  });

  it("leaves requirements empty when there is no safe match", () => {
    expect(resolveSkills(["electrical rewiring"], skills)).toEqual([]);
  });
});
