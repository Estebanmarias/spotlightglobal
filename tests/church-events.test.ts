import { describe, expect, it } from "vitest";
import { eventRegistrationStatus, isEventActive, nextWeeklyOccurrence, resolveEventOccurrence } from "../lib/church-events";

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

  it("distinguishes closed registration from unavailable registration", () => {
    const base = { event_date: "2026-11-08", event_end_date: null };
    expect(eventRegistrationStatus({ ...base, registration_enabled: false, registration_deadline: "2026-11-02" }, "2026-11-02")).toBe("closed");
    expect(eventRegistrationStatus({ ...base, registration_enabled: false, registration_deadline: null }, "2026-11-02")).toBe("unavailable");
  });

  it("smoke-tests the public event lifecycle", () => {
    const open = { event_date: "2026-11-08", event_end_date: "2026-11-08", registration_enabled: true, registration_deadline: "2026-11-07" };
    const closed = { ...open, registration_enabled: false, registration_deadline: "2026-11-02" };
    expect(eventRegistrationStatus(open, "2026-11-02")).toBe("open");
    expect(eventRegistrationStatus(closed, "2026-11-02")).toBe("closed");
    expect(isEventActive(closed, "2026-11-02")).toBe(true);
  });
});
