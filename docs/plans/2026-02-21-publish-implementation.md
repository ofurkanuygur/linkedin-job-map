# LinkedIn Job Map v3.2.0 - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve code quality and performance, raise test coverage to 80%+, and publish extension to Chrome Web Store.

**Architecture:** Minimal-touch approach — no modularization, no new dependencies. Expand `module.exports` to expose more functions for testing, add performance optimizations to DOM rendering, write comprehensive unit tests, then package and publish.

**Tech Stack:** Vanilla JS (ES2020), Vitest + jsdom, Chrome Manifest V3, Mapbox, OSRM

---

### Task 1: Code cleanup — remove console.log and add missing error handling

**Files:**
- Modify: `content.js:1707` (console.warn in scanCurrentPage catch)
- Modify: `content.js:446` (empty catch in fetchCompanyLocations)

**Step 1: Review and clean console statements**

There is one `console.warn` at line 1707. This is acceptable for production (not `console.log`), so leave it. No stray `console.log` found — code is already clean.

**Step 2: Add try/catch to fetchRoute**

In `content.js`, the `showRoute` function calls `fetchRoute` but doesn't handle the case where `fetchRoute` resolves with null gracefully in the UI. Currently it does handle it (line 679). No change needed.

**Step 3: Verify all fetch calls have catch handlers**

Review each fetch call:
- `fetchCompanyLocations` (line 456) — has `.catch()`  ✓
- `fetchJobWithCompany` (line 529) — has `.catch()`  ✓
- `geocodeLocation` (line 593) — has `.catch()`  ✓
- `fetchRoute` (line 671) — has `.catch()`  ✓

All error handling is already in place. No changes needed for cleanup.

**Step 4: Commit**

```bash
# No changes needed — code is already clean. Skip this task.
```

---

### Task 2: Performance improvements — DocumentFragment and passive event listeners

**Files:**
- Modify: `content.js:1274-1395` (renderJobCards function)
- Modify: `content.js:968` (click event listener)
- Modify: `content.js:1771` (keydown event listener)

**Step 1: Write failing test for renderJobCards using DocumentFragment**

This is a UI function — test indirectly by verifying the function exists and can be called. Performance improvements don't change behavior, so existing tests cover correctness. Skip test for this step.

**Step 2: Update renderJobCards to use DocumentFragment**

In `content.js`, replace the direct `cardsListEl.appendChild(card)` loop with a DocumentFragment:

```javascript
// In renderJobCards, after line 1280 (clearing children), before the forEach:
var fragment = document.createDocumentFragment();

// Change line 1393 from:
//   cardsListEl.appendChild(card);
// To:
//   fragment.appendChild(card);

// After the forEach loop, add:
cardsListEl.appendChild(fragment);
```

The empty message case (line 1289) should still use direct appendChild since it's a single element.

**Step 3: Add passive flag to scroll-related event listeners**

In `content.js`, find the `setupJobCardClickListener` (line 967-978). The click listener at line 968 uses `true` for capture. This is fine — click events don't benefit from passive.

For the map scroll events, Leaflet handles its own listeners. No custom scroll listeners exist in the code. No changes needed here.

**Step 4: Run tests to verify no regressions**

Run: `npm test`
Expected: All 38 tests PASS

**Step 5: Commit**

```bash
git add content.js
git commit -m "perf: use DocumentFragment for batch DOM rendering in renderJobCards"
```

---

### Task 3: Expand module.exports for comprehensive testing

**Files:**
- Modify: `content.js:1835-1849` (module.exports block)

**Step 1: Identify all pure/testable functions**

Functions to export (grouped by testability):

**Pure functions (no side effects):**
- `getWtClass`, `getTagClass` — workplace type to CSS class
- `getCommuteDisplay` — needs myLocation mock
- `findBestAddress` — complex logic, high value
- `getCsrfToken` — needs document.cookie mock
- `detectLocale` — needs navigator.language mock

**State-dependent but testable with mocks:**
- `loadSession`, `saveSession` — sessionStorage
- `getGeocodeCache`, `setGeocodeCache` — localStorage
- `getAllJobs` — depends on allJobsById
- `getFilteredJobs` — depends on allJobsById, filterState, sortState, searchQuery
- `processInParallel` — async worker pool
- `getProximityHint` — depends on myLocation + allJobsById
- `extractJobIds` — DOM query

**Functions needing fetch mocks:**
- `geocodeLocation` — Mapbox API
- `fetchRoute` — OSRM API
- `fetchJobWithCompany` — LinkedIn API
- `fetchCompanyLocations` — LinkedIn API

**CSV:**
- `exportJobsCSV` — blob/download, hard to test directly
- Inner `csvEscape` — extract for testing

**Step 2: Expand module.exports**

```javascript
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    // Already exported
    escapeHtml: escapeHtml,
    timeAgo: timeAgo,
    debounce: debounce,
    haversineKm: haversineKm,
    formatDistance: formatDistance,
    estimateCommuteMin: estimateCommuteMin,
    getWorkplaceType: getWorkplaceType,
    getWorkplaceLabel: getWorkplaceLabel,
    buildAddressString: buildAddressString,
    extractGeoLocation: extractGeoLocation,
    t: t,
    translations: translations,
    // New exports
    detectLocale: detectLocale,
    getWtClass: getWtClass,
    getTagClass: getTagClass,
    getCsrfToken: getCsrfToken,
    findBestAddress: findBestAddress,
    processInParallel: processInParallel,
    getProximityHint: getProximityHint,
    geocodeLocation: geocodeLocation,
    fetchRoute: fetchRoute,
    fetchJobWithCompany: fetchJobWithCompany,
    fetchCompanyLocations: fetchCompanyLocations,
    geocodeJobs: geocodeJobs,
    enrichWithCompanyAddress: enrichWithCompanyAddress,
    loadSession: loadSession,
    saveSession: saveSession,
    getGeocodeCache: getGeocodeCache,
    setGeocodeCache: setGeocodeCache,
    getCommuteDisplay: getCommuteDisplay,
    getFilteredJobs: getFilteredJobs,
    getAllJobs: getAllJobs,
    extractJobIds: extractJobIds,
    apiHeaders: apiHeaders,
    buildPopup: buildPopup,
    // State setters for testing
    _setMyLocation: function (loc) { myLocation = loc; },
    _setAllJobsById: function (jobs) { allJobsById = jobs; },
    _setFilterState: function (state) { filterState = state; },
    _setSortState: function (state) { sortState = state; },
    _setSearchQuery: function (q) { searchQuery = q; },
    _setCompanyNames: function (names) { companyNames = names; },
    _setCompanyCache: function (cache) { companyCache = cache; },
    _setCurrentLocale: function (locale) { currentLocale = locale; },
    _getMyLocation: function () { return myLocation; },
    _getAllJobsById: function () { return allJobsById; },
    _getCompanyCache: function () { return companyCache; }
  };
} else {
  init();
}
```

**Step 3: Run existing tests to verify no regressions**

Run: `npm test`
Expected: All 38 tests PASS

**Step 4: Commit**

```bash
git add content.js
git commit -m "test: expand module.exports with testable functions and state setters"
```

---

### Task 4: Write tests — session/storage helpers

**Files:**
- Create: `tests/session.test.js`

**Step 1: Write the tests**

```javascript
import { describe, it, expect, beforeEach, vi } from "vitest";

const ljm = require("../content.js");

describe("loadSession / saveSession", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("returns null for missing key", () => {
    expect(ljm.loadSession("nonexistent")).toBeNull();
  });

  it("saves and loads an object", () => {
    ljm.saveSession("test_key", { a: 1, b: "hello" });
    expect(ljm.loadSession("test_key")).toEqual({ a: 1, b: "hello" });
  });

  it("saves and loads an array", () => {
    ljm.saveSession("arr", [1, 2, 3]);
    expect(ljm.loadSession("arr")).toEqual([1, 2, 3]);
  });

  it("returns null for invalid JSON", () => {
    sessionStorage.setItem("bad", "not json{{{");
    expect(ljm.loadSession("bad")).toBeNull();
  });

  it("overwrites previous value", () => {
    ljm.saveSession("k", { v: 1 });
    ljm.saveSession("k", { v: 2 });
    expect(ljm.loadSession("k")).toEqual({ v: 2 });
  });
});

describe("getGeocodeCache / setGeocodeCache", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty object when no cache exists", () => {
    expect(ljm.getGeocodeCache()).toEqual({});
  });

  it("saves and retrieves cache", () => {
    ljm.setGeocodeCache({ "Istanbul": { lat: 41, lng: 29 } });
    expect(ljm.getGeocodeCache()).toEqual({ "Istanbul": { lat: 41, lng: 29 } });
  });

  it("returns empty object for corrupted data", () => {
    localStorage.setItem("ljm_geocode_cache_v3", "bad json");
    expect(ljm.getGeocodeCache()).toEqual({});
  });
});

describe("getAllJobs", () => {
  beforeEach(() => {
    ljm._setAllJobsById({});
  });

  it("returns empty array when no jobs", () => {
    expect(ljm.getAllJobs()).toEqual([]);
  });

  it("returns array of job objects", () => {
    ljm._setAllJobsById({
      "123": { jobId: "123", title: "Dev" },
      "456": { jobId: "456", title: "QA" }
    });
    const jobs = ljm.getAllJobs();
    expect(jobs).toHaveLength(2);
    expect(jobs.map(j => j.jobId).sort()).toEqual(["123", "456"]);
  });
});
```

**Step 2: Run tests to verify they pass**

Run: `npx vitest run tests/session.test.js`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add tests/session.test.js
git commit -m "test: add session/storage helper tests"
```

---

### Task 5: Write tests — getCsrfToken, detectLocale, apiHeaders

**Files:**
- Create: `tests/utils.test.js`

**Step 1: Write the tests**

```javascript
import { describe, it, expect, beforeEach, afterEach } from "vitest";

const ljm = require("../content.js");

describe("getCsrfToken", () => {
  let originalCookie;

  beforeEach(() => {
    originalCookie = document.cookie;
  });

  afterEach(() => {
    // Clear test cookies
    document.cookie.split(";").forEach(c => {
      document.cookie = c.trim().split("=")[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });
  });

  it("returns empty string when no JSESSIONID cookie", () => {
    expect(ljm.getCsrfToken()).toBe("");
  });

  it("extracts JSESSIONID value", () => {
    document.cookie = "JSESSIONID=abc123";
    expect(ljm.getCsrfToken()).toBe("abc123");
  });

  it("strips quotes from JSESSIONID value", () => {
    document.cookie = 'JSESSIONID="def456"';
    expect(ljm.getCsrfToken()).toBe("def456");
  });

  it("finds JSESSIONID among multiple cookies", () => {
    document.cookie = "other=value";
    document.cookie = "JSESSIONID=xyz789";
    document.cookie = "another=test";
    expect(ljm.getCsrfToken()).toBe("xyz789");
  });
});

describe("detectLocale", () => {
  afterEach(() => {
    ljm._setCurrentLocale("en");
  });

  it("sets Turkish locale for tr language", () => {
    const origLang = navigator.language;
    Object.defineProperty(navigator, "language", { value: "tr-TR", configurable: true });
    ljm.detectLocale();
    expect(ljm.t("onSite")).toBe("Yerinde");
    Object.defineProperty(navigator, "language", { value: origLang, configurable: true });
    ljm._setCurrentLocale("en");
  });

  it("falls back to English for unsupported locale", () => {
    const origLang = navigator.language;
    Object.defineProperty(navigator, "language", { value: "ja-JP", configurable: true });
    ljm.detectLocale();
    expect(ljm.t("onSite")).toBe("On-site");
    Object.defineProperty(navigator, "language", { value: origLang, configurable: true });
  });
});

describe("apiHeaders", () => {
  it("returns correct header object", () => {
    const headers = ljm.apiHeaders("test-csrf");
    expect(headers).toEqual({
      "csrf-token": "test-csrf",
      "accept": "application/vnd.linkedin.normalized+json+2.1"
    });
  });
});
```

**Step 2: Run tests**

Run: `npx vitest run tests/utils.test.js`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add tests/utils.test.js
git commit -m "test: add getCsrfToken, detectLocale, apiHeaders tests"
```

---

### Task 6: Write tests — getWtClass, getTagClass, getCommuteDisplay

**Files:**
- Create: `tests/display.test.js`

**Step 1: Write the tests**

```javascript
import { describe, it, expect, beforeEach } from "vitest";

const ljm = require("../content.js");

describe("getWtClass", () => {
  it("returns onsite class for type 1", () => {
    expect(ljm.getWtClass(1)).toBe("ljm-wt-onsite");
  });

  it("returns remote class for type 2", () => {
    expect(ljm.getWtClass(2)).toBe("ljm-wt-remote");
  });

  it("returns hybrid class for type 3", () => {
    expect(ljm.getWtClass(3)).toBe("ljm-wt-hybrid");
  });

  it("returns onsite class for unknown type", () => {
    expect(ljm.getWtClass(99)).toBe("ljm-wt-onsite");
  });
});

describe("getTagClass", () => {
  it("returns onsite tag for type 1", () => {
    expect(ljm.getTagClass(1)).toBe("ljm-tag-onsite");
  });

  it("returns remote tag for type 2", () => {
    expect(ljm.getTagClass(2)).toBe("ljm-tag-remote");
  });

  it("returns hybrid tag for type 3", () => {
    expect(ljm.getTagClass(3)).toBe("ljm-tag-hybrid");
  });
});

describe("getCommuteDisplay", () => {
  beforeEach(() => {
    ljm._setMyLocation(null);
  });

  it("returns N/A for remote jobs", () => {
    const result = ljm.getCommuteDisplay({ workplaceType: 2, lat: 41, lng: 29 });
    expect(result.text).toBe("N/A");
    expect(result.cls).toBe("ljm-commute-na");
  });

  it("returns -- when no location set", () => {
    const result = ljm.getCommuteDisplay({ workplaceType: 1, lat: 41, lng: 29 });
    expect(result.text).toBe("--");
    expect(result.cls).toBe("ljm-commute-na");
  });

  it("calculates short commute", () => {
    ljm._setMyLocation({ lat: 41.0, lng: 29.0 });
    const result = ljm.getCommuteDisplay({ workplaceType: 1, lat: 41.001, lng: 29.001 });
    expect(result.cls).toBe("ljm-commute-short");
    expect(result.km).toBeDefined();
    expect(result.mins).toBeDefined();
  });

  it("calculates medium commute", () => {
    ljm._setMyLocation({ lat: 41.0, lng: 29.0 });
    // ~20km away
    const result = ljm.getCommuteDisplay({ workplaceType: 1, lat: 41.18, lng: 29.0 });
    expect(result.cls).toBe("ljm-commute-medium");
  });

  it("calculates long commute", () => {
    ljm._setMyLocation({ lat: 41.0, lng: 29.0 });
    // ~100km away
    const result = ljm.getCommuteDisplay({ workplaceType: 1, lat: 41.9, lng: 29.0 });
    expect(result.cls).toBe("ljm-commute-long");
  });
});
```

**Step 2: Run tests**

Run: `npx vitest run tests/display.test.js`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add tests/display.test.js
git commit -m "test: add display helper tests (getWtClass, getTagClass, getCommuteDisplay)"
```

---

### Task 7: Write tests — findBestAddress

**Files:**
- Create: `tests/address.test.js`

**Step 1: Write the tests**

```javascript
import { describe, it, expect } from "vitest";

const ljm = require("../content.js");

describe("findBestAddress", () => {
  it("returns null for null companyData", () => {
    expect(ljm.findBestAddress(null, "Istanbul")).toBeNull();
  });

  it("returns headquarter when no matching city found", () => {
    const data = {
      headquarter: {
        address: { city: "San Francisco", country: "US" }
      },
      confirmedLocations: [],
      groupedLocationsByCountry: []
    };
    const result = ljm.findBestAddress(data, "Istanbul, Turkey");
    expect(result).not.toBeNull();
    expect(result.address).toBe("San Francisco, US");
  });

  it("matches city in confirmedLocations", () => {
    const data = {
      headquarter: { address: { city: "New York", country: "US" } },
      confirmedLocations: [
        { address: { city: "Istanbul", country: "TR", line1: "Levent" } }
      ],
      groupedLocationsByCountry: []
    };
    const result = ljm.findBestAddress(data, "Istanbul, Turkey");
    expect(result.address).toContain("Istanbul");
  });

  it("matches city in groupedLocationsByCountry", () => {
    const data = {
      headquarter: null,
      confirmedLocations: [],
      groupedLocationsByCountry: [
        {
          locations: [
            { address: { city: "Ankara", country: "TR" } }
          ]
        }
      ]
    };
    const result = ljm.findBestAddress(data, "Ankara");
    expect(result.address).toContain("Ankara");
  });

  it("extracts geo coordinates when available", () => {
    const data = {
      headquarter: {
        address: { city: "Istanbul", country: "TR" },
        geoLocation: { latitude: 41.0, longitude: 29.0 }
      },
      confirmedLocations: [],
      groupedLocationsByCountry: []
    };
    const result = ljm.findBestAddress(data, "Istanbul");
    expect(result.geo).toEqual({ lat: 41.0, lng: 29.0 });
  });

  it("returns null when no headquarter and no matching locations", () => {
    const data = {
      headquarter: null,
      confirmedLocations: [],
      groupedLocationsByCountry: []
    };
    expect(ljm.findBestAddress(data, "Istanbul")).toBeNull();
  });

  it("handles partial city match (substring)", () => {
    const data = {
      headquarter: null,
      confirmedLocations: [
        { address: { city: "Greater Istanbul Area", country: "TR" } }
      ],
      groupedLocationsByCountry: []
    };
    const result = ljm.findBestAddress(data, "Istanbul, Turkey");
    expect(result).not.toBeNull();
  });

  it("handles empty jobLocation gracefully", () => {
    const data = {
      headquarter: { address: { city: "Berlin", country: "DE" } },
      confirmedLocations: [],
      groupedLocationsByCountry: []
    };
    const result = ljm.findBestAddress(data, "");
    expect(result).not.toBeNull();
    expect(result.address).toContain("Berlin");
  });
});
```

**Step 2: Run tests**

Run: `npx vitest run tests/address.test.js`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add tests/address.test.js
git commit -m "test: add findBestAddress tests with city matching scenarios"
```

---

### Task 8: Write tests — processInParallel

**Files:**
- Create: `tests/parallel.test.js`

**Step 1: Write the tests**

```javascript
import { describe, it, expect, vi } from "vitest";

const ljm = require("../content.js");

describe("processInParallel", () => {
  it("resolves empty array for empty input", async () => {
    const result = await ljm.processInParallel([], () => Promise.resolve(), 4);
    expect(result).toEqual([]);
  });

  it("processes all items", async () => {
    const items = [1, 2, 3, 4, 5];
    const result = await ljm.processInParallel(
      items,
      (item) => Promise.resolve(item * 2),
      3
    );
    expect(result).toEqual([2, 4, 6, 8, 10]);
  });

  it("respects concurrency limit", async () => {
    let concurrent = 0;
    let maxConcurrent = 0;
    const items = [1, 2, 3, 4, 5, 6];

    await ljm.processInParallel(
      items,
      (item) => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        return new Promise((resolve) => {
          setTimeout(() => {
            concurrent--;
            resolve(item);
          }, 10);
        });
      },
      2
    );

    expect(maxConcurrent).toBeLessThanOrEqual(2);
  });

  it("calls onProgress callback", async () => {
    const progressCalls = [];
    await ljm.processInParallel(
      [1, 2, 3],
      (item) => Promise.resolve(item),
      2,
      (done, total) => progressCalls.push({ done, total })
    );
    expect(progressCalls).toHaveLength(3);
    expect(progressCalls[progressCalls.length - 1]).toEqual({ done: 3, total: 3 });
  });

  it("handles rejected promises gracefully (returns null)", async () => {
    const result = await ljm.processInParallel(
      [1, 2, 3],
      (item) => {
        if (item === 2) return Promise.reject(new Error("fail"));
        return Promise.resolve(item);
      },
      2
    );
    expect(result).toEqual([1, null, 3]);
  });

  it("preserves result order regardless of completion order", async () => {
    const items = [3, 1, 2];
    const result = await ljm.processInParallel(
      items,
      (item) => new Promise((resolve) => setTimeout(() => resolve(item * 10), item * 5)),
      3
    );
    expect(result).toEqual([30, 10, 20]);
  });
});
```

**Step 2: Run tests**

Run: `npx vitest run tests/parallel.test.js`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add tests/parallel.test.js
git commit -m "test: add processInParallel worker pool tests"
```

---

### Task 9: Write tests — filtering, sorting, getProximityHint

**Files:**
- Create: `tests/filtering.test.js`

**Step 1: Write the tests**

```javascript
import { describe, it, expect, beforeEach } from "vitest";

const ljm = require("../content.js");

const sampleJobs = {
  "1": { jobId: "1", title: "Frontend Dev", company: "Acme", location: "Istanbul", workplaceType: 1, lat: 41.0, lng: 29.0, hasPreciseAddress: true, listedAt: Date.now() - 86400000 },
  "2": { jobId: "2", title: "Backend Dev", company: "Beta Corp", location: "Ankara", workplaceType: 2, lat: 39.9, lng: 32.8, hasPreciseAddress: true, listedAt: Date.now() - 172800000 },
  "3": { jobId: "3", title: "QA Engineer", company: "Acme", location: "Istanbul", workplaceType: 3, lat: 41.01, lng: 29.01, hasPreciseAddress: false, listedAt: Date.now() },
  "4": { jobId: "4", title: "DevOps", company: "Gamma", location: "Izmir", workplaceType: 1, lat: 38.4, lng: 27.1, hasPreciseAddress: true, listedAt: Date.now() - 604800000 }
};

describe("getFilteredJobs", () => {
  beforeEach(() => {
    ljm._setAllJobsById({ ...sampleJobs });
    ljm._setFilterState({ onSite: true, hybrid: true, remote: true });
    ljm._setSortState("distance");
    ljm._setSearchQuery("");
    ljm._setMyLocation(null);
  });

  it("returns all jobs when no filters applied", () => {
    const jobs = ljm.getFilteredJobs();
    expect(jobs).toHaveLength(4);
  });

  it("filters out remote jobs", () => {
    ljm._setFilterState({ onSite: true, hybrid: true, remote: false });
    const jobs = ljm.getFilteredJobs();
    expect(jobs).toHaveLength(3);
    expect(jobs.every(j => j.workplaceType !== 2)).toBe(true);
  });

  it("filters out on-site jobs", () => {
    ljm._setFilterState({ onSite: false, hybrid: true, remote: true });
    const jobs = ljm.getFilteredJobs();
    expect(jobs).toHaveLength(2);
    expect(jobs.every(j => j.workplaceType !== 1)).toBe(true);
  });

  it("filters out hybrid jobs", () => {
    ljm._setFilterState({ onSite: true, hybrid: false, remote: true });
    const jobs = ljm.getFilteredJobs();
    expect(jobs).toHaveLength(3);
    expect(jobs.every(j => j.workplaceType !== 3)).toBe(true);
  });

  it("applies search filter on title", () => {
    ljm._setSearchQuery("frontend");
    const jobs = ljm.getFilteredJobs();
    expect(jobs).toHaveLength(1);
    expect(jobs[0].title).toBe("Frontend Dev");
  });

  it("applies search filter on company", () => {
    ljm._setSearchQuery("acme");
    const jobs = ljm.getFilteredJobs();
    expect(jobs).toHaveLength(2);
  });

  it("applies search filter on location", () => {
    ljm._setSearchQuery("istanbul");
    const jobs = ljm.getFilteredJobs();
    expect(jobs).toHaveLength(2);
  });

  it("combines filter and search", () => {
    ljm._setFilterState({ onSite: true, hybrid: false, remote: false });
    ljm._setSearchQuery("istanbul");
    const jobs = ljm.getFilteredJobs();
    expect(jobs).toHaveLength(1);
    expect(jobs[0].jobId).toBe("1");
  });

  it("sorts by distance when location is set", () => {
    ljm._setMyLocation({ lat: 41.0, lng: 29.0 }); // Istanbul
    ljm._setSortState("distance");
    const jobs = ljm.getFilteredJobs();
    expect(jobs[0].location).toBe("Istanbul");
  });

  it("sorts by company name", () => {
    ljm._setSortState("company");
    const jobs = ljm.getFilteredJobs();
    expect(jobs[0].company).toBe("Acme");
  });

  it("sorts by type", () => {
    ljm._setSortState("type");
    const jobs = ljm.getFilteredJobs();
    expect(jobs[0].workplaceType).toBe(1);
    expect(jobs[jobs.length - 1].workplaceType).toBe(3);
  });

  it("sorts by date (newest first)", () => {
    ljm._setSortState("date");
    const jobs = ljm.getFilteredJobs();
    expect(jobs[0].jobId).toBe("3"); // most recent
  });

  it("returns empty array when all types filtered out", () => {
    ljm._setFilterState({ onSite: false, hybrid: false, remote: false });
    const jobs = ljm.getFilteredJobs();
    expect(jobs).toHaveLength(0);
  });

  it("search is case-insensitive", () => {
    ljm._setSearchQuery("FRONTEND");
    const jobs = ljm.getFilteredJobs();
    expect(jobs).toHaveLength(1);
  });
});

describe("getProximityHint", () => {
  beforeEach(() => {
    ljm._setMyLocation(null);
    ljm._setAllJobsById({});
  });

  it("returns myLocation when set", () => {
    ljm._setMyLocation({ lat: 41.0, lng: 29.0 });
    expect(ljm.getProximityHint()).toEqual({ lat: 41.0, lng: 29.0 });
  });

  it("returns null when no jobs and no location", () => {
    expect(ljm.getProximityHint()).toBeNull();
  });

  it("returns centroid of existing jobs", () => {
    ljm._setAllJobsById({
      "1": { jobId: "1", lat: 40.0, lng: 28.0 },
      "2": { jobId: "2", lat: 42.0, lng: 30.0 }
    });
    const hint = ljm.getProximityHint();
    expect(hint.lat).toBeCloseTo(41.0, 0);
    expect(hint.lng).toBeCloseTo(29.0, 0);
  });

  it("ignores jobs without coordinates", () => {
    ljm._setAllJobsById({
      "1": { jobId: "1", lat: 40.0, lng: 28.0 },
      "2": { jobId: "2" } // no coords
    });
    const hint = ljm.getProximityHint();
    expect(hint.lat).toBeCloseTo(40.0, 0);
    expect(hint.lng).toBeCloseTo(28.0, 0);
  });
});
```

**Step 2: Run tests**

Run: `npx vitest run tests/filtering.test.js`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add tests/filtering.test.js
git commit -m "test: add filtering, sorting, and proximity hint tests"
```

---

### Task 10: Write tests — API functions with fetch mocks

**Files:**
- Create: `tests/api.test.js`

**Step 1: Write the tests**

```javascript
import { describe, it, expect, beforeEach, vi } from "vitest";

const ljm = require("../content.js");

describe("geocodeLocation", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns cached result without fetching", async () => {
    ljm.setGeocodeCache({ "Istanbul": { lat: 41.0, lng: 29.0 } });
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await ljm.geocodeLocation("Istanbul");
    expect(result).toEqual({ lat: 41.0, lng: 29.0 });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fetches and caches new location", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        features: [{ center: [29.0, 41.0] }]
      })
    });
    const result = await ljm.geocodeLocation("Istanbul");
    expect(result).toEqual({ lng: 29.0, lat: 41.0 });
    expect(ljm.getGeocodeCache()["Istanbul"]).toEqual({ lng: 29.0, lat: 41.0 });
  });

  it("returns null when no features found", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ features: [] })
    });
    const result = await ljm.geocodeLocation("Nonexistent Place");
    expect(result).toBeNull();
  });

  it("returns null on fetch error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));
    const result = await ljm.geocodeLocation("Istanbul");
    expect(result).toBeNull();
  });

  it("returns null on non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: false });
    const result = await ljm.geocodeLocation("Istanbul");
    expect(result).toBeNull();
  });

  it("includes proximity parameter when provided", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ features: [{ center: [29.0, 41.0] }] })
    });
    await ljm.geocodeLocation("Istanbul", { lat: 41, lng: 29 });
    expect(fetchSpy.mock.calls[0][0]).toContain("proximity=29,41");
  });

  it("includes country parameter when provided", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ features: [{ center: [29.0, 41.0] }] })
    });
    await ljm.geocodeLocation("Istanbul", null, "TR");
    expect(fetchSpy.mock.calls[0][0]).toContain("country=tr");
  });
});

describe("fetchRoute", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns route data on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        routes: [{
          geometry: { type: "LineString", coordinates: [[29, 41], [32, 39]] },
          distance: 350000,
          duration: 14400
        }]
      })
    });
    const result = await ljm.fetchRoute(41, 29, 39, 32);
    expect(result.distanceKm).toBe("350.0");
    expect(result.durationMin).toBe(240);
    expect(result.geometry).toBeDefined();
  });

  it("returns null when no routes", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ routes: [] })
    });
    const result = await ljm.fetchRoute(41, 29, 39, 32);
    expect(result).toBeNull();
  });

  it("returns null on error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("fail"));
    const result = await ljm.fetchRoute(41, 29, 39, 32);
    expect(result).toBeNull();
  });

  it("constructs correct OSRM URL", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ routes: [] })
    });
    await ljm.fetchRoute(41.0, 29.0, 39.9, 32.8);
    expect(fetchSpy.mock.calls[0][0]).toContain("29,41;32.8,39.9");
  });
});

describe("fetchJobWithCompany", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns job data on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: {
          title: "Frontend Dev",
          formattedLocation: "Istanbul, TR",
          workRemoteAllowed: false,
          workplaceTypes: ["urn:li:fs_workplaceType:1"],
          companyDetails: { company: "urn:li:fs_company:12345" },
          listedAt: 1700000000000
        }
      })
    });
    const result = await ljm.fetchJobWithCompany("job123", "csrf");
    expect(result.jobId).toBe("job123");
    expect(result.title).toBe("Frontend Dev");
    expect(result.workplaceType).toBe(1);
    expect(result.companyId).toBe("12345");
  });

  it("returns null for non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: false });
    const result = await ljm.fetchJobWithCompany("job123", "csrf");
    expect(result).toBeNull();
  });

  it("returns null on fetch error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("fail"));
    const result = await ljm.fetchJobWithCompany("job123", "csrf");
    expect(result).toBeNull();
  });

  it("returns null when no data in response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({})
    });
    const result = await ljm.fetchJobWithCompany("job123", "csrf");
    expect(result).toBeNull();
  });

  it("handles missing companyDetails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: {
          title: "Solo Dev",
          formattedLocation: "Remote",
          workplaceTypes: ["urn:li:fs_workplaceType:2"]
        }
      })
    });
    const result = await ljm.fetchJobWithCompany("job456", "csrf");
    expect(result.companyId).toBeNull();
  });
});

describe("fetchCompanyLocations", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    ljm._setCompanyCache({});
  });

  it("returns cached data without fetching", async () => {
    const cached = { headquarter: { address: { city: "Istanbul" } }, confirmedLocations: [], groupedLocationsByCountry: [], logoUrl: null };
    ljm._setCompanyCache({ "123": cached });
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await ljm.fetchCompanyLocations("123", "csrf");
    expect(result).toEqual(cached);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fetches and caches company data", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: {
          headquarter: { address: { city: "Ankara" } },
          confirmedLocations: [],
          groupedLocationsByCountry: []
        }
      })
    });
    const result = await ljm.fetchCompanyLocations("456", "csrf");
    expect(result.headquarter.address.city).toBe("Ankara");
    // Verify caching
    expect(ljm._getCompanyCache()["456"]).toBeDefined();
  });

  it("extracts logo URL from response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: {
          headquarter: null,
          confirmedLocations: [],
          groupedLocationsByCountry: [],
          logo: {
            image: {
              "com.linkedin.common.VectorImage": {
                rootUrl: "https://media.licdn.com/",
                artifacts: [{ fileIdentifyingUrlPathSegment: "logo_200.png" }]
              }
            }
          }
        }
      })
    });
    const result = await ljm.fetchCompanyLocations("789", "csrf");
    expect(result.logoUrl).toBe("https://media.licdn.com/logo_200.png");
  });

  it("returns null on error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("fail"));
    const result = await ljm.fetchCompanyLocations("999", "csrf");
    expect(result).toBeNull();
  });
});
```

**Step 2: Run tests**

Run: `npx vitest run tests/api.test.js`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add tests/api.test.js
git commit -m "test: add API function tests with fetch mocks"
```

---

### Task 11: Write tests — buildPopup, extractJobIds, DOM interactions

**Files:**
- Create: `tests/dom.test.js`

**Step 1: Write the tests**

```javascript
import { describe, it, expect, beforeEach } from "vitest";

const ljm = require("../content.js");

describe("buildPopup", () => {
  beforeEach(() => {
    ljm._setMyLocation(null);
    ljm._setCurrentLocale("en");
  });

  it("generates popup HTML with job details", () => {
    const job = {
      jobId: "123",
      title: "Frontend Dev",
      company: "Acme Corp",
      location: "Istanbul, TR",
      address: "Levent, Istanbul",
      hasPreciseAddress: true,
      workplaceType: 1,
      lat: 41.0,
      lng: 29.0,
      listedAt: Date.now() - 3600000
    };
    const html = ljm.buildPopup(job);
    expect(html).toContain("Frontend Dev");
    expect(html).toContain("Acme Corp");
    expect(html).toContain("Levent, Istanbul");
    expect(html).toContain("ljm-wt-onsite");
    expect(html).toContain("/jobs/view/123");
  });

  it("shows formattedLocation when not precise", () => {
    const job = {
      jobId: "456",
      title: "Dev",
      company: "Corp",
      location: "Istanbul Area",
      address: "Istanbul",
      hasPreciseAddress: false,
      workplaceType: 1,
      lat: 41.0,
      lng: 29.0
    };
    const html = ljm.buildPopup(job);
    expect(html).toContain("Istanbul Area");
  });

  it("includes distance info when location is set", () => {
    ljm._setMyLocation({ lat: 41.0, lng: 29.0 });
    const job = {
      jobId: "789",
      title: "Dev",
      company: "Corp",
      location: "Istanbul",
      address: "Istanbul",
      hasPreciseAddress: true,
      workplaceType: 1,
      lat: 41.01,
      lng: 29.01
    };
    const html = ljm.buildPopup(job);
    expect(html).toContain("ljm-popup-distance");
    expect(html).toContain("away");
  });

  it("does not show distance for remote jobs", () => {
    ljm._setMyLocation({ lat: 41.0, lng: 29.0 });
    const job = {
      jobId: "101",
      title: "Remote Dev",
      company: "Corp",
      location: "Remote",
      address: "Remote",
      hasPreciseAddress: false,
      workplaceType: 2,
      lat: 41.0,
      lng: 29.0
    };
    const html = ljm.buildPopup(job);
    expect(html).not.toContain("ljm-popup-distance");
  });

  it("includes company logo when available", () => {
    const job = {
      jobId: "202",
      title: "Dev",
      company: "Corp",
      location: "Istanbul",
      address: "Istanbul",
      hasPreciseAddress: true,
      workplaceType: 1,
      lat: 41.0,
      lng: 29.0,
      logoUrl: "https://example.com/logo.png"
    };
    const html = ljm.buildPopup(job);
    expect(html).toContain("ljm-popup-logo");
    expect(html).toContain("https://example.com/logo.png");
  });

  it("escapes HTML in job title and company", () => {
    const job = {
      jobId: "303",
      title: "<script>alert('xss')</script>",
      company: "Corp & Co",
      location: "Istanbul",
      address: "Istanbul",
      hasPreciseAddress: true,
      workplaceType: 1,
      lat: 41.0,
      lng: 29.0
    };
    const html = ljm.buildPopup(job);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Corp &amp; Co");
  });

  it("shows posted time when listedAt is provided", () => {
    const job = {
      jobId: "404",
      title: "Dev",
      company: "Corp",
      location: "Istanbul",
      address: "Istanbul",
      hasPreciseAddress: true,
      workplaceType: 1,
      lat: 41.0,
      lng: 29.0,
      listedAt: Date.now() - 86400000
    };
    const html = ljm.buildPopup(job);
    expect(html).toContain("Posted");
    expect(html).toContain("1d ago");
  });

  it("includes Google Maps link", () => {
    const job = {
      jobId: "505",
      title: "Dev",
      company: "Corp",
      location: "Istanbul",
      address: "Istanbul",
      hasPreciseAddress: true,
      workplaceType: 1,
      lat: 41.0,
      lng: 29.0
    };
    const html = ljm.buildPopup(job);
    expect(html).toContain("google.com/maps");
  });

  it("includes origin in Maps link when location set", () => {
    ljm._setMyLocation({ lat: 40.0, lng: 28.0 });
    const job = {
      jobId: "606",
      title: "Dev",
      company: "Corp",
      location: "Istanbul",
      address: "Istanbul",
      hasPreciseAddress: true,
      workplaceType: 1,
      lat: 41.0,
      lng: 29.0
    };
    const html = ljm.buildPopup(job);
    expect(html).toContain("origin=40,28");
  });
});

describe("extractJobIds", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns empty array when no job cards", () => {
    expect(ljm.extractJobIds()).toEqual([]);
  });

  it("extracts job IDs from data attributes", () => {
    document.body.innerHTML = `
      <div data-job-id="111"></div>
      <div data-job-id="222"></div>
      <div data-job-id="333"></div>
    `;
    expect(ljm.extractJobIds()).toEqual(["111", "222", "333"]);
  });

  it("deduplicates job IDs", () => {
    document.body.innerHTML = `
      <div data-job-id="111"></div>
      <div data-job-id="111"></div>
      <div data-job-id="222"></div>
    `;
    expect(ljm.extractJobIds()).toEqual(["111", "222"]);
  });

  it("ignores elements without data-job-id", () => {
    document.body.innerHTML = `
      <div data-job-id="111"></div>
      <div class="other-element"></div>
      <div data-job-id="222"></div>
    `;
    expect(ljm.extractJobIds()).toEqual(["111", "222"]);
  });
});
```

**Step 2: Run tests**

Run: `npx vitest run tests/dom.test.js`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add tests/dom.test.js
git commit -m "test: add buildPopup and extractJobIds DOM tests"
```

---

### Task 12: Update coverage thresholds and verify 80%+

**Files:**
- Modify: `vitest.config.js:13-17` (thresholds)

**Step 1: Run full test suite with coverage**

Run: `npm run test:coverage`
Expected: All tests PASS. Check coverage percentages.

**Step 2: Update thresholds in vitest.config.js**

```javascript
thresholds: {
  branches: 70,
  functions: 80,
  lines: 80,
  statements: 80
}
```

Note: branches may be lower since many branches are in UI code. Set to 70.

**Step 3: Run coverage again to verify thresholds pass**

Run: `npm run test:coverage`
Expected: All tests PASS, no threshold violations.

**Step 4: If coverage is below 80%, add more tests for uncovered lines**

Check the coverage report HTML at `coverage/index.html` and identify uncovered lines. Write additional tests targeting those lines.

**Step 5: Commit**

```bash
git add vitest.config.js tests/
git commit -m "test: raise coverage thresholds to 80%"
```

---

### Task 13: Create privacy policy

**Files:**
- Create: `PRIVACY.md`

**Step 1: Write privacy policy**

```markdown
# Privacy Policy — LinkedIn Job Map

**Last updated:** 2026-02-21

## Data Collection

LinkedIn Job Map does **not** collect, store, or transmit any personal data to external servers.

## How It Works

- Job listing data is fetched directly from LinkedIn's servers through your browser session
- Geocoding requests are sent to Mapbox to convert addresses to map coordinates
- Route calculations are performed via OSRM (Open Source Routing Machine)
- All data processing happens locally in your browser

## Data Storage

- **Geocoding cache:** Stored in your browser's localStorage to reduce API calls. You can clear this at any time.
- **Settings:** Your Mapbox token (if custom) is stored in Chrome's sync storage.
- **Session data:** Job listings are stored in sessionStorage and cleared when you close the tab.

## Third-Party Services

| Service | Purpose | Data Sent |
|---------|---------|-----------|
| Mapbox | Map tiles & geocoding | Address strings only |
| OSRM | Route calculation | Coordinate pairs only |
| LinkedIn | Job data | Your existing session cookies |

## Analytics

This extension does **not** include any analytics, telemetry, or tracking code.

## Permissions

- `activeTab` — Required to detect when you're on a LinkedIn jobs page
- `storage` — Required to save your settings (Mapbox token)

## Contact

For questions about this privacy policy, open an issue at: https://github.com/ofurkanuygur/linkedin-job-map/issues
```

**Step 2: Commit**

```bash
git add PRIVACY.md
git commit -m "docs: add privacy policy for Chrome Web Store submission"
```

---

### Task 14: Prepare Chrome Web Store listing materials

**Files:**
- No code changes. This task prepares listing content.

**Step 1: Write store listing descriptions**

**Short description (132 chars max):**
```
Visualize LinkedIn job listings on an interactive map. Filter by type, calculate commute times, and export results.
```

**Detailed description (adapted from README):**
```
LinkedIn Job Map transforms your LinkedIn job search by displaying all job listings on a beautiful interactive dark-themed map.

Features:
- Interactive map overlay on LinkedIn Jobs pages
- Workplace type filtering: On-site, Hybrid, Remote
- Real-time search across titles, companies, locations
- Commute time estimation with driving routes
- Fullscreen mode with detailed job cards panel
- Smart sorting by distance, company, type, or date
- CSV export of filtered results
- GPS and click-to-set location
- Company logos and relative timestamps
- Keyboard navigation shortcuts
- Bilingual: English and Turkish

Privacy-first: No data collection, no analytics. All processing happens locally in your browser.

How to use:
1. Go to LinkedIn Jobs and search for jobs
2. Click the map button (bottom-right corner)
3. Set your location via GPS or by clicking the map
4. Filter and sort jobs as needed
5. Click jobs to see details and routes

Works with: linkedin.com/jobs/*
```

**Step 2: Take screenshots (manual — user must do this)**

Required screenshots (1280x800 or 640x400):
1. Main map view with job markers
2. Fullscreen mode with job cards panel
3. Job popup with commute info
4. Filter and search in action
5. Route display between location and job

**Step 3: Document this for the user**

Create a checklist for the user to complete manually.

---

### Task 15: Package extension for Chrome Web Store upload

**Files:**
- No new files. Creates a zip from existing files.

**Step 1: Verify manifest.json version**

Check `manifest.json` version is `3.2.0`. If still `3.1.0`, update it.

**Step 2: Run linter**

Run: `npm run lint`
Expected: No errors or warnings.

**Step 3: Run tests with coverage**

Run: `npm run test:coverage`
Expected: All tests pass, 80%+ coverage.

**Step 4: Create distribution zip**

```bash
cd /Users/oktayfurkanuygur/Desktop/Development/linkedin-jobs-map
zip -r linkedin-job-map-v3.2.0.zip \
  manifest.json \
  content.js \
  options.js \
  options.html \
  styles.css \
  leaflet.js \
  leaflet.css \
  leaflet.markercluster.js \
  leaflet.markercluster.css \
  icons/
```

**Step 5: Verify zip contents**

```bash
unzip -l linkedin-job-map-v3.2.0.zip
```

Expected: Only extension files, no node_modules, tests, docs, etc.

**Step 6: Commit version bump**

```bash
git add manifest.json package.json
git commit -m "chore: bump version to 3.2.0 for Chrome Web Store release"
```

---

### Task 16: Submit to Chrome Web Store (manual — user guidance)

This task provides step-by-step guidance for the user:

1. Go to https://chrome.google.com/webstore/devconsole
2. Click "New Item"
3. Upload `linkedin-job-map-v3.2.0.zip`
4. Fill in:
   - Language: English (add Turkish as additional)
   - Category: Productivity
   - Short description (from Task 14)
   - Detailed description (from Task 14)
   - Upload screenshots (minimum 1)
   - Upload promotional tile (440x280, optional)
   - Privacy policy URL: `https://github.com/ofurkanuygur/linkedin-job-map/blob/main/PRIVACY.md`
   - Single purpose: "Visualize LinkedIn job listings on an interactive map"
   - Permissions justification:
     - `activeTab`: Needed to detect LinkedIn Jobs pages and inject the map overlay
     - `storage`: Needed to save user's custom Mapbox token setting
   - Host permissions justification:
     - `linkedin.com/voyager/api/*`: Fetch job listing data from LinkedIn's API
     - `router.project-osrm.org/*`: Calculate driving routes between locations
     - `api.mapbox.com/*`: Geocode addresses and load map tiles
5. Click "Submit for Review"
6. Wait 1-3 business days for review
7. After approval, update README with actual Web Store URL
