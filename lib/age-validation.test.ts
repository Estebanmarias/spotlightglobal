import { describe, expect, it } from "vitest";
import { validateMemberDateOfBirth } from "./age-validation";

describe("member age validation", () => {
  it("rejects people younger than fifteen", () => {
    expect(validateMemberDateOfBirth("2015-11-03")).toContain("at least 15");
  });

  it("accepts a realistic adult date of birth", () => {
    expect(validateMemberDateOfBirth("1990-06-12")).toBeNull();
  });
});
