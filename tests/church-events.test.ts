import { describe, expect, it } from "vitest";
import { isEventActive, nextWeeklyOccurrence, resolveEventOccurrence } from "../lib/church-events";

describe("recurring church events", () => {
  it("moves a weekly Sunday service to the next Sunday", () => {
    expect(nextWeeklyOccurrence("2026-10-25", "2026-11-02")).toBe("2026-11-08");
  });

  it("keeps a weekly event active after its original date", () => {
    const event = { event_date: "2026-10-25", event_end_date: null, recurrence: "weekly" as const };
    expect(isEventActive(event, "2026-11-02")).toBe(true);
    expect(resolveEventOccurrence(event, "2026-11-02").event_date).toBe("2026-11-08");
  });

  it("respects an explicit recurring end date", () => {
    const event = { event_date: "2026-10-25", event_end_date: "2026-10-31", recurrence: "weekly" as const };
    expect(isEventActive(event, "2026-11-02")).toBe(false);
  });
});
