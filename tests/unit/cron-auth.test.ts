import { describe, expect, it } from "vitest";
import { isCronAuthorized } from "@/lib/cron-auth";

const SECRET = "a-long-enough-cron-secret-123";

describe("isCronAuthorized", () => {
  it("aksepte Bearer kòrèk", () => expect(isCronAuthorized(`Bearer ${SECRET}`, SECRET)).toBe(true));
  it("FAIL-CLOSED: san CRON_SECRET, 'Bearer undefined' pa pase", () => {
    expect(isCronAuthorized("Bearer undefined", undefined)).toBe(false);
    expect(isCronAuthorized("Bearer ", "")).toBe(false);
    expect(isCronAuthorized(null, undefined)).toBe(false);
  });
  it("rejte sekrè twò kout (pa sekirize)", () => expect(isCronAuthorized("Bearer short", "short")).toBe(false));
  it("rejte header ki manke, move oswa pa fòma Bearer", () => {
    expect(isCronAuthorized(null, SECRET)).toBe(false);
    expect(isCronAuthorized("Bearer wrong-wrong-wrong-wrong", SECRET)).toBe(false);
    expect(isCronAuthorized(SECRET, SECRET)).toBe(false);
    expect(isCronAuthorized(`bearer ${SECRET}`, SECRET)).toBe(false);
  });
});
