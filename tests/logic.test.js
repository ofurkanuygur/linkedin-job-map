import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Load the IIFE module in test mode
const ljm = require("../content.js");

// ── Helper: reset all internal state between tests ──
beforeEach(() => {
  ljm._setMyLocation(null);
  ljm._setAllJobsById({});
  ljm._setFilterState({ onSite: true, hybrid: true, remote: true });
  ljm._setSortState("distance");
  ljm._setSearchQuery("");
  ljm._setCompanyNames({});
  ljm._setCompanyCache({});
  ljm._setCurrentLocale("en");
});

// ═══════════════════════════════════════════════════════════
// 1. debounce(fn, ms)
// ═══════════════════════════════════════════════════════════
describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("delays execution by the specified ms", () => {
    const fn = vi.fn();
    const debounced = ljm.debounce(fn, 200);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(199);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("only executes once for rapid successive calls", () => {
    const fn = vi.fn();
    const debounced = ljm.debounce(fn, 300);

    debounced();
    vi.advanceTimersByTime(100);
    debounced();
    vi.advanceTimersByTime(100);
    debounced();
    vi.advanceTimersByTime(100);
    debounced();

    // Only 300ms after the LAST call should it fire
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("cancel() stops pending execution", () => {
    const fn = vi.fn();
    const debounced = ljm.debounce(fn, 200);

    debounced();
    vi.advanceTimersByTime(100);
    debounced.cancel();

    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
  });

  it("can be called again after cancel", () => {
    const fn = vi.fn();
    const debounced = ljm.debounce(fn, 100);

    debounced();
    debounced.cancel();
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();

    debounced();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

// ═══════════════════════════════════════════════════════════
// 2. getCsrfToken()
// ═══════════════════════════════════════════════════════════
describe("getCsrfToken", () => {
  let originalCookie;

  beforeEach(() => {
    originalCookie = Object.getOwnPropertyDescriptor(document, "cookie") ||
                     Object.getOwnPropertyDescriptor(Document.prototype, "cookie");
  });

  afterEach(() => {
    // Restore original cookie descriptor
    if (originalCookie) {
      Object.defineProperty(document, "cookie", originalCookie);
    } else {
      delete document.cookie;
    }
  });

  function mockCookie(value) {
    Object.defineProperty(document, "cookie", {
      get: () => value,
      configurable: true
    });
  }

  it("extracts a normal JSESSIONID token", () => {
    mockCookie("other=xyz; JSESSIONID=abc123def; lang=en");
    expect(ljm.getCsrfToken()).toBe("abc123def");
  });

  it("handles token with '=' in the value (base64 padding)", () => {
    mockCookie("JSESSIONID=ajax:abc123==; other=val");
    expect(ljm.getCsrfToken()).toBe("ajax:abc123==");
  });

  it("strips quotes from token value", () => {
    mockCookie('JSESSIONID="token-value-123"');
    expect(ljm.getCsrfToken()).toBe("token-value-123");
  });

  it("returns empty string when JSESSIONID cookie is missing", () => {
    mockCookie("lang=en; theme=dark");
    expect(ljm.getCsrfToken()).toBe("");
  });

  it("returns empty string for empty cookie string", () => {
    mockCookie("");
    expect(ljm.getCsrfToken()).toBe("");
  });
});

// ═══════════════════════════════════════════════════════════
// 3. apiHeaders(csrf)
// ═══════════════════════════════════════════════════════════
describe("apiHeaders", () => {
  it("returns correct headers object with csrf-token", () => {
    const headers = ljm.apiHeaders("my-token-123");
    expect(headers).toEqual({
      "csrf-token": "my-token-123",
      "accept": "application/vnd.linkedin.normalized+json+2.1"
    });
  });

  it("sets csrf-token header to the provided value", () => {
    const headers = ljm.apiHeaders("xyz");
    expect(headers["csrf-token"]).toBe("xyz");
  });

  it("works with empty string csrf", () => {
    const headers = ljm.apiHeaders("");
    expect(headers["csrf-token"]).toBe("");
    expect(headers["accept"]).toBe("application/vnd.linkedin.normalized+json+2.1");
  });
});

// ═══════════════════════════════════════════════════════════
// 4. getWorkplaceLabel(wt)
// ═══════════════════════════════════════════════════════════
describe("getWorkplaceLabel", () => {
  it("returns 'Hybrid' for WORKPLACE_HYBRID (3)", () => {
    expect(ljm.getWorkplaceLabel(3)).toBe("Hybrid");
  });

  it("returns 'Remote' for WORKPLACE_REMOTE (2)", () => {
    expect(ljm.getWorkplaceLabel(2)).toBe("Remote");
  });

  it("returns 'On-site' for WORKPLACE_ONSITE (1)", () => {
    expect(ljm.getWorkplaceLabel(1)).toBe("On-site");
  });

  it("returns 'On-site' as default for unknown values", () => {
    expect(ljm.getWorkplaceLabel(99)).toBe("On-site");
    expect(ljm.getWorkplaceLabel(0)).toBe("On-site");
    expect(ljm.getWorkplaceLabel(null)).toBe("On-site");
    expect(ljm.getWorkplaceLabel(undefined)).toBe("On-site");
  });

  it("returns localized labels when locale is Turkish", () => {
    ljm._setCurrentLocale("tr");
    expect(ljm.getWorkplaceLabel(3)).toBe("Hibrit");
    expect(ljm.getWorkplaceLabel(2)).toBe("Uzaktan");
    expect(ljm.getWorkplaceLabel(1)).toBe("Yerinde");
  });
});

// ═══════════════════════════════════════════════════════════
// 5. detectLocale()
// ═══════════════════════════════════════════════════════════
describe("detectLocale", () => {
  let originalLanguage;

  beforeEach(() => {
    originalLanguage = navigator.language;
  });

  afterEach(() => {
    Object.defineProperty(navigator, "language", {
      value: originalLanguage,
      configurable: true,
      writable: true
    });
  });

  function setNavigatorLanguage(lang) {
    Object.defineProperty(navigator, "language", {
      value: lang,
      configurable: true,
      writable: true
    });
  }

  it("detects Turkish locale from 'tr'", () => {
    setNavigatorLanguage("tr");
    ljm.detectLocale();
    // Verify by checking a translated string
    expect(ljm.t("onSite")).toBe("Yerinde");
  });

  it("detects Turkish locale from 'tr-TR'", () => {
    setNavigatorLanguage("tr-TR");
    ljm.detectLocale();
    expect(ljm.t("remote")).toBe("Uzaktan");
  });

  it("detects English locale from 'en'", () => {
    setNavigatorLanguage("en");
    ljm.detectLocale();
    expect(ljm.t("onSite")).toBe("On-site");
  });

  it("detects English locale from 'en-US'", () => {
    setNavigatorLanguage("en-US");
    ljm.detectLocale();
    expect(ljm.t("onSite")).toBe("On-site");
  });

  it("falls back to English for unknown locale", () => {
    setNavigatorLanguage("fr-FR");
    ljm.detectLocale();
    expect(ljm.t("onSite")).toBe("On-site");
  });

  it("falls back to English for 'de'", () => {
    setNavigatorLanguage("de");
    ljm.detectLocale();
    expect(ljm.t("hybrid")).toBe("Hybrid");
  });
});

// ═══════════════════════════════════════════════════════════
// 6. getWtClass(wt)
// ═══════════════════════════════════════════════════════════
describe("getWtClass", () => {
  it("returns 'ljm-wt-hybrid' for 3", () => {
    expect(ljm.getWtClass(3)).toBe("ljm-wt-hybrid");
  });

  it("returns 'ljm-wt-remote' for 2", () => {
    expect(ljm.getWtClass(2)).toBe("ljm-wt-remote");
  });

  it("returns 'ljm-wt-onsite' for 1", () => {
    expect(ljm.getWtClass(1)).toBe("ljm-wt-onsite");
  });

  it("returns 'ljm-wt-onsite' as default for unknown values", () => {
    expect(ljm.getWtClass(0)).toBe("ljm-wt-onsite");
    expect(ljm.getWtClass(99)).toBe("ljm-wt-onsite");
    expect(ljm.getWtClass(null)).toBe("ljm-wt-onsite");
  });
});

// ═══════════════════════════════════════════════════════════
// 7. getTagClass(wt)
// ═══════════════════════════════════════════════════════════
describe("getTagClass", () => {
  it("returns 'ljm-tag-hybrid' for 3", () => {
    expect(ljm.getTagClass(3)).toBe("ljm-tag-hybrid");
  });

  it("returns 'ljm-tag-remote' for 2", () => {
    expect(ljm.getTagClass(2)).toBe("ljm-tag-remote");
  });

  it("returns 'ljm-tag-onsite' for 1", () => {
    expect(ljm.getTagClass(1)).toBe("ljm-tag-onsite");
  });

  it("returns 'ljm-tag-onsite' as default for unknown values", () => {
    expect(ljm.getTagClass(0)).toBe("ljm-tag-onsite");
    expect(ljm.getTagClass(99)).toBe("ljm-tag-onsite");
    expect(ljm.getTagClass(undefined)).toBe("ljm-tag-onsite");
  });
});

// ═══════════════════════════════════════════════════════════
// 8. getCommuteDisplay(job)
// ═══════════════════════════════════════════════════════════
describe("getCommuteDisplay", () => {
  it("returns N/A for remote jobs", () => {
    const result = ljm.getCommuteDisplay({ workplaceType: 2, lat: 41, lng: 29 });
    expect(result.text).toBe("N/A");
    expect(result.cls).toBe("ljm-commute-na");
  });

  it("returns '--' when no myLocation is set", () => {
    const result = ljm.getCommuteDisplay({ workplaceType: 1, lat: 41, lng: 29 });
    expect(result.text).toBe("--");
    expect(result.cls).toBe("ljm-commute-na");
  });

  it("returns commute-short class for short distances", () => {
    // Set myLocation very close to the job
    ljm._setMyLocation({ lat: 41.0, lng: 29.0 });
    const result = ljm.getCommuteDisplay({ workplaceType: 1, lat: 41.009, lng: 29.0 });
    expect(result.cls).toBe("ljm-commute-short");
    expect(result.km).toBeDefined();
    expect(result.mins).toBeDefined();
    expect(result.mins).toBeLessThanOrEqual(15);
  });

  it("returns commute-medium class for medium distances", () => {
    // ~15km apart
    ljm._setMyLocation({ lat: 41.0, lng: 29.0 });
    const result = ljm.getCommuteDisplay({ workplaceType: 1, lat: 41.135, lng: 29.0 });
    expect(result.cls).toBe("ljm-commute-medium");
    expect(result.mins).toBeGreaterThan(15);
    expect(result.mins).toBeLessThanOrEqual(40);
  });

  it("returns commute-long class for long distances", () => {
    // ~100km apart
    ljm._setMyLocation({ lat: 41.0, lng: 29.0 });
    const result = ljm.getCommuteDisplay({ workplaceType: 1, lat: 42.0, lng: 29.0 });
    expect(result.cls).toBe("ljm-commute-long");
    expect(result.mins).toBeGreaterThan(40);
  });

  it("returns object with text, cls, km, and mins for non-remote with location", () => {
    ljm._setMyLocation({ lat: 41.0, lng: 29.0 });
    const result = ljm.getCommuteDisplay({ workplaceType: 1, lat: 41.05, lng: 29.05 });
    expect(result).toHaveProperty("text");
    expect(result).toHaveProperty("cls");
    expect(result).toHaveProperty("km");
    expect(result).toHaveProperty("mins");
    expect(typeof result.km).toBe("number");
    expect(typeof result.mins).toBe("number");
  });

  it("text contains 'min' for non-remote with location", () => {
    ljm._setMyLocation({ lat: 41.0, lng: 29.0 });
    const result = ljm.getCommuteDisplay({ workplaceType: 1, lat: 41.1, lng: 29.1 });
    expect(result.text).toContain("min");
  });
});

// ═══════════════════════════════════════════════════════════
// 9. findBestAddress(companyData, jobLocation)
// ═══════════════════════════════════════════════════════════
describe("findBestAddress", () => {
  it("returns null for null companyData", () => {
    expect(ljm.findBestAddress(null, "Istanbul, TR")).toBeNull();
  });

  it("returns matching city address from confirmedLocations", () => {
    const companyData = {
      confirmedLocations: [
        { address: { city: "Istanbul", country: "TR", line1: "Levent" } },
        { address: { city: "Ankara", country: "TR", line1: "Cankaya" } }
      ],
      groupedLocationsByCountry: [],
      headquarter: null
    };
    const result = ljm.findBestAddress(companyData, "Istanbul, TR");
    expect(result).not.toBeNull();
    expect(result.address).toContain("Istanbul");
  });

  it("returns matching city from groupedLocationsByCountry", () => {
    const companyData = {
      confirmedLocations: [],
      groupedLocationsByCountry: [{
        locations: [
          { address: { city: "Ankara", country: "TR" } },
          { address: { city: "Istanbul", country: "TR", line1: "Maslak" } }
        ]
      }],
      headquarter: null
    };
    const result = ljm.findBestAddress(companyData, "Istanbul, TR");
    expect(result).not.toBeNull();
    expect(result.address).toContain("Istanbul");
  });

  it("returns headquarter when no matching city found", () => {
    const companyData = {
      confirmedLocations: [
        { address: { city: "Berlin", country: "DE" } }
      ],
      groupedLocationsByCountry: [],
      headquarter: {
        address: { city: "San Francisco", country: "US", line1: "HQ Street" }
      }
    };
    const result = ljm.findBestAddress(companyData, "Istanbul, TR");
    expect(result).not.toBeNull();
    expect(result.address).toContain("San Francisco");
  });

  it("returns null when no headquarter and no matching city", () => {
    const companyData = {
      confirmedLocations: [
        { address: { city: "Berlin", country: "DE" } }
      ],
      groupedLocationsByCountry: [],
      headquarter: null
    };
    const result = ljm.findBestAddress(companyData, "Istanbul, TR");
    expect(result).toBeNull();
  });

  it("handles partial city match (indexOf)", () => {
    const companyData = {
      confirmedLocations: [
        { address: { city: "Istanbul European Side", country: "TR" } }
      ],
      groupedLocationsByCountry: [],
      headquarter: null
    };
    // "istanbul" is found within "istanbul european side"
    const result = ljm.findBestAddress(companyData, "Istanbul, TR");
    expect(result).not.toBeNull();
    expect(result.address).toContain("Istanbul European Side");
  });

  it("includes geo coordinates when available", () => {
    const companyData = {
      confirmedLocations: [
        {
          address: { city: "Istanbul", country: "TR" },
          geoLocation: { latitude: 41.0, longitude: 29.0 }
        }
      ],
      groupedLocationsByCountry: [],
      headquarter: null
    };
    const result = ljm.findBestAddress(companyData, "Istanbul, TR");
    expect(result.geo).toEqual({ lat: 41.0, lng: 29.0 });
  });

  it("includes country code", () => {
    const companyData = {
      confirmedLocations: [
        { address: { city: "Istanbul", country: "TR" } }
      ],
      groupedLocationsByCountry: [],
      headquarter: null
    };
    const result = ljm.findBestAddress(companyData, "Istanbul, TR");
    expect(result.country).toBe("TR");
  });

  it("handles empty jobLocation gracefully", () => {
    const companyData = {
      confirmedLocations: [],
      groupedLocationsByCountry: [],
      headquarter: { address: { city: "HQ City", country: "US" } }
    };
    const result = ljm.findBestAddress(companyData, "");
    expect(result).not.toBeNull();
    expect(result.address).toContain("HQ City");
  });
});

// ═══════════════════════════════════════════════════════════
// 10. getProximityHint()
// ═══════════════════════════════════════════════════════════
describe("getProximityHint", () => {
  it("returns myLocation when set", () => {
    ljm._setMyLocation({ lat: 41.0, lng: 29.0 });
    const hint = ljm.getProximityHint();
    expect(hint).toEqual({ lat: 41.0, lng: 29.0 });
  });

  it("returns centroid of existing jobs when no myLocation", () => {
    ljm._setAllJobsById({
      "1": { jobId: "1", lat: 40.0, lng: 28.0 },
      "2": { jobId: "2", lat: 42.0, lng: 30.0 }
    });
    const hint = ljm.getProximityHint();
    expect(hint.lat).toBeCloseTo(41.0, 1);
    expect(hint.lng).toBeCloseTo(29.0, 1);
  });

  it("returns null when no jobs and no location", () => {
    expect(ljm.getProximityHint()).toBeNull();
  });

  it("prefers myLocation over job centroid", () => {
    ljm._setMyLocation({ lat: 10.0, lng: 20.0 });
    ljm._setAllJobsById({
      "1": { jobId: "1", lat: 40.0, lng: 28.0 }
    });
    const hint = ljm.getProximityHint();
    expect(hint).toEqual({ lat: 10.0, lng: 20.0 });
  });

  it("skips jobs without lat/lng when computing centroid", () => {
    ljm._setAllJobsById({
      "1": { jobId: "1", lat: 40.0, lng: 28.0 },
      "2": { jobId: "2" },
      "3": { jobId: "3", lat: 42.0, lng: 30.0 }
    });
    const hint = ljm.getProximityHint();
    expect(hint.lat).toBeCloseTo(41.0, 1);
    expect(hint.lng).toBeCloseTo(29.0, 1);
  });

  it("returns null when all jobs lack coordinates", () => {
    ljm._setAllJobsById({
      "1": { jobId: "1" },
      "2": { jobId: "2" }
    });
    expect(ljm.getProximityHint()).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════
// 11. getFilteredJobs()
// ═══════════════════════════════════════════════════════════
describe("getFilteredJobs", () => {
  const sampleJobs = {
    "1": {
      jobId: "1", title: "Frontend Developer", company: "Acme Corp",
      location: "Istanbul, TR", workplaceType: 1, lat: 41.0, lng: 29.0,
      listedAt: Date.now() - 86400000 // 1 day ago
    },
    "2": {
      jobId: "2", title: "Backend Engineer", company: "Beta Inc",
      location: "Ankara, TR", workplaceType: 2, lat: 39.9, lng: 32.8,
      listedAt: Date.now() - 172800000 // 2 days ago
    },
    "3": {
      jobId: "3", title: "DevOps Engineer", company: "Gamma LLC",
      location: "Izmir, TR", workplaceType: 3, lat: 38.4, lng: 27.1,
      listedAt: Date.now() - 3600000 // 1 hour ago
    },
    "4": {
      jobId: "4", title: "Product Manager", company: "Acme Corp",
      location: "Istanbul, TR", workplaceType: 1, lat: 41.1, lng: 29.1,
      listedAt: Date.now() // just now
    }
  };

  beforeEach(() => {
    ljm._setAllJobsById(JSON.parse(JSON.stringify(sampleJobs)));
    ljm._setFilterState({ onSite: true, hybrid: true, remote: true });
    ljm._setSortState("distance");
    ljm._setSearchQuery("");
  });

  // ── Filter tests ──

  it("returns all jobs when all filters are on", () => {
    const result = ljm.getFilteredJobs();
    expect(result).toHaveLength(4);
  });

  it("filters out on-site jobs when onSite filter disabled", () => {
    ljm._setFilterState({ onSite: false, hybrid: true, remote: true });
    const result = ljm.getFilteredJobs();
    expect(result).toHaveLength(2);
    result.forEach((job) => {
      expect(job.workplaceType).not.toBe(1);
    });
  });

  it("filters out remote jobs when remote filter disabled", () => {
    ljm._setFilterState({ onSite: true, hybrid: true, remote: false });
    const result = ljm.getFilteredJobs();
    expect(result).toHaveLength(3);
    result.forEach((job) => {
      expect(job.workplaceType).not.toBe(2);
    });
  });

  it("filters out hybrid jobs when hybrid filter disabled", () => {
    ljm._setFilterState({ onSite: true, hybrid: false, remote: true });
    const result = ljm.getFilteredJobs();
    expect(result).toHaveLength(3);
    result.forEach((job) => {
      expect(job.workplaceType).not.toBe(3);
    });
  });

  it("returns empty array when all filters disabled", () => {
    ljm._setFilterState({ onSite: false, hybrid: false, remote: false });
    const result = ljm.getFilteredJobs();
    expect(result).toHaveLength(0);
  });

  // ── Search tests ──

  it("searches by title (case-insensitive)", () => {
    ljm._setSearchQuery("frontend");
    const result = ljm.getFilteredJobs();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Frontend Developer");
  });

  it("searches by company (case-insensitive)", () => {
    ljm._setSearchQuery("acme");
    const result = ljm.getFilteredJobs();
    expect(result).toHaveLength(2);
    result.forEach((job) => {
      expect(job.company).toBe("Acme Corp");
    });
  });

  it("searches by location (case-insensitive)", () => {
    ljm._setSearchQuery("ankara");
    const result = ljm.getFilteredJobs();
    expect(result).toHaveLength(1);
    expect(result[0].location).toContain("Ankara");
  });

  it("returns empty when search has no matches", () => {
    ljm._setSearchQuery("nonexistent");
    const result = ljm.getFilteredJobs();
    expect(result).toHaveLength(0);
  });

  // ── Sort tests ──

  it("sorts by company alphabetically", () => {
    ljm._setSortState("company");
    const result = ljm.getFilteredJobs();
    expect(result[0].company).toBe("Acme Corp");
    expect(result[1].company).toBe("Acme Corp");
    expect(result[2].company).toBe("Beta Inc");
    expect(result[3].company).toBe("Gamma LLC");
  });

  it("sorts by type (numeric ascending)", () => {
    ljm._setSortState("type");
    const result = ljm.getFilteredJobs();
    // onsite (1), onsite (1), remote (2), hybrid (3)
    expect(result[0].workplaceType).toBe(1);
    expect(result[1].workplaceType).toBe(1);
    expect(result[2].workplaceType).toBe(2);
    expect(result[3].workplaceType).toBe(3);
  });

  it("sorts by date (newest first)", () => {
    ljm._setSortState("date");
    const result = ljm.getFilteredJobs();
    expect(result[0].jobId).toBe("4"); // just now
    expect(result[1].jobId).toBe("3"); // 1 hour ago
    expect(result[2].jobId).toBe("1"); // 1 day ago
    expect(result[3].jobId).toBe("2"); // 2 days ago
  });

  it("sorts by distance when myLocation is set", () => {
    ljm._setMyLocation({ lat: 41.0, lng: 29.0 }); // Istanbul
    ljm._setSortState("distance");
    const result = ljm.getFilteredJobs();
    // Istanbul (41,29) -> closest first
    expect(result[0].jobId).toBe("1"); // exact location
    expect(result[1].jobId).toBe("4"); // very close
    // Ankara and Izmir are further
  });

  // ── Combined filter + search ──

  it("combines filters and search correctly", () => {
    ljm._setFilterState({ onSite: true, hybrid: false, remote: false });
    ljm._setSearchQuery("frontend");
    const result = ljm.getFilteredJobs();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Frontend Developer");
    expect(result[0].workplaceType).toBe(1);
  });

  it("filter disabling takes precedence over search match", () => {
    // Backend Engineer is remote (type 2), disable remote
    ljm._setFilterState({ onSite: true, hybrid: true, remote: false });
    ljm._setSearchQuery("backend");
    const result = ljm.getFilteredJobs();
    expect(result).toHaveLength(0);
  });

  it("handles empty allJobsById", () => {
    ljm._setAllJobsById({});
    const result = ljm.getFilteredJobs();
    expect(result).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════
// 12. buildPopup(job)
// ═══════════════════════════════════════════════════════════
describe("buildPopup", () => {
  const baseJob = {
    jobId: "12345",
    title: "Software Engineer",
    company: "Test Corp",
    location: "Istanbul, TR",
    address: "Levent, Istanbul, TR",
    hasPreciseAddress: true,
    workplaceType: 1,
    lat: 41.0,
    lng: 29.0,
    listedAt: null,
    logoUrl: null
  };

  it("returns HTML string with escaped title", () => {
    const job = { ...baseJob, title: "<b>Bold</b>" };
    const html = ljm.buildPopup(job);
    expect(html).toContain("&lt;b&gt;Bold&lt;/b&gt;");
    expect(html).not.toContain("<b>Bold</b>");
  });

  it("returns HTML with escaped company name", () => {
    const job = { ...baseJob, company: "Foo & Bar <Inc>" };
    const html = ljm.buildPopup(job);
    expect(html).toContain("Foo &amp; Bar &lt;Inc&gt;");
  });

  it("uses correct workplace badge class for on-site", () => {
    const html = ljm.buildPopup({ ...baseJob, workplaceType: 1 });
    expect(html).toContain("ljm-wt-onsite");
  });

  it("uses correct workplace badge class for remote", () => {
    const html = ljm.buildPopup({ ...baseJob, workplaceType: 2 });
    expect(html).toContain("ljm-wt-remote");
  });

  it("uses correct workplace badge class for hybrid", () => {
    const html = ljm.buildPopup({ ...baseJob, workplaceType: 3 });
    expect(html).toContain("ljm-wt-hybrid");
  });

  it("links use sanitized jobId", () => {
    const job = { ...baseJob, jobId: "abc-123!@#" };
    const html = ljm.buildPopup(job);
    // sanitized: only alphanumeric
    expect(html).toContain("linkedin.com/jobs/view/abc123");
    expect(html).not.toContain("abc-123!@#");
  });

  it("generates Google Maps URL with valid coordinates", () => {
    const html = ljm.buildPopup(baseJob);
    expect(html).toContain("google.com/maps/dir/");
    expect(html).toContain("destination=41,29");
  });

  it("generates Google Maps URL without myLocation (destination only)", () => {
    ljm._setMyLocation(null);
    const html = ljm.buildPopup(baseJob);
    expect(html).toContain("destination=41,29");
    expect(html).not.toContain("origin=");
  });

  it("generates Google Maps URL with myLocation (origin + destination)", () => {
    ljm._setMyLocation({ lat: 40.0, lng: 28.0 });
    const html = ljm.buildPopup(baseJob);
    expect(html).toContain("origin=40,28");
    expect(html).toContain("destination=41,29");
  });

  it("includes logo HTML when logoUrl present", () => {
    const job = { ...baseJob, logoUrl: "https://example.com/logo.png" };
    const html = ljm.buildPopup(job);
    expect(html).toContain("ljm-popup-logo");
    expect(html).toContain("https://example.com/logo.png");
  });

  it("excludes logo HTML when logoUrl absent", () => {
    const job = { ...baseJob, logoUrl: null };
    const html = ljm.buildPopup(job);
    expect(html).not.toContain("ljm-popup-logo");
  });

  it("shows posted time when listedAt present", () => {
    const job = { ...baseJob, listedAt: Date.now() - 3600000 }; // 1 hour ago
    const html = ljm.buildPopup(job);
    expect(html).toContain("ljm-popup-time");
    expect(html).toContain("Posted");
  });

  it("does not show posted time when listedAt absent", () => {
    const job = { ...baseJob, listedAt: null };
    const html = ljm.buildPopup(job);
    expect(html).not.toContain("ljm-popup-time");
  });

  it("shows distance display when myLocation is set for non-remote job", () => {
    ljm._setMyLocation({ lat: 40.0, lng: 28.0 });
    const job = { ...baseJob, workplaceType: 1 };
    const html = ljm.buildPopup(job);
    expect(html).toContain("ljm-popup-distance");
    expect(html).toContain("away");
  });

  it("does not show distance for remote jobs even with myLocation", () => {
    ljm._setMyLocation({ lat: 40.0, lng: 28.0 });
    const job = { ...baseJob, workplaceType: 2 };
    const html = ljm.buildPopup(job);
    expect(html).not.toContain("ljm-popup-distance");
  });

  it("uses address when hasPreciseAddress is true", () => {
    const job = { ...baseJob, hasPreciseAddress: true, address: "Precise Addr" };
    const html = ljm.buildPopup(job);
    expect(html).toContain("Precise Addr");
  });

  it("uses location when hasPreciseAddress is false", () => {
    const job = { ...baseJob, hasPreciseAddress: false, address: "Some Addr", location: "General Location" };
    const html = ljm.buildPopup(job);
    expect(html).toContain("General Location");
  });
});

// ═══════════════════════════════════════════════════════════
// 13. extractJobIds()
// ═══════════════════════════════════════════════════════════
describe("extractJobIds", () => {
  beforeEach(() => {
    // Clean up any leftover DOM elements
    document.body.textContent = "";
  });

  afterEach(() => {
    document.body.textContent = "";
  });

  it("extracts unique job IDs from DOM elements", () => {
    const div1 = document.createElement("div");
    div1.setAttribute("data-job-id", "111");
    const div2 = document.createElement("div");
    div2.setAttribute("data-job-id", "222");
    const div3 = document.createElement("div");
    div3.setAttribute("data-job-id", "333");
    document.body.appendChild(div1);
    document.body.appendChild(div2);
    document.body.appendChild(div3);

    const ids = ljm.extractJobIds();
    expect(ids).toEqual(["111", "222", "333"]);
  });

  it("handles duplicate data-job-id attributes", () => {
    const div1 = document.createElement("div");
    div1.setAttribute("data-job-id", "111");
    const div2 = document.createElement("div");
    div2.setAttribute("data-job-id", "111");
    const div3 = document.createElement("div");
    div3.setAttribute("data-job-id", "222");
    document.body.appendChild(div1);
    document.body.appendChild(div2);
    document.body.appendChild(div3);

    const ids = ljm.extractJobIds();
    expect(ids).toEqual(["111", "222"]);
  });

  it("returns empty array when no elements match", () => {
    const div = document.createElement("div");
    div.setAttribute("class", "some-class");
    document.body.appendChild(div);

    const ids = ljm.extractJobIds();
    expect(ids).toEqual([]);
  });

  it("returns empty array for empty document body", () => {
    const ids = ljm.extractJobIds();
    expect(ids).toEqual([]);
  });

  it("ignores elements without data-job-id attribute", () => {
    const div1 = document.createElement("div");
    div1.setAttribute("data-job-id", "aaa");
    const div2 = document.createElement("div");
    div2.setAttribute("data-other", "bbb");
    document.body.appendChild(div1);
    document.body.appendChild(div2);

    const ids = ljm.extractJobIds();
    expect(ids).toEqual(["aaa"]);
  });
});
