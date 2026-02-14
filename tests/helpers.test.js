import { describe, it, expect, beforeEach } from "vitest";

// Load the IIFE module in test mode
const ljm = require("../content.js");

describe("escapeHtml", () => {
  it("escapes angle brackets", () => {
    expect(ljm.escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert('xss')&lt;/script&gt;"
    );
  });

  it("escapes ampersands", () => {
    expect(ljm.escapeHtml("foo & bar")).toBe("foo &amp; bar");
  });

  it("preserves quotes (textContent approach does not escape them)", () => {
    expect(ljm.escapeHtml('"hello"')).toBe('"hello"');
  });

  it("returns empty string for empty input", () => {
    expect(ljm.escapeHtml("")).toBe("");
  });

  it("passes through safe strings unchanged", () => {
    expect(ljm.escapeHtml("Hello World 123")).toBe("Hello World 123");
  });
});

describe("haversineKm", () => {
  it("returns 0 for same point", () => {
    expect(ljm.haversineKm(41.0, 29.0, 41.0, 29.0)).toBe(0);
  });

  it("calculates Istanbul to Ankara roughly 350km", () => {
    const km = ljm.haversineKm(41.0082, 28.9784, 39.9334, 32.8597);
    expect(km).toBeGreaterThan(300);
    expect(km).toBeLessThan(400);
  });

  it("calculates short distances accurately", () => {
    // ~1km apart
    const km = ljm.haversineKm(41.0, 29.0, 41.009, 29.0);
    expect(km).toBeGreaterThan(0.9);
    expect(km).toBeLessThan(1.1);
  });
});

describe("formatDistance", () => {
  it("formats meters for distances under 1km", () => {
    expect(ljm.formatDistance(0.5)).toBe("500 m");
  });

  it("formats km for distances over 1km", () => {
    expect(ljm.formatDistance(5.3)).toBe("5.3 km");
  });

  it("formats zero correctly", () => {
    expect(ljm.formatDistance(0)).toBe("0 m");
  });
});

describe("estimateCommuteMin", () => {
  it("returns 0 for null/zero distance", () => {
    expect(ljm.estimateCommuteMin(0)).toBe(0);
    expect(ljm.estimateCommuteMin(null)).toBe(0);
  });

  it("uses urban rate for very short distances (<=2km)", () => {
    const mins = ljm.estimateCommuteMin(1);
    expect(mins).toBe(13); // 1*8 + 5
  });

  it("uses suburban rate for medium distances (5-15km)", () => {
    const mins = ljm.estimateCommuteMin(10);
    expect(mins).toBe(15); // 10*1.5
  });

  it("uses highway rate for long distances (>30km)", () => {
    const mins = ljm.estimateCommuteMin(50);
    expect(mins).toBe(50); // 50*1.0
  });

  it("never returns negative values", () => {
    expect(ljm.estimateCommuteMin(-5)).toBe(0);
  });
});

describe("getWorkplaceType", () => {
  it("returns ONSITE (1) for empty array", () => {
    expect(ljm.getWorkplaceType([])).toBe(1);
  });

  it("returns ONSITE (1) for null", () => {
    expect(ljm.getWorkplaceType(null)).toBe(1);
  });

  it("parses remote type (2)", () => {
    expect(ljm.getWorkplaceType(["urn:li:fs_workplaceType:2"])).toBe(2);
  });

  it("parses hybrid type (3)", () => {
    expect(ljm.getWorkplaceType(["urn:li:fs_workplaceType:3"])).toBe(3);
  });
});

describe("timeAgo", () => {
  it("returns empty for null", () => {
    expect(ljm.timeAgo(null)).toBe("");
  });

  it("returns 'Just now' for recent timestamps", () => {
    expect(ljm.timeAgo(Date.now())).toBe("Just now");
  });

  it("returns minutes ago", () => {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    expect(ljm.timeAgo(fiveMinAgo)).toBe("5m ago");
  });

  it("returns hours ago", () => {
    const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
    expect(ljm.timeAgo(threeHoursAgo)).toBe("3h ago");
  });

  it("returns days ago", () => {
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
    expect(ljm.timeAgo(twoDaysAgo)).toBe("2d ago");
  });

  it("returns weeks ago", () => {
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    expect(ljm.timeAgo(twoWeeksAgo)).toBe("2w ago");
  });
});

describe("buildAddressString", () => {
  it("returns null for null input", () => {
    expect(ljm.buildAddressString(null)).toBeNull();
  });

  it("returns null for empty address", () => {
    expect(ljm.buildAddressString({ address: {} })).toBeNull();
  });

  it("builds full address string", () => {
    const loc = {
      address: {
        line1: "Teknopark Istanbul",
        city: "Istanbul",
        geographicArea: "Istanbul",
        postalCode: "34906",
        country: "TR"
      }
    };
    expect(ljm.buildAddressString(loc)).toBe(
      "Teknopark Istanbul, Istanbul, Istanbul, 34906, TR"
    );
  });

  it("handles partial address", () => {
    const loc = { address: { city: "Ankara", country: "TR" } };
    expect(ljm.buildAddressString(loc)).toBe("Ankara, TR");
  });
});

describe("extractGeoLocation", () => {
  it("returns null for null input", () => {
    expect(ljm.extractGeoLocation(null)).toBeNull();
  });

  it("extracts geoLocation", () => {
    const loc = { geoLocation: { latitude: 41.0, longitude: 29.0 } };
    expect(ljm.extractGeoLocation(loc)).toEqual({ lat: 41.0, lng: 29.0 });
  });

  it("extracts geographicLocation as fallback", () => {
    const loc = { geographicLocation: { latitude: 39.9, longitude: 32.8 } };
    expect(ljm.extractGeoLocation(loc)).toEqual({ lat: 39.9, lng: 32.8 });
  });

  it("returns null if no coordinates", () => {
    expect(ljm.extractGeoLocation({ address: {} })).toBeNull();
  });
});

describe("i18n t() function", () => {
  it("returns English translation by default", () => {
    expect(ljm.t("onSite")).toBe("On-site");
  });

  it("returns key if not found", () => {
    expect(ljm.t("nonExistentKey")).toBe("nonExistentKey");
  });

  it("substitutes parameters", () => {
    expect(ljm.t("minutesAgo", { n: 5 })).toBe("5m ago");
  });

  it("has all expected keys in both languages", () => {
    const enKeys = Object.keys(ljm.translations.en);
    const trKeys = Object.keys(ljm.translations.tr);
    enKeys.forEach((key) => {
      expect(trKeys).toContain(key);
    });
  });
});
