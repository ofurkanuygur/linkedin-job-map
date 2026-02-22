import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock localStorage before loading content.js
const localStore = {};
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key) => localStore[key] ?? null,
    setItem: (key, val) => { localStore[key] = String(val); },
    removeItem: (key) => { delete localStore[key]; },
    clear: () => { Object.keys(localStore).forEach((k) => delete localStore[k]); },
  },
  writable: true,
});

// Mock fetch BEFORE requiring content.js
global.fetch = vi.fn();

// Mock chrome.storage
global.chrome = {
  storage: {
    local: { get: vi.fn(), set: vi.fn(), remove: vi.fn() },
    sync: { get: vi.fn() },
  },
};

const ljm = require("../content.js");

// ── Helpers ──

function mockFetchResponse(data, ok = true) {
  global.fetch.mockResolvedValueOnce({
    ok: ok,
    json: () => Promise.resolve(data),
  });
}

function mockFetchError() {
  global.fetch.mockRejectedValueOnce(new Error("Network error"));
}

// ── Setup / Teardown ──

beforeEach(() => {
  fetch.mockReset();
  localStorage.clear();
  ljm._setAllJobsById({});
  ljm._setMyLocation(null);
  ljm._setCompanyCache({});
  ljm._setCompanyNames({});
});

// ═══════════════════════════════════════════════════════════
// 1. processInParallel
// ═══════════════════════════════════════════════════════════

describe("processInParallel", () => {
  it("resolves immediately with [] for empty array", async () => {
    const fn = vi.fn();
    const result = await ljm.processInParallel([], fn, 3);
    expect(result).toEqual([]);
    expect(fn).not.toHaveBeenCalled();
  });

  it("processes all items and returns results", async () => {
    const items = [1, 2, 3];
    const fn = (item) => Promise.resolve(item * 10);
    const result = await ljm.processInParallel(items, fn, 3);
    expect(result).toEqual([10, 20, 30]);
  });

  it("respects concurrency limit", async () => {
    let running = 0;
    let maxRunning = 0;

    const items = [1, 2, 3, 4, 5, 6];
    const fn = () => {
      running++;
      if (running > maxRunning) maxRunning = running;
      return new Promise((resolve) => {
        setTimeout(() => { running--; resolve("done"); }, 10);
      });
    };

    await ljm.processInParallel(items, fn, 2);
    expect(maxRunning).toBeLessThanOrEqual(2);
  });

  it("calls onProgress with (doneCount, total)", async () => {
    const items = ["a", "b", "c"];
    const fn = () => Promise.resolve("ok");
    const progress = vi.fn();

    await ljm.processInParallel(items, fn, 5, progress);

    expect(progress).toHaveBeenCalledTimes(3);
    expect(progress).toHaveBeenCalledWith(1, 3);
    expect(progress).toHaveBeenCalledWith(2, 3);
    expect(progress).toHaveBeenCalledWith(3, 3);
  });

  it("handles rejected promises (returns null for failed items)", async () => {
    const items = [1, 2, 3];
    const fn = (item) => {
      if (item === 2) return Promise.reject(new Error("boom"));
      return Promise.resolve(item * 10);
    };

    const result = await ljm.processInParallel(items, fn, 3);
    expect(result).toEqual([10, null, 30]);
  });

  it("all items complete even with some failures", async () => {
    const items = [1, 2, 3, 4, 5];
    const fn = (item) => {
      if (item % 2 === 0) return Promise.reject(new Error("fail"));
      return Promise.resolve(item);
    };
    const progress = vi.fn();

    const result = await ljm.processInParallel(items, fn, 2, progress);
    expect(result).toEqual([1, null, 3, null, 5]);
    expect(progress).toHaveBeenCalledTimes(5);
    expect(progress).toHaveBeenLastCalledWith(5, 5);
  });
});

// ═══════════════════════════════════════════════════════════
// 2. geocodeLocation
// ═══════════════════════════════════════════════════════════

describe("geocodeLocation", () => {
  it("returns cached result without fetching", async () => {
    ljm.setGeocodeCache({ Istanbul: { lat: 41.0, lng: 29.0 } });

    const result = await ljm.geocodeLocation("Istanbul");
    expect(result).toEqual({ lat: 41.0, lng: 29.0 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fetches from Mapbox API when not cached", async () => {
    mockFetchResponse({
      features: [{ center: [29.0, 41.0] }],
    });

    const result = await ljm.geocodeLocation("Istanbul");
    expect(result).toEqual({ lng: 29.0, lat: 41.0 });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toContain("api.mapbox.com/geocoding/v5/mapbox.places/Istanbul");
  });

  it("stores result in cache after fetching", async () => {
    mockFetchResponse({
      features: [{ center: [32.8, 39.9] }],
    });

    await ljm.geocodeLocation("Ankara");
    const cache = ljm.getGeocodeCache();
    expect(cache["Ankara"]).toEqual({ lng: 32.8, lat: 39.9 });
  });

  it("passes proximity parameter in URL", async () => {
    mockFetchResponse({ features: [{ center: [29.0, 41.0] }] });

    await ljm.geocodeLocation("Istanbul", { lat: 40.0, lng: 28.0 });
    expect(fetch.mock.calls[0][0]).toContain("proximity=28,40");
  });

  it("passes country parameter in URL", async () => {
    mockFetchResponse({ features: [{ center: [29.0, 41.0] }] });

    await ljm.geocodeLocation("Istanbul", null, "TR");
    expect(fetch.mock.calls[0][0]).toContain("country=tr");
  });

  it("returns null for empty results", async () => {
    mockFetchResponse({ features: [] });

    const result = await ljm.geocodeLocation("Nowhere");
    expect(result).toBeNull();
  });

  it("returns null on network error", async () => {
    mockFetchError();

    const result = await ljm.geocodeLocation("Istanbul");
    expect(result).toBeNull();
  });

  it("re-reads freshCache before writing to avoid race conditions", async () => {
    // Simulate a concurrent write: pre-populate cache with "Ankara" before
    // geocodeLocation for "Istanbul" completes. Because geocodeLocation re-reads
    // the cache (freshCache) before writing, the existing "Ankara" entry should
    // be preserved alongside the new "Istanbul" entry.

    // Start with empty cache
    ljm.setGeocodeCache({});

    // Use a custom fetch mock that injects a cache entry mid-flight
    global.fetch.mockImplementationOnce(() => {
      // Simulate another concurrent geocode writing to cache while this fetch is in-flight
      ljm.setGeocodeCache({ "Ankara": { lat: 39.9, lng: 32.8 } });
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ features: [{ center: [29.0, 41.0] }] }),
      });
    });

    await ljm.geocodeLocation("Istanbul");

    const cache = ljm.getGeocodeCache();
    // Both entries should exist because geocodeLocation re-reads freshCache
    expect(cache["Istanbul"]).toEqual({ lng: 29.0, lat: 41.0 });
    expect(cache["Ankara"]).toEqual({ lat: 39.9, lng: 32.8 });
  });
});

// ═══════════════════════════════════════════════════════════
// 3. fetchRoute
// ═══════════════════════════════════════════════════════════

describe("fetchRoute", () => {
  it("constructs correct OSRM URL", async () => {
    mockFetchResponse({
      routes: [{
        geometry: { type: "LineString", coordinates: [] },
        distance: 10000,
        duration: 600,
      }],
    });

    await ljm.fetchRoute(41.0, 29.0, 39.9, 32.8);
    expect(fetch.mock.calls[0][0]).toBe(
      "https://router.project-osrm.org/route/v1/driving/29,41;32.8,39.9?overview=full&geometries=geojson"
    );
  });

  it("returns route geometry, distanceKm, durationMin", async () => {
    const mockGeometry = { type: "LineString", coordinates: [[29, 41], [32.8, 39.9]] };
    mockFetchResponse({
      routes: [{
        geometry: mockGeometry,
        distance: 35200,    // meters
        duration: 1920,     // seconds
      }],
    });

    const result = await ljm.fetchRoute(41.0, 29.0, 39.9, 32.8);
    expect(result).toEqual({
      geometry: mockGeometry,
      distanceKm: "35.2",
      durationMin: 32,
    });
  });

  it("returns null for no routes", async () => {
    mockFetchResponse({ routes: [] });

    const result = await ljm.fetchRoute(41.0, 29.0, 39.9, 32.8);
    expect(result).toBeNull();
  });

  it("returns null on network error", async () => {
    mockFetchError();

    const result = await ljm.fetchRoute(41.0, 29.0, 39.9, 32.8);
    expect(result).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════
// 4. fetchJobWithCompany
// ═══════════════════════════════════════════════════════════

describe("fetchJobWithCompany", () => {
  it("constructs correct LinkedIn API URL", async () => {
    mockFetchResponse({
      data: {
        title: "Developer",
        formattedLocation: "Istanbul, TR",
        workplaceTypes: [],
        companyDetails: { company: "urn:li:company:12345" },
        listedAt: 1700000000000,
      },
    });

    await ljm.fetchJobWithCompany("job-1", "csrf-token-123");
    expect(fetch.mock.calls[0][0]).toBe(
      "https://www.linkedin.com/voyager/api/jobs/jobPostings/job-1"
    );
    expect(fetch.mock.calls[0][1].headers).toEqual({
      "csrf-token": "csrf-token-123",
      accept: "application/vnd.linkedin.normalized+json+2.1",
    });
  });

  it("parses job data correctly", async () => {
    mockFetchResponse({
      data: {
        title: "Senior Engineer",
        formattedLocation: "Istanbul, TR",
        workplaceTypes: ["urn:li:fs_workplaceType:3"],
        workRemoteAllowed: true,
        companyDetails: { company: "urn:li:company:99999" },
        listedAt: 1700000000000,
      },
    });

    const result = await ljm.fetchJobWithCompany("job-2", "csrf");
    expect(result.jobId).toBe("job-2");
    expect(result.title).toBe("Senior Engineer");
    expect(result.formattedLocation).toBe("Istanbul, TR");
    expect(result.workplaceType).toBe(3);         // hybrid
    expect(result.companyId).toBe("99999");
    expect(result.listedAt).toBe(1700000000000);
    expect(result.workRemoteAllowed).toBe(true);
  });

  it("returns null for non-OK response", async () => {
    mockFetchResponse(null, false);

    const result = await ljm.fetchJobWithCompany("job-3", "csrf");
    expect(result).toBeNull();
  });

  it("returns null on network error", async () => {
    mockFetchError();

    const result = await ljm.fetchJobWithCompany("job-4", "csrf");
    expect(result).toBeNull();
  });

  it("handles missing data gracefully", async () => {
    mockFetchResponse({
      data: {
        // title, formattedLocation, workplaceTypes, companyDetails, listedAt all missing
      },
    });

    const result = await ljm.fetchJobWithCompany("job-5", "csrf");
    expect(result.jobId).toBe("job-5");
    expect(result.title).toBe("");
    expect(result.formattedLocation).toBe("");
    expect(result.workplaceType).toBe(1);    // default onsite
    expect(result.companyId).toBeNull();
    expect(result.listedAt).toBeNull();
  });

  it("returns null when response has no data property", async () => {
    mockFetchResponse({ something: "else" });

    const result = await ljm.fetchJobWithCompany("job-6", "csrf");
    expect(result).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════
// 5. fetchCompanyLocations
// ═══════════════════════════════════════════════════════════

describe("fetchCompanyLocations", () => {
  it("returns cached result for known company", async () => {
    const cached = {
      headquarter: null,
      confirmedLocations: [],
      groupedLocationsByCountry: [],
      logoUrl: "https://example.com/logo.png",
    };
    ljm._setCompanyCache({ "comp-1": cached });

    const result = await ljm.fetchCompanyLocations("comp-1", "csrf");
    expect(result).toBe(cached);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fetches from LinkedIn API", async () => {
    mockFetchResponse({
      data: {
        headquarter: { address: { city: "Istanbul" } },
        confirmedLocations: [{ address: { city: "Ankara" } }],
        groupedLocationsByCountry: [],
        logo: null,
      },
    });

    const result = await ljm.fetchCompanyLocations("comp-2", "csrf-tok");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toBe(
      "https://www.linkedin.com/voyager/api/organization/dash/companies/comp-2"
    );
    expect(result.headquarter).toEqual({ address: { city: "Istanbul" } });
    expect(result.confirmedLocations).toEqual([{ address: { city: "Ankara" } }]);
  });

  it("caches the result after fetching", async () => {
    mockFetchResponse({
      data: {
        headquarter: null,
        confirmedLocations: [],
        groupedLocationsByCountry: [],
        logo: null,
      },
    });

    await ljm.fetchCompanyLocations("comp-3", "csrf");
    const cache = ljm._getCompanyCache();
    expect(cache["comp-3"]).toBeDefined();
    expect(cache["comp-3"].headquarter).toBeNull();
  });

  it("extracts logoUrl from VectorImage", async () => {
    mockFetchResponse({
      data: {
        headquarter: null,
        confirmedLocations: [],
        groupedLocationsByCountry: [],
        logo: {
          image: {
            "com.linkedin.common.VectorImage": {
              rootUrl: "https://media.licdn.com/dms/image/",
              artifacts: [
                { fileIdentifyingUrlPathSegment: "small.png" },
                { fileIdentifyingUrlPathSegment: "large.png" },
              ],
            },
          },
        },
      },
    });

    const result = await ljm.fetchCompanyLocations("comp-4", "csrf");
    expect(result.logoUrl).toBe("https://media.licdn.com/dms/image/large.png");
  });

  it("handles missing logo gracefully", async () => {
    mockFetchResponse({
      data: {
        headquarter: null,
        confirmedLocations: [],
        groupedLocationsByCountry: [],
        // no logo property
      },
    });

    const result = await ljm.fetchCompanyLocations("comp-5", "csrf");
    expect(result.logoUrl).toBeNull();
  });

  it("returns null on error", async () => {
    mockFetchError();

    const result = await ljm.fetchCompanyLocations("comp-6", "csrf");
    expect(result).toBeNull();
  });

  it("returns null for non-OK response", async () => {
    mockFetchResponse(null, false);

    const result = await ljm.fetchCompanyLocations("comp-7", "csrf");
    expect(result).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════
// 6. enrichWithCompanyAddress
// ═══════════════════════════════════════════════════════════

describe("enrichWithCompanyAddress", () => {
  function makeJob(overrides) {
    return Object.assign({
      jobId: "j1",
      companyId: "c1",
      formattedLocation: "Istanbul, TR",
      geocodeAddress: null,
      hasPreciseAddress: false,
    }, overrides);
  }

  it("enriches jobs with company address data", async () => {
    // Pre-populate company cache so no fetch is needed
    ljm._setCompanyCache({
      c1: {
        headquarter: {
          address: { city: "Istanbul", country: "TR" },
          geoLocation: { latitude: 41.0, longitude: 29.0 },
        },
        confirmedLocations: [],
        groupedLocationsByCountry: [],
        logoUrl: "https://example.com/logo.png",
      },
    });

    const jobs = [makeJob()];
    const result = await ljm.enrichWithCompanyAddress(jobs, "csrf");
    expect(result[0].geocodeAddress).toBe("Istanbul, TR");
    expect(result[0].hasPreciseAddress).toBe(true);
  });

  it("sets directLat/directLng from geo", async () => {
    ljm._setCompanyCache({
      c1: {
        headquarter: {
          address: { city: "Istanbul", country: "TR" },
          geoLocation: { latitude: 41.05, longitude: 29.05 },
        },
        confirmedLocations: [],
        groupedLocationsByCountry: [],
        logoUrl: null,
      },
    });

    const jobs = [makeJob()];
    await ljm.enrichWithCompanyAddress(jobs, "csrf");
    expect(jobs[0].directLat).toBe(41.05);
    expect(jobs[0].directLng).toBe(29.05);
  });

  it("sets logoUrl from company data", async () => {
    ljm._setCompanyCache({
      c1: {
        headquarter: {
          address: { city: "Istanbul", country: "TR" },
        },
        confirmedLocations: [],
        groupedLocationsByCountry: [],
        logoUrl: "https://example.com/logo.png",
      },
    });

    const jobs = [makeJob()];
    await ljm.enrichWithCompanyAddress(jobs, "csrf");
    expect(jobs[0].logoUrl).toBe("https://example.com/logo.png");
  });

  it("extracts countryCode from formattedLocation when not set from company", async () => {
    ljm._setCompanyCache({
      c1: {
        headquarter: null,
        confirmedLocations: [],
        groupedLocationsByCountry: [],
        logoUrl: null,
      },
    });

    const jobs = [makeJob({ formattedLocation: "Istanbul, TR" })];
    await ljm.enrichWithCompanyAddress(jobs, "csrf");
    expect(jobs[0].countryCode).toBe("TR");
  });

  it("deduplicates company fetches (same companyId only fetched once)", async () => {
    // Both jobs have the same companyId - should only fetch once
    mockFetchResponse({
      data: {
        headquarter: { address: { city: "Istanbul", country: "TR" } },
        confirmedLocations: [],
        groupedLocationsByCountry: [],
        logo: null,
      },
    });

    const jobs = [
      makeJob({ jobId: "j1", companyId: "c1" }),
      makeJob({ jobId: "j2", companyId: "c1" }),
    ];

    await ljm.enrichWithCompanyAddress(jobs, "csrf");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("sets hasPreciseAddress to false when no company data found", async () => {
    ljm._setCompanyCache({
      c1: {
        headquarter: null,
        confirmedLocations: [],
        groupedLocationsByCountry: [],
        logoUrl: null,
      },
    });

    const jobs = [makeJob({ formattedLocation: "Remote" })];
    await ljm.enrichWithCompanyAddress(jobs, "csrf");
    expect(jobs[0].hasPreciseAddress).toBe(false);
    expect(jobs[0].geocodeAddress).toBe("Remote");
  });

  it("calls onProgress callback during company fetching", async () => {
    mockFetchResponse({
      data: {
        headquarter: null,
        confirmedLocations: [],
        groupedLocationsByCountry: [],
        logo: null,
      },
    });

    const progress = vi.fn();
    const jobs = [makeJob({ companyId: "c1" })];
    await ljm.enrichWithCompanyAddress(jobs, "csrf", progress);
    expect(progress).toHaveBeenCalledWith(1, 1);
  });
});

// ═══════════════════════════════════════════════════════════
// 7. geocodeJobs
// ═══════════════════════════════════════════════════════════

describe("geocodeJobs", () => {
  function makeEnrichedJob(overrides) {
    return Object.assign({
      jobId: "j1",
      title: "Developer",
      formattedLocation: "Istanbul, TR",
      geocodeAddress: "Istanbul, TR",
      hasPreciseAddress: false,
      workplaceType: 1,
      workplaceLabel: "On-site",
      directLat: null,
      directLng: null,
      listedAt: 1700000000000,
      logoUrl: null,
      countryCode: "TR",
    }, overrides);
  }

  it("returns geocoded jobs with lat/lng", async () => {
    mockFetchResponse({
      features: [{ center: [29.0, 41.0] }],
    });

    const jobs = [makeEnrichedJob()];
    const result = await ljm.geocodeJobs(jobs);
    expect(result).toHaveLength(1);
    expect(result[0].lat).toBe(41.0);
    expect(result[0].lng).toBe(29.0);
    expect(result[0].jobId).toBe("j1");
  });

  it("uses directLat/directLng when available (skip geocoding)", async () => {
    const jobs = [makeEnrichedJob({
      directLat: 41.05,
      directLng: 29.05,
    })];

    const result = await ljm.geocodeJobs(jobs);
    expect(result).toHaveLength(1);
    expect(result[0].lat).toBe(41.05);
    expect(result[0].lng).toBe(29.05);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("geocodes addresses for jobs without direct coordinates", async () => {
    mockFetchResponse({
      features: [{ center: [32.8, 39.9] }],
    });

    const jobs = [makeEnrichedJob({
      geocodeAddress: "Ankara, TR",
      directLat: null,
      directLng: null,
    })];

    const result = await ljm.geocodeJobs(jobs);
    expect(result).toHaveLength(1);
    expect(result[0].lat).toBe(39.9);
    expect(result[0].lng).toBe(32.8);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("filters out jobs that could not be geocoded", async () => {
    mockFetchResponse({ features: [] }); // geocoding returns nothing

    const jobs = [makeEnrichedJob({
      directLat: null,
      directLng: null,
    })];

    const result = await ljm.geocodeJobs(jobs);
    expect(result).toHaveLength(0);
  });

  it("deduplicates geocode calls for same address", async () => {
    mockFetchResponse({
      features: [{ center: [29.0, 41.0] }],
    });

    const jobs = [
      makeEnrichedJob({ jobId: "j1", geocodeAddress: "Istanbul, TR" }),
      makeEnrichedJob({ jobId: "j2", geocodeAddress: "Istanbul, TR" }),
    ];

    const result = await ljm.geocodeJobs(jobs);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(2);
    expect(result[0].lat).toBe(41.0);
    expect(result[1].lat).toBe(41.0);
  });

  it("mixes direct-coordinate jobs with geocoded jobs", async () => {
    mockFetchResponse({
      features: [{ center: [32.8, 39.9] }],
    });

    const jobs = [
      makeEnrichedJob({
        jobId: "j1",
        directLat: 41.0,
        directLng: 29.0,
        geocodeAddress: "Istanbul, TR",
      }),
      makeEnrichedJob({
        jobId: "j2",
        directLat: null,
        directLng: null,
        geocodeAddress: "Ankara, TR",
      }),
    ];

    const result = await ljm.geocodeJobs(jobs);
    expect(result).toHaveLength(2);
    // j1 uses direct coordinates
    expect(result[0].lat).toBe(41.0);
    expect(result[0].lng).toBe(29.0);
    // j2 uses geocoded coordinates
    expect(result[1].lat).toBe(39.9);
    expect(result[1].lng).toBe(32.8);
  });

  it("calls onProgress callback during geocoding", async () => {
    mockFetchResponse({ features: [{ center: [29.0, 41.0] }] });

    const progress = vi.fn();
    const jobs = [makeEnrichedJob()];
    await ljm.geocodeJobs(jobs, progress);
    expect(progress).toHaveBeenCalledWith(1, 1);
  });

  it("preserves job metadata fields in output", async () => {
    mockFetchResponse({ features: [{ center: [29.0, 41.0] }] });

    const jobs = [makeEnrichedJob({
      title: "Senior Dev",
      formattedLocation: "Istanbul, TR",
      hasPreciseAddress: true,
      workplaceType: 3,
      workplaceLabel: "Hybrid",
      listedAt: 1700000000000,
      logoUrl: "https://example.com/logo.png",
    })];

    const result = await ljm.geocodeJobs(jobs);
    expect(result[0].title).toBe("Senior Dev");
    expect(result[0].location).toBe("Istanbul, TR");
    expect(result[0].hasPreciseAddress).toBe(true);
    expect(result[0].workplaceType).toBe(3);
    expect(result[0].workplaceLabel).toBe("Hybrid");
    expect(result[0].listedAt).toBe(1700000000000);
    expect(result[0].logoUrl).toBe("https://example.com/logo.png");
  });
});
