import { describe, expect, it } from "vitest";
import { attendanceChange, percentageChange } from "../lib/analytics-metrics";
import { acceptsDestructiveConfirmation, canAccessAdminPage } from "../lib/admin-permission-rules";
import { eventPriceLabel } from "../lib/event-display";
import { rateLimitDecision } from "../lib/public-rate-limit";
import { buildCsv } from "../lib/csv";

describe("analytics metrics", () => {
  it("calculates month growth as a rounded percentage", () => {
    expect(percentageChange(120, 100)).toBe(20);
    expect(percentageChange(80, 100)).toBe(-20);
  });

  it("avoids a misleading percentage when the previous period is empty", () => {
    expect(percentageChange(40, 0)).toBe(0);
  });

  it("compares the latest attendance with the previous service", () => {
    expect(attendanceChange(180, 165)).toBe(15);
    expect(attendanceChange(120, null)).toBeNull();
  });

  it("preserves admin access rules", () => {
    expect(canAccessAdminPage("super_admin", [], "settings", false)).toBe(true);
    expect(canAccessAdminPage("admin", ["analytics"], "analytics", false)).toBe(true);
    expect(canAccessAdminPage("admin", ["analytics"], "giving", false)).toBe(false);
    expect(canAccessAdminPage("admin", ["dashboard"], "dashboard", true)).toBe(false);
  });

  it("requires an exact destructive-action confirmation", () => {
    expect(acceptsDestructiveConfirmation("DELETE")).toBe(true);
    expect(acceptsDestructiveConfirmation(" DELETE ")).toBe(true);
    expect(acceptsDestructiveConfirmation("REMOVE")).toBe(false);
  });

  it("only labels registration-enabled free events as free", () => {
    expect(eventPriceLabel("free", true, 0, "NGN")).toBe("Free");
    expect(eventPriceLabel("free", false, 0, "NGN")).toBeNull();
    expect(eventPriceLabel("paid", true, 2500, "NGN")).toBe("NGN 2,500");
  });

  it("fails closed when production rate-limit configuration is missing", () => {
    expect(rateLimitDecision(false, false, true)).toEqual({ allowed: false, unavailable: true });
    expect(rateLimitDecision(false, false, false)).toEqual({ allowed: true, unavailable: true });
    expect(rateLimitDecision(false, true, true)).toEqual({ allowed: false, unavailable: false });
  });

  it("quotes CSV values containing commas, quotes, and new lines", () => {
    expect(buildCsv([["Name", "Notes"], ["Ada", 'Called, then said "yes"']]))
      .toBe('Name,Notes\r\nAda,"Called, then said ""yes"""');
  });
});
