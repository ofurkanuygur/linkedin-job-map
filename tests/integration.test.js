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

// Mock Leaflet (L) for marker-related tests
global.L = {
  circleMarker: vi.fn(() => ({
    bindPopup: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    getPopup: vi.fn(() => ({ getElement: vi.fn(() => null) })),
    _ljmJobId: null,
  })),
  marker: vi.fn(() => ({
    addTo: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
  })),
  divIcon: vi.fn(),
  layerGroup: vi.fn(() => ({
    addTo: vi.fn().mockReturnThis(),
    clearLayers: vi.fn(),
  })),
  markerClusterGroup: vi.fn(() => ({
    addLayer: vi.fn(),
    clearLayers: vi.fn(),
  })),
};

const ljm = require("../content.js");

// ── Helpers ──

function mockFetchResponse(data, ok = true) {
  global.fetch.mockResolvedValueOnce({
    ok,
    json: () => Promise.resolve(data),
  });
}

function dispatchKey(key, target) {
  const event = new KeyboardEvent("keydown", { key, bubbles: true });
  (target || document).dispatchEvent(event);
}

function makeGeoJob(overrides) {
  return Object.assign({
    jobId: "j1",
    title: "Developer",
    company: "TestCo",
    location: "Istanbul, TR",
    address: "Levent, Istanbul, TR",
    hasPreciseAddress: true,
    workplaceType: 1,
    workplaceLabel: "On-site",
    lat: 41.0,
    lng: 29.0,
    listedAt: 1700000000000,
    logoUrl: null,
  }, overrides);
}

function cleanupDOM() {
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }
}

// ── Global Setup / Teardown ──

beforeEach(() => {
  fetch.mockReset();
  localStorage.clear();
  sessionStorage.clear();
  ljm._setAllJobsById({});
  ljm._setMyLocation(null);
  ljm._setCompanyCache({});
  ljm._setCompanyNames({});
  ljm._setIsLoading(false);
  ljm._setIsFullscreen(false);
  ljm._setMap(null);
  ljm._setMarkersLayer(null);
  ljm._setCardsListEl(null);
  ljm._setCardsBadgeEl(null);
  ljm._setCardsFooterTimeEl(null);
  ljm._setPanelEl(null);
  ljm._setFilterState({ onSite: true, hybrid: true, remote: true });
  ljm._setSortState("distance");
  ljm._setSearchQuery("");
  ljm._setCurrentLocale("en");
  ljm._setMarkerRefs({});
  ljm._setCurrentGeoJobs([]);
});

afterEach(() => {
  cleanupDOM();
  vi.restoreAllMocks();
});


// ===============================================================
// 1. scanCurrentPage()
// ===============================================================

describe("scanCurrentPage", () => {
  let originalCookie;

  beforeEach(() => {
    // Create status + count DOM elements required by scanCurrentPage
    const status = document.createElement("div");
    status.id = "ljm-status";
    document.body.appendChild(status);

    const countEl = document.createElement("span");
    countEl.id = "ljm-count";
    countEl.textContent = "0";
    document.body.appendChild(countEl);

    originalCookie = Object.getOwnPropertyDescriptor(document, "cookie") ||
                     Object.getOwnPropertyDescriptor(Document.prototype, "cookie");
  });

  afterEach(() => {
    if (originalCookie) {
      Object.defineProperty(document, "cookie", originalCookie);
    } else {
      delete document.cookie;
    }
  });

  function mockCookie(value) {
    Object.defineProperty(document, "cookie", {
      get: () => value,
      configurable: true,
    });
  }

  it("sets isLoading flag during execution", () => {
    mockCookie("JSESSIONID=test123");
    // Make fetch hang so isLoading stays true
    global.fetch.mockReturnValue(new Promise(() => {}));

    // Create a DOM element so extractJobIds returns something
    const card = document.createElement("div");
    card.setAttribute("data-job-id", "999");
    document.body.appendChild(card);

    ljm.scanCurrentPage();
    expect(ljm._getIsLoading()).toBe(true);
  });

  it("handles missing CSRF token by setting status to csrf error", () => {
    mockCookie("other=value; lang=en");

    ljm.scanCurrentPage();

    expect(ljm._getIsLoading()).toBe(false);
    const statusEl = document.getElementById("ljm-status");
    expect(statusEl.textContent).toBe("CSRF token not found. Refresh the page.");
  });

  it("sets pendingScanAfterLoad when called while isLoading is true", () => {
    ljm._setIsLoading(true);

    ljm.scanCurrentPage();

    expect(ljm._getPendingScanAfterLoad()).toBe(true);
  });

  it("creates AbortController and passes signal to fetch", async () => {
    mockCookie("JSESSIONID=csrf123");

    // Create a job card in DOM
    const card = document.createElement("div");
    card.setAttribute("data-job-id", "job-abc");
    document.body.appendChild(card);

    // Mock the full pipeline - fetchJobWithCompany
    mockFetchResponse({
      data: {
        title: "Dev",
        formattedLocation: "Istanbul, TR",
        workplaceTypes: [],
        companyDetails: { company: "urn:li:company:111" },
        listedAt: 1700000000000,
      },
    });
    // fetchCompanyLocations
    mockFetchResponse({
      data: {
        headquarter: null,
        confirmedLocations: [],
        groupedLocationsByCountry: [],
        logo: null,
      },
    });
    // geocodeLocation
    mockFetchResponse({
      features: [{ center: [29.0, 41.0] }],
    });

    await ljm.scanCurrentPage();

    // Wait for async operations
    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    // Verify that at least one fetch call includes a signal
    const callsWithSignal = fetch.mock.calls.filter(
      (call) => call[1] && call[1].signal
    );
    expect(callsWithSignal.length).toBeGreaterThan(0);
  });

  it("calls loadPageJobs with csrf token from cookie", async () => {
    mockCookie("JSESSIONID=test-csrf-token");

    // Create a job card in DOM
    const card = document.createElement("div");
    card.setAttribute("data-job-id", "job-xyz");
    document.body.appendChild(card);

    // Mock fetchJobWithCompany response
    mockFetchResponse({
      data: {
        title: "Engineer",
        formattedLocation: "Ankara, TR",
        workplaceTypes: ["urn:li:fs_workplaceType:1"],
        companyDetails: { company: "urn:li:company:222" },
        listedAt: 1700000000000,
      },
    });
    // fetchCompanyLocations response
    mockFetchResponse({
      data: {
        headquarter: { address: { city: "Ankara", country: "TR" } },
        confirmedLocations: [],
        groupedLocationsByCountry: [],
        logo: null,
      },
    });
    // geocodeLocation response
    mockFetchResponse({
      features: [{ center: [32.8, 39.9] }],
    });

    ljm.scanCurrentPage();

    // Wait for async pipeline to complete
    await vi.waitFor(() => {
      expect(ljm._getIsLoading()).toBe(false);
    }, { timeout: 5000 });

    // The first fetch call should be to the LinkedIn jobs API with the csrf token
    expect(fetch.mock.calls[0][0]).toContain(
      "linkedin.com/voyager/api/jobs/jobPostings/job-xyz"
    );
    expect(fetch.mock.calls[0][1].headers["csrf-token"]).toBe("test-csrf-token");
  });

  it("resets isLoading after successful completion", async () => {
    mockCookie("JSESSIONID=tok");

    // No job cards in DOM, so loadPageJobs should resolve immediately
    ljm.scanCurrentPage();

    await vi.waitFor(() => {
      expect(ljm._getIsLoading()).toBe(false);
    });
  });

  it("processes pending scan after load completes", () => {
    mockCookie("JSESSIONID=tok");

    // First scan - no new jobs, resolves quickly
    ljm.scanCurrentPage();

    // While first is in flight, request a second scan
    ljm._setIsLoading(true);
    ljm.scanCurrentPage(); // This should set pendingScanAfterLoad = true
    expect(ljm._getPendingScanAfterLoad()).toBe(true);
  });
});


// ===============================================================
// 2. mergeAndDisplay(newGeoJobs)
// ===============================================================

describe("mergeAndDisplay", () => {
  beforeEach(() => {
    const status = document.createElement("div");
    status.id = "ljm-status";
    document.body.appendChild(status);

    const countEl = document.createElement("span");
    countEl.id = "ljm-count";
    countEl.textContent = "0";
    document.body.appendChild(countEl);
  });

  describe("without map", () => {
    it("adds jobs to allJobsById", () => {
      const jobs = [
        makeGeoJob({ jobId: "j1" }),
        makeGeoJob({ jobId: "j2", title: "QA" }),
      ];

      ljm.mergeAndDisplay(jobs);

      const all = ljm._getAllJobsById();
      expect(all["j1"]).toBeDefined();
      expect(all["j2"]).toBeDefined();
      expect(all["j1"].title).toBe("Developer");
      expect(all["j2"].title).toBe("QA");
    });

    it("saves to sessionStorage via saveAccumulatedState", () => {
      const jobs = [makeGeoJob({ jobId: "j1" })];

      ljm.mergeAndDisplay(jobs);

      const stored = JSON.parse(sessionStorage.getItem("ljm_all_jobs"));
      expect(stored).toBeDefined();
      expect(stored["j1"]).toBeDefined();
    });

    it("updates count element with correct total", () => {
      // Pre-populate with one existing job
      ljm._setAllJobsById({ existing: makeGeoJob({ jobId: "existing" }) });

      const jobs = [makeGeoJob({ jobId: "new1" })];
      ljm.mergeAndDisplay(jobs);

      const countEl = document.getElementById("ljm-count");
      expect(countEl.textContent).toBe("2");
    });

    it("shows status message with job count and precise count", () => {
      const jobs = [
        makeGeoJob({ jobId: "j1", hasPreciseAddress: true }),
        makeGeoJob({ jobId: "j2", hasPreciseAddress: false }),
      ];

      ljm.mergeAndDisplay(jobs);

      const statusEl = document.getElementById("ljm-status");
      expect(statusEl.textContent).toContain("2");
      expect(statusEl.textContent).toContain("1 precise");
    });

    it("merges with existing jobs without overwriting", () => {
      ljm._setAllJobsById({
        old1: makeGeoJob({ jobId: "old1", title: "Old Job" }),
      });

      ljm.mergeAndDisplay([makeGeoJob({ jobId: "new1", title: "New Job" })]);

      const all = ljm._getAllJobsById();
      expect(Object.keys(all)).toHaveLength(2);
      expect(all["old1"].title).toBe("Old Job");
      expect(all["new1"].title).toBe("New Job");
    });
  });

  describe("with mock map", () => {
    let mockMap;
    let mockMarkersLayer;

    beforeEach(() => {
      mockMap = {
        fitBounds: vi.fn(),
        invalidateSize: vi.fn(),
        removeLayer: vi.fn(),
        addLayer: vi.fn(),
        getZoom: vi.fn(() => 10),
        setView: vi.fn(),
        zoomIn: vi.fn(),
        zoomOut: vi.fn(),
        closePopup: vi.fn(),
      };
      mockMarkersLayer = {
        clearLayers: vi.fn(),
        addLayer: vi.fn(),
      };
      ljm._setMap(mockMap);
      ljm._setMarkersLayer(mockMarkersLayer);

      // Create filter chips for updateFilterChipCounts
      ["onSite", "hybrid", "remote"].forEach((key) => {
        const chip = document.createElement("button");
        chip.setAttribute("data-filter-key", key);
        document.body.appendChild(chip);
      });
    });

    it("calls displayFilteredResults when map exists", () => {
      const jobs = [
        makeGeoJob({ jobId: "j1", workplaceType: 1 }),
      ];

      ljm.mergeAndDisplay(jobs);

      // displayFilteredResults calls markersLayer.clearLayers + addLayer
      expect(mockMarkersLayer.clearLayers).toHaveBeenCalled();
    });
  });
});


// ===============================================================
// 3. startUrlWatcher()
// ===============================================================

describe("startUrlWatcher", () => {
  beforeEach(() => {
    vi.useFakeTimers();

    const status = document.createElement("div");
    status.id = "ljm-status";
    document.body.appendChild(status);

    const countEl = document.createElement("span");
    countEl.id = "ljm-count";
    countEl.textContent = "0";
    document.body.appendChild(countEl);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates an interval via setInterval", () => {
    const spy = vi.spyOn(global, "setInterval");

    ljm.startUrlWatcher();

    // startUrlWatcher may have been called before (in a prior test); if so the guard
    // `if (urlWatcherInterval) return;` prevents a second setInterval call.
    // We only assert it was called at least once across the entire test suite.
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });

  it("does not create duplicate intervals (guard check)", () => {
    // After the first call (which may have happened in a prior test or above),
    // subsequent calls should be no-ops. We verify by checking setInterval call count
    // stays stable across two additional calls.
    const spy = vi.spyOn(global, "setInterval");

    ljm.startUrlWatcher();
    const countAfterFirst = spy.mock.calls.length;

    ljm.startUrlWatcher();
    const countAfterSecond = spy.mock.calls.length;

    // The second call should not have created another interval
    expect(countAfterSecond).toBe(countAfterFirst);

    spy.mockRestore();
  });

  it("sets up an interval function that monitors URL changes", () => {
    ljm.startUrlWatcher();

    // Advance time to trigger the interval
    vi.advanceTimersByTime(800);

    // Since location.href hasn't changed, status should not show page change message
    const statusEl = document.getElementById("ljm-status");
    expect(statusEl.textContent).not.toContain("Page changed");
  });
});


// ===============================================================
// 4. reattachJobListObserver()
// ===============================================================

describe("reattachJobListObserver", () => {
  beforeEach(() => {
    const status = document.createElement("div");
    status.id = "ljm-status";
    document.body.appendChild(status);

    const countEl = document.createElement("span");
    countEl.id = "ljm-count";
    countEl.textContent = "0";
    document.body.appendChild(countEl);
  });

  it("creates MutationObserver when job list element exists", () => {
    const jobList = document.createElement("div");
    jobList.className = "jobs-search-results-list";
    document.body.appendChild(jobList);

    const observeSpy = vi.spyOn(MutationObserver.prototype, "observe");

    ljm.reattachJobListObserver();

    expect(observeSpy).toHaveBeenCalledWith(jobList, { childList: true, subtree: true });

    observeSpy.mockRestore();
  });

  it("disconnects old observer when called twice", () => {
    const jobList = document.createElement("div");
    jobList.className = "jobs-search-results-list";
    document.body.appendChild(jobList);

    const disconnectSpy = vi.spyOn(MutationObserver.prototype, "disconnect");

    ljm.reattachJobListObserver();
    ljm.reattachJobListObserver();

    // First call creates observer, second call disconnects the first and creates new
    expect(disconnectSpy).toHaveBeenCalled();

    disconnectSpy.mockRestore();
  });

  it("does nothing if no job list element exists", () => {
    const observeSpy = vi.spyOn(MutationObserver.prototype, "observe");

    ljm.reattachJobListObserver();

    expect(observeSpy).not.toHaveBeenCalled();

    observeSpy.mockRestore();
  });

  it("also matches scaffold-layout__list class", () => {
    const jobList = document.createElement("div");
    jobList.className = "scaffold-layout__list";
    document.body.appendChild(jobList);

    const observeSpy = vi.spyOn(MutationObserver.prototype, "observe");

    ljm.reattachJobListObserver();

    expect(observeSpy).toHaveBeenCalledWith(jobList, { childList: true, subtree: true });

    observeSpy.mockRestore();
  });
});


// ===============================================================
// 5. setupKeyboardShortcuts()
// ===============================================================

describe("setupKeyboardShortcuts", () => {
  let panel;
  let cardsListEl;

  // Call setupKeyboardShortcuts only ONCE for this entire describe block.
  // Calling it multiple times stacks event listeners that interfere with each other.
  let keyboardSetupDone = false;

  beforeEach(() => {
    // Create panel
    panel = document.createElement("div");
    panel.id = "ljm-panel";
    document.body.appendChild(panel);
    ljm._setPanelEl(panel);

    // Create cards list
    cardsListEl = document.createElement("div");
    cardsListEl.className = "ljm-cards-list";
    document.body.appendChild(cardsListEl);
    ljm._setCardsListEl(cardsListEl);

    // Create status + count elements for any sub-calls
    const status = document.createElement("div");
    status.id = "ljm-status";
    document.body.appendChild(status);

    const countEl = document.createElement("span");
    countEl.id = "ljm-count";
    countEl.textContent = "0";
    document.body.appendChild(countEl);

    if (!keyboardSetupDone) {
      ljm.setupKeyboardShortcuts();
      keyboardSetupDone = true;
    }
  });

  it("Escape closes panel when panel is visible", () => {
    // Panel is visible (no ljm-hidden class)
    panel.classList.remove("ljm-hidden");
    ljm._setIsFullscreen(false);

    dispatchKey("Escape");

    expect(panel.classList.contains("ljm-hidden")).toBe(true);
  });

  it("Escape exits fullscreen first before closing panel", () => {
    ljm._setIsFullscreen(true);
    panel.classList.add("ljm-fullscreen");
    panel.classList.remove("ljm-hidden");

    // Create the fullscreen button that toggleFullscreen expects
    const fsBtn = document.createElement("button");
    fsBtn.id = "ljm-fs-btn";
    document.body.appendChild(fsBtn);

    dispatchKey("Escape");

    // After pressing Escape in fullscreen, it should toggle fullscreen off
    // but NOT add ljm-hidden (panel stays open)
    expect(panel.classList.contains("ljm-fullscreen")).toBe(false);
  });

  it("ignores keys when focus is on input fields", () => {
    ljm._setIsFullscreen(true);

    // Add some cards
    const card1 = document.createElement("div");
    card1.className = "ljm-job-card ljm-card-active";
    card1.setAttribute("data-ljm-job", "1");
    card1.scrollIntoView = vi.fn();
    cardsListEl.appendChild(card1);

    const card2 = document.createElement("div");
    card2.className = "ljm-job-card";
    card2.setAttribute("data-ljm-job", "2");
    card2.scrollIntoView = vi.fn();
    cardsListEl.appendChild(card2);

    // Create and focus an input
    const input = document.createElement("input");
    input.type = "text";
    document.body.appendChild(input);
    input.focus();

    // Dispatch ArrowDown FROM the input
    dispatchKey("ArrowDown", input);

    // The active card should NOT have changed because input is focused
    expect(card1.classList.contains("ljm-card-active")).toBe(true);
  });

  it("ignores keys when focus is on textarea", () => {
    ljm._setIsFullscreen(true);

    const card1 = document.createElement("div");
    card1.className = "ljm-job-card ljm-card-active";
    card1.setAttribute("data-ljm-job", "1");
    card1.scrollIntoView = vi.fn();
    cardsListEl.appendChild(card1);

    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.focus();

    dispatchKey("ArrowDown", textarea);

    expect(card1.classList.contains("ljm-card-active")).toBe(true);
  });

  it("ArrowDown moves to next card in fullscreen", () => {
    ljm._setIsFullscreen(true);

    const card1 = document.createElement("div");
    card1.className = "ljm-job-card ljm-card-active";
    card1.setAttribute("data-ljm-job", "1");
    card1.scrollIntoView = vi.fn();
    cardsListEl.appendChild(card1);

    const card2 = document.createElement("div");
    card2.className = "ljm-job-card";
    card2.setAttribute("data-ljm-job", "2");
    card2.scrollIntoView = vi.fn();
    cardsListEl.appendChild(card2);

    const card3 = document.createElement("div");
    card3.className = "ljm-job-card";
    card3.setAttribute("data-ljm-job", "3");
    card3.scrollIntoView = vi.fn();
    cardsListEl.appendChild(card3);

    dispatchKey("ArrowDown");

    expect(card1.classList.contains("ljm-card-active")).toBe(false);
    expect(card2.classList.contains("ljm-card-active")).toBe(true);
    expect(card2.scrollIntoView).toHaveBeenCalled();
  });

  it("ArrowUp moves to previous card in fullscreen", () => {
    ljm._setIsFullscreen(true);

    const card1 = document.createElement("div");
    card1.className = "ljm-job-card";
    card1.setAttribute("data-ljm-job", "1");
    card1.scrollIntoView = vi.fn();
    cardsListEl.appendChild(card1);

    const card2 = document.createElement("div");
    card2.className = "ljm-job-card ljm-card-active";
    card2.setAttribute("data-ljm-job", "2");
    card2.scrollIntoView = vi.fn();
    cardsListEl.appendChild(card2);

    const card3 = document.createElement("div");
    card3.className = "ljm-job-card";
    card3.setAttribute("data-ljm-job", "3");
    card3.scrollIntoView = vi.fn();
    cardsListEl.appendChild(card3);

    dispatchKey("ArrowUp");

    expect(card2.classList.contains("ljm-card-active")).toBe(false);
    expect(card1.classList.contains("ljm-card-active")).toBe(true);
    expect(card1.scrollIntoView).toHaveBeenCalled();
  });

  it("ArrowDown wraps around from last card to first", () => {
    ljm._setIsFullscreen(true);

    const card1 = document.createElement("div");
    card1.className = "ljm-job-card";
    card1.setAttribute("data-ljm-job", "1");
    card1.scrollIntoView = vi.fn();
    cardsListEl.appendChild(card1);

    const card2 = document.createElement("div");
    card2.className = "ljm-job-card";
    card2.setAttribute("data-ljm-job", "2");
    card2.scrollIntoView = vi.fn();
    cardsListEl.appendChild(card2);

    const card3 = document.createElement("div");
    card3.className = "ljm-job-card ljm-card-active";
    card3.setAttribute("data-ljm-job", "3");
    card3.scrollIntoView = vi.fn();
    cardsListEl.appendChild(card3);

    dispatchKey("ArrowDown");

    expect(card3.classList.contains("ljm-card-active")).toBe(false);
    expect(card1.classList.contains("ljm-card-active")).toBe(true);
  });

  it("ArrowUp wraps around from first card to last", () => {
    ljm._setIsFullscreen(true);

    const card1 = document.createElement("div");
    card1.className = "ljm-job-card ljm-card-active";
    card1.setAttribute("data-ljm-job", "1");
    card1.scrollIntoView = vi.fn();
    cardsListEl.appendChild(card1);

    const card2 = document.createElement("div");
    card2.className = "ljm-job-card";
    card2.setAttribute("data-ljm-job", "2");
    card2.scrollIntoView = vi.fn();
    cardsListEl.appendChild(card2);

    const card3 = document.createElement("div");
    card3.className = "ljm-job-card";
    card3.setAttribute("data-ljm-job", "3");
    card3.scrollIntoView = vi.fn();
    cardsListEl.appendChild(card3);

    dispatchKey("ArrowUp");

    expect(card1.classList.contains("ljm-card-active")).toBe(false);
    expect(card3.classList.contains("ljm-card-active")).toBe(true);
  });

  it("Enter opens job link for active card", () => {
    ljm._setIsFullscreen(true);

    const openSpy = vi.spyOn(window, "open").mockImplementation(() => {});

    const card = document.createElement("div");
    card.className = "ljm-job-card ljm-card-active";
    card.setAttribute("data-ljm-job", "12345");
    cardsListEl.appendChild(card);

    dispatchKey("Enter");

    expect(openSpy).toHaveBeenCalledWith(
      "https://www.linkedin.com/jobs/view/12345",
      "_blank"
    );

    openSpy.mockRestore();
  });

  it("Enter does nothing when no active card exists", () => {
    ljm._setIsFullscreen(true);

    const openSpy = vi.spyOn(window, "open").mockImplementation(() => {});

    const card = document.createElement("div");
    card.className = "ljm-job-card";
    card.setAttribute("data-ljm-job", "12345");
    cardsListEl.appendChild(card);

    dispatchKey("Enter");

    expect(openSpy).not.toHaveBeenCalled();

    openSpy.mockRestore();
  });

  it("ArrowDown does nothing when not in fullscreen", () => {
    ljm._setIsFullscreen(false);

    const card1 = document.createElement("div");
    card1.className = "ljm-job-card ljm-card-active";
    card1.setAttribute("data-ljm-job", "1");
    card1.scrollIntoView = vi.fn();
    cardsListEl.appendChild(card1);

    const card2 = document.createElement("div");
    card2.className = "ljm-job-card";
    card2.setAttribute("data-ljm-job", "2");
    card2.scrollIntoView = vi.fn();
    cardsListEl.appendChild(card2);

    dispatchKey("ArrowDown");

    // Card1 should still be active since we're not in fullscreen
    expect(card1.classList.contains("ljm-card-active")).toBe(true);
    expect(card2.classList.contains("ljm-card-active")).toBe(false);
  });

  it("ArrowDown does nothing when no cards exist", () => {
    ljm._setIsFullscreen(true);

    // No cards in the cardsListEl - should not throw
    expect(() => dispatchKey("ArrowDown")).not.toThrow();
  });

  it("Enter sanitizes jobId to only alphanumeric characters", () => {
    ljm._setIsFullscreen(true);

    const openSpy = vi.spyOn(window, "open").mockImplementation(() => {});

    const card = document.createElement("div");
    card.className = "ljm-job-card ljm-card-active";
    card.setAttribute("data-ljm-job", "abc-123!@#");
    cardsListEl.appendChild(card);

    dispatchKey("Enter");

    expect(openSpy).toHaveBeenCalledWith(
      "https://www.linkedin.com/jobs/view/abc123",
      "_blank"
    );

    openSpy.mockRestore();
  });
});


// ===============================================================
// 6. updateFilterChipCounts()
// ===============================================================

describe("updateFilterChipCounts", () => {
  beforeEach(() => {
    ["onSite", "hybrid", "remote"].forEach((key) => {
      const chip = document.createElement("button");
      chip.setAttribute("data-filter-key", key);
      document.body.appendChild(chip);
    });
  });

  it("creates count spans in chips with correct counts", () => {
    ljm._setAllJobsById({
      j1: makeGeoJob({ jobId: "j1", workplaceType: 1 }),
      j2: makeGeoJob({ jobId: "j2", workplaceType: 1 }),
      j3: makeGeoJob({ jobId: "j3", workplaceType: 2 }),
      j4: makeGeoJob({ jobId: "j4", workplaceType: 3 }),
      j5: makeGeoJob({ jobId: "j5", workplaceType: 3 }),
      j6: makeGeoJob({ jobId: "j6", workplaceType: 3 }),
    });

    ljm.updateFilterChipCounts();

    const onSiteChip = document.querySelector('[data-filter-key="onSite"]');
    const hybridChip = document.querySelector('[data-filter-key="hybrid"]');
    const remoteChip = document.querySelector('[data-filter-key="remote"]');

    expect(onSiteChip.querySelector(".ljm-chip-count").textContent).toBe("(2)");
    expect(remoteChip.querySelector(".ljm-chip-count").textContent).toBe("(1)");
    expect(hybridChip.querySelector(".ljm-chip-count").textContent).toBe("(3)");
  });

  it("updates existing count spans on second call with different data", () => {
    ljm._setAllJobsById({
      j1: makeGeoJob({ jobId: "j1", workplaceType: 1 }),
    });

    ljm.updateFilterChipCounts();

    const onSiteChip = document.querySelector('[data-filter-key="onSite"]');
    expect(onSiteChip.querySelector(".ljm-chip-count").textContent).toBe("(1)");

    // Now add more jobs and update
    ljm._setAllJobsById({
      j1: makeGeoJob({ jobId: "j1", workplaceType: 1 }),
      j2: makeGeoJob({ jobId: "j2", workplaceType: 1 }),
      j3: makeGeoJob({ jobId: "j3", workplaceType: 1 }),
    });

    ljm.updateFilterChipCounts();

    expect(onSiteChip.querySelector(".ljm-chip-count").textContent).toBe("(3)");
    // Should still be the same span element (not creating duplicates)
    expect(onSiteChip.querySelectorAll(".ljm-chip-count").length).toBe(1);
  });

  it("handles zero counts correctly", () => {
    ljm._setAllJobsById({});

    ljm.updateFilterChipCounts();

    const onSiteChip = document.querySelector('[data-filter-key="onSite"]');
    const hybridChip = document.querySelector('[data-filter-key="hybrid"]');
    const remoteChip = document.querySelector('[data-filter-key="remote"]');

    expect(onSiteChip.querySelector(".ljm-chip-count").textContent).toBe("(0)");
    expect(hybridChip.querySelector(".ljm-chip-count").textContent).toBe("(0)");
    expect(remoteChip.querySelector(".ljm-chip-count").textContent).toBe("(0)");
  });

  it("counts only known workplace types", () => {
    ljm._setAllJobsById({
      j1: makeGeoJob({ jobId: "j1", workplaceType: 1 }),
      j2: makeGeoJob({ jobId: "j2", workplaceType: 99 }), // Unknown type
    });

    ljm.updateFilterChipCounts();

    const onSiteChip = document.querySelector('[data-filter-key="onSite"]');
    expect(onSiteChip.querySelector(".ljm-chip-count").textContent).toBe("(1)");
  });

  it("handles multiple chips with same data-filter-key", () => {
    // Add a second onSite chip (e.g. in different UI locations)
    const extraChip = document.createElement("button");
    extraChip.setAttribute("data-filter-key", "onSite");
    document.body.appendChild(extraChip);

    ljm._setAllJobsById({
      j1: makeGeoJob({ jobId: "j1", workplaceType: 1 }),
    });

    ljm.updateFilterChipCounts();

    const chips = document.querySelectorAll('[data-filter-key="onSite"]');
    chips.forEach((chip) => {
      expect(chip.querySelector(".ljm-chip-count").textContent).toBe("(1)");
    });
  });
});


// ===============================================================
// 7. focusJobInList(jobId)
// ===============================================================

describe("focusJobInList", () => {
  it("scrolls card into view and highlights it", () => {
    vi.useFakeTimers();

    const card = document.createElement("div");
    card.setAttribute("data-job-id", "123");
    card.scrollIntoView = vi.fn();
    card.click = vi.fn();
    document.body.appendChild(card);

    ljm.focusJobInList("123");

    expect(card.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });

    vi.useRealTimers();
  });

  it("highlights card with box shadow", () => {
    vi.useFakeTimers();

    const card = document.createElement("div");
    card.setAttribute("data-job-id", "456");
    card.scrollIntoView = vi.fn();
    card.click = vi.fn();
    document.body.appendChild(card);

    ljm.focusJobInList("456");

    expect(card.style.boxShadow).toBe("inset 0 0 0 2px #f59e0b");

    vi.useRealTimers();
  });

  it("removes box shadow highlight after timeout", () => {
    vi.useFakeTimers();

    const card = document.createElement("div");
    card.setAttribute("data-job-id", "789");
    card.scrollIntoView = vi.fn();
    card.click = vi.fn();
    document.body.appendChild(card);

    ljm.focusJobInList("789");

    expect(card.style.boxShadow).toBe("inset 0 0 0 2px #f59e0b");

    vi.advanceTimersByTime(2500);

    expect(card.style.boxShadow).toBe("");

    vi.useRealTimers();
  });

  it("does nothing if card not found", () => {
    // Should not throw
    expect(() => ljm.focusJobInList("nonexistent")).not.toThrow();
  });

  it("clicks the card after a 300ms delay", () => {
    vi.useFakeTimers();

    const card = document.createElement("div");
    card.setAttribute("data-job-id", "click-test");
    card.scrollIntoView = vi.fn();
    card.click = vi.fn();
    document.body.appendChild(card);

    ljm.focusJobInList("click-test");

    // Click hasn't happened yet
    expect(card.click).not.toHaveBeenCalled();

    // After 300ms, click should happen
    vi.advanceTimersByTime(300);
    expect(card.click).toHaveBeenCalled();

    vi.useRealTimers();
  });
});


// ===============================================================
// 8. focusJobInCardsPanel(jobId)
// ===============================================================

describe("focusJobInCardsPanel", () => {
  let cardsListEl;

  beforeEach(() => {
    cardsListEl = document.createElement("div");
    cardsListEl.className = "ljm-cards-list";
    document.body.appendChild(cardsListEl);
    ljm._setCardsListEl(cardsListEl);
  });

  it("adds ljm-card-active class to the matching card", () => {
    ljm._setIsFullscreen(true);

    const card = document.createElement("div");
    card.setAttribute("data-ljm-job", "j1");
    card.scrollIntoView = vi.fn();
    cardsListEl.appendChild(card);

    ljm.focusJobInCardsPanel("j1");

    expect(card.classList.contains("ljm-card-active")).toBe(true);
  });

  it("removes active class from previous card", () => {
    ljm._setIsFullscreen(true);

    const card1 = document.createElement("div");
    card1.setAttribute("data-ljm-job", "j1");
    card1.classList.add("ljm-card-active");
    card1.scrollIntoView = vi.fn();
    cardsListEl.appendChild(card1);

    const card2 = document.createElement("div");
    card2.setAttribute("data-ljm-job", "j2");
    card2.scrollIntoView = vi.fn();
    cardsListEl.appendChild(card2);

    ljm.focusJobInCardsPanel("j2");

    expect(card1.classList.contains("ljm-card-active")).toBe(false);
    expect(card2.classList.contains("ljm-card-active")).toBe(true);
  });

  it("does nothing if not fullscreen", () => {
    ljm._setIsFullscreen(false);

    const card = document.createElement("div");
    card.setAttribute("data-ljm-job", "j1");
    card.scrollIntoView = vi.fn();
    cardsListEl.appendChild(card);

    ljm.focusJobInCardsPanel("j1");

    expect(card.classList.contains("ljm-card-active")).toBe(false);
  });

  it("does nothing if cardsListEl is null", () => {
    ljm._setCardsListEl(null);
    ljm._setIsFullscreen(true);

    // Should not throw
    expect(() => ljm.focusJobInCardsPanel("j1")).not.toThrow();
  });

  it("does nothing if card is not found in the panel", () => {
    ljm._setIsFullscreen(true);

    const card = document.createElement("div");
    card.setAttribute("data-ljm-job", "j1");
    card.classList.add("ljm-card-active");
    cardsListEl.appendChild(card);

    // Focus on a non-existent job
    ljm.focusJobInCardsPanel("nonexistent");

    // Previous card should still have active class because there's no new match
    // The function exits early after querySelector returns null
    expect(card.classList.contains("ljm-card-active")).toBe(true);
  });

  it("scrolls the card into view", () => {
    ljm._setIsFullscreen(true);

    const card = document.createElement("div");
    card.setAttribute("data-ljm-job", "scroll-test");
    card.scrollIntoView = vi.fn();
    cardsListEl.appendChild(card);

    ljm.focusJobInCardsPanel("scroll-test");

    expect(card.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
  });
});


// ===============================================================
// 9. displayFilteredResults() (integration with map)
// ===============================================================

describe("displayFilteredResults", () => {
  let mockMap;
  let mockMarkersLayer;

  beforeEach(() => {
    const status = document.createElement("div");
    status.id = "ljm-status";
    document.body.appendChild(status);

    const countEl = document.createElement("span");
    countEl.id = "ljm-count";
    countEl.textContent = "0";
    document.body.appendChild(countEl);

    // Create filter chips
    ["onSite", "hybrid", "remote"].forEach((key) => {
      const chip = document.createElement("button");
      chip.setAttribute("data-filter-key", key);
      document.body.appendChild(chip);
    });

    mockMap = {
      fitBounds: vi.fn(),
      invalidateSize: vi.fn(),
      removeLayer: vi.fn(),
      addLayer: vi.fn(),
      getZoom: vi.fn(() => 10),
      setView: vi.fn(),
    };
    mockMarkersLayer = {
      clearLayers: vi.fn(),
      addLayer: vi.fn(),
    };
    ljm._setMap(mockMap);
    ljm._setMarkersLayer(mockMarkersLayer);
  });

  it("updates status bar with mapped summary", () => {
    ljm._setAllJobsById({
      j1: makeGeoJob({ jobId: "j1", workplaceType: 1, hasPreciseAddress: true }),
      j2: makeGeoJob({ jobId: "j2", workplaceType: 2, hasPreciseAddress: false }),
      j3: makeGeoJob({ jobId: "j3", workplaceType: 3, hasPreciseAddress: true }),
    });

    ljm.displayFilteredResults();

    const statusEl = document.getElementById("ljm-status");
    expect(statusEl.textContent).toContain("3 mapped");
    expect(statusEl.textContent).toContain("2 precise");
  });

  it("updates count badge to total jobs", () => {
    ljm._setAllJobsById({
      j1: makeGeoJob({ jobId: "j1" }),
      j2: makeGeoJob({ jobId: "j2" }),
    });

    ljm.displayFilteredResults();

    const countEl = document.getElementById("ljm-count");
    expect(countEl.textContent).toBe("2");
  });

  it("renders job cards when in fullscreen mode", () => {
    ljm._setIsFullscreen(true);
    const cardsListEl = document.createElement("div");
    cardsListEl.className = "ljm-cards-list";
    document.body.appendChild(cardsListEl);
    ljm._setCardsListEl(cardsListEl);

    const badgeEl = document.createElement("span");
    ljm._setCardsBadgeEl(badgeEl);

    const footerTimeEl = document.createElement("span");
    ljm._setCardsFooterTimeEl(footerTimeEl);

    ljm._setAllJobsById({
      j1: makeGeoJob({ jobId: "j1", title: "Developer" }),
    });

    ljm.displayFilteredResults();

    const cards = cardsListEl.querySelectorAll(".ljm-job-card");
    expect(cards.length).toBe(1);
  });

  it("respects filter state in display", () => {
    ljm._setAllJobsById({
      j1: makeGeoJob({ jobId: "j1", workplaceType: 1 }),
      j2: makeGeoJob({ jobId: "j2", workplaceType: 2 }),
    });
    ljm._setFilterState({ onSite: true, hybrid: true, remote: false });

    ljm.displayFilteredResults();

    const statusEl = document.getElementById("ljm-status");
    // Only 1 job should be mapped (remote is filtered out)
    expect(statusEl.textContent).toContain("1 mapped");
  });
});


// ===============================================================
// 10. loadPageJobs(csrf) - integration pipeline test
// ===============================================================

describe("loadPageJobs", () => {
  beforeEach(() => {
    const status = document.createElement("div");
    status.id = "ljm-status";
    document.body.appendChild(status);

    const countEl = document.createElement("span");
    countEl.id = "ljm-count";
    countEl.textContent = "0";
    document.body.appendChild(countEl);
  });

  it("returns empty array when no new job IDs found", async () => {
    // No DOM cards at all
    const result = await ljm.loadPageJobs("csrf-tok");
    expect(result).toEqual([]);
  });

  it("returns empty array when all job IDs already exist", async () => {
    ljm._setAllJobsById({
      existing: makeGeoJob({ jobId: "existing" }),
    });

    const card = document.createElement("div");
    card.setAttribute("data-job-id", "existing");
    document.body.appendChild(card);

    const result = await ljm.loadPageJobs("csrf-tok");
    expect(result).toEqual([]);
  });

  it("processes full pipeline: fetch -> enrich -> geocode", async () => {
    const card = document.createElement("div");
    card.setAttribute("data-job-id", "new-job");
    document.body.appendChild(card);

    // fetchJobWithCompany
    mockFetchResponse({
      data: {
        title: "Full Stack Dev",
        formattedLocation: "Istanbul, TR",
        workplaceTypes: ["urn:li:fs_workplaceType:1"],
        companyDetails: { company: "urn:li:company:555" },
        listedAt: 1700000000000,
      },
    });

    // fetchCompanyLocations
    mockFetchResponse({
      data: {
        headquarter: {
          address: { city: "Istanbul", country: "TR" },
          geoLocation: { latitude: 41.05, longitude: 29.05 },
        },
        confirmedLocations: [],
        groupedLocationsByCountry: [],
        logo: null,
      },
    });

    // No geocode fetch needed because directLat/directLng are set from company

    const result = await ljm.loadPageJobs("csrf-tok");

    expect(result).toHaveLength(1);
    expect(result[0].jobId).toBe("new-job");
    expect(result[0].title).toBe("Full Stack Dev");
    expect(result[0].lat).toBe(41.05);
    expect(result[0].lng).toBe(29.05);
  });
});


// ===============================================================
// 11. toggleFullscreen()
// ===============================================================

describe("toggleFullscreen", () => {
  beforeEach(() => {
    const panel = document.createElement("div");
    panel.id = "ljm-panel";
    document.body.appendChild(panel);
    ljm._setPanelEl(panel);

    const fsBtn = document.createElement("button");
    fsBtn.id = "ljm-fs-btn";
    document.body.appendChild(fsBtn);

    const status = document.createElement("div");
    status.id = "ljm-status";
    document.body.appendChild(status);

    const countEl = document.createElement("span");
    countEl.id = "ljm-count";
    countEl.textContent = "0";
    document.body.appendChild(countEl);
  });

  it("enters fullscreen mode when not fullscreen", () => {
    ljm._setIsFullscreen(false);

    const cardsListEl = document.createElement("div");
    cardsListEl.className = "ljm-cards-list";
    document.body.appendChild(cardsListEl);
    ljm._setCardsListEl(cardsListEl);

    const badgeEl = document.createElement("span");
    ljm._setCardsBadgeEl(badgeEl);
    const footerTimeEl = document.createElement("span");
    ljm._setCardsFooterTimeEl(footerTimeEl);

    ljm.toggleFullscreen();

    const panel = document.getElementById("ljm-panel");
    expect(panel.classList.contains("ljm-fullscreen")).toBe(true);
    expect(document.body.classList.contains("ljm-fs-active")).toBe(true);
  });

  it("exits fullscreen mode when already fullscreen", () => {
    ljm._setIsFullscreen(true);

    const panel = document.getElementById("ljm-panel");
    panel.classList.add("ljm-fullscreen");
    document.body.classList.add("ljm-fs-active");

    ljm.toggleFullscreen();

    expect(panel.classList.contains("ljm-fullscreen")).toBe(false);
    expect(document.body.classList.contains("ljm-fs-active")).toBe(false);
  });

  it("updates fullscreen button text and tooltip", () => {
    ljm._setIsFullscreen(false);

    const cardsListEl = document.createElement("div");
    cardsListEl.className = "ljm-cards-list";
    document.body.appendChild(cardsListEl);
    ljm._setCardsListEl(cardsListEl);

    const badgeEl = document.createElement("span");
    ljm._setCardsBadgeEl(badgeEl);
    const footerTimeEl = document.createElement("span");
    ljm._setCardsFooterTimeEl(footerTimeEl);

    ljm.toggleFullscreen();

    const fsBtn = document.getElementById("ljm-fs-btn");
    expect(fsBtn.textContent).toBe("\u2716"); // close icon
    expect(fsBtn.getAttribute("data-tooltip")).toBe("Exit fullscreen");
  });
});


// ===============================================================
// 12. renderJobCards(jobs)
// ===============================================================

describe("renderJobCards", () => {
  let cardsListEl;
  let badgeEl;
  let footerTimeEl;

  beforeEach(() => {
    cardsListEl = document.createElement("div");
    cardsListEl.className = "ljm-cards-list";
    document.body.appendChild(cardsListEl);
    ljm._setCardsListEl(cardsListEl);

    badgeEl = document.createElement("span");
    ljm._setCardsBadgeEl(badgeEl);

    footerTimeEl = document.createElement("span");
    ljm._setCardsFooterTimeEl(footerTimeEl);
  });

  it("renders job cards with correct data attributes", () => {
    const jobs = [
      makeGeoJob({ jobId: "j1", title: "Dev", company: "Co" }),
      makeGeoJob({ jobId: "j2", title: "QA", company: "Inc" }),
    ];

    ljm.renderJobCards(jobs);

    const cards = cardsListEl.querySelectorAll(".ljm-job-card");
    expect(cards).toHaveLength(2);
    expect(cards[0].getAttribute("data-ljm-job")).toBe("j1");
    expect(cards[1].getAttribute("data-ljm-job")).toBe("j2");
  });

  it("marks first card as active by default", () => {
    ljm.renderJobCards([makeGeoJob({ jobId: "j1" })]);

    const firstCard = cardsListEl.querySelector(".ljm-job-card");
    expect(firstCard.classList.contains("ljm-card-active")).toBe(true);
  });

  it("updates badge with job count", () => {
    ljm.renderJobCards([
      makeGeoJob({ jobId: "j1" }),
      makeGeoJob({ jobId: "j2" }),
    ]);

    expect(badgeEl.textContent).toBe("2");
  });

  it("shows empty message when no jobs provided", () => {
    ljm.renderJobCards([]);

    const emptyMsg = cardsListEl.querySelector(".ljm-cards-empty");
    expect(emptyMsg).not.toBeNull();
    expect(emptyMsg.textContent).toBe("No jobs match filters.");
  });

  it("clears previous cards before rendering new ones", () => {
    ljm.renderJobCards([makeGeoJob({ jobId: "j1" })]);
    expect(cardsListEl.querySelectorAll(".ljm-job-card")).toHaveLength(1);

    ljm.renderJobCards([
      makeGeoJob({ jobId: "j2" }),
      makeGeoJob({ jobId: "j3" }),
    ]);
    expect(cardsListEl.querySelectorAll(".ljm-job-card")).toHaveLength(2);
  });

  it("does nothing if cardsListEl is null", () => {
    ljm._setCardsListEl(null);

    // Should not throw
    expect(() => ljm.renderJobCards([makeGeoJob()])).not.toThrow();
  });

  it("shows workplace type tag on cards", () => {
    ljm.renderJobCards([makeGeoJob({ jobId: "j1", workplaceType: 3 })]);

    const tag = cardsListEl.querySelector(".ljm-tag-hybrid");
    expect(tag).not.toBeNull();
    expect(tag.textContent).toBe("Hybrid");
  });

  it("shows time tag when listedAt is present", () => {
    ljm.renderJobCards([
      makeGeoJob({ jobId: "j1", listedAt: Date.now() - 3600000 }),
    ]);

    const timeTag = cardsListEl.querySelector(".ljm-tag-time");
    expect(timeTag).not.toBeNull();
    expect(timeTag.textContent).toContain("h ago");
  });
});


// ===============================================================
// 13. setStatus() and setCount()
// ===============================================================

describe("setStatus", () => {
  beforeEach(() => {
    const status = document.createElement("div");
    status.id = "ljm-status";
    document.body.appendChild(status);
  });

  it("sets plain text status", () => {
    ljm.setStatus("Hello World");

    const el = document.getElementById("ljm-status");
    expect(el.textContent).toBe("Hello World");
  });

  it("shows spinner when showSpinner is true", () => {
    ljm.setStatus("Loading...", true);

    const el = document.getElementById("ljm-status");
    const spinner = el.querySelector(".ljm-spinner");
    expect(spinner).not.toBeNull();
    expect(el.textContent).toContain("Loading...");
  });

  it("does not show spinner when showSpinner is false", () => {
    ljm.setStatus("Done");

    const el = document.getElementById("ljm-status");
    const spinner = el.querySelector(".ljm-spinner");
    expect(spinner).toBeNull();
  });

  it("does nothing if status element does not exist", () => {
    cleanupDOM();

    // Should not throw
    expect(() => ljm.setStatus("No element")).not.toThrow();
  });
});

describe("setCount", () => {
  beforeEach(() => {
    const count = document.createElement("span");
    count.id = "ljm-count";
    count.textContent = "0";
    document.body.appendChild(count);
  });

  it("updates count text", () => {
    ljm.setCount(42);

    const el = document.getElementById("ljm-count");
    expect(el.textContent).toBe("42");
  });

  it("handles zero count", () => {
    ljm.setCount(0);

    const el = document.getElementById("ljm-count");
    expect(el.textContent).toBe("0");
  });

  it("does nothing if count element does not exist", () => {
    cleanupDOM();

    expect(() => ljm.setCount(5)).not.toThrow();
  });
});


// ===============================================================
// 14. captureCompanyNamesFromDOM()
// ===============================================================

describe("captureCompanyNamesFromDOM", () => {
  it("captures company names from job cards in the DOM", () => {
    const card = document.createElement("div");
    card.setAttribute("data-job-id", "cap-1");
    const companyEl = document.createElement("div");
    companyEl.className = "job-card-container__primary-description";
    companyEl.textContent = "  Captured Corp  ";
    card.appendChild(companyEl);
    document.body.appendChild(card);

    ljm.captureCompanyNamesFromDOM();

    expect(ljm.getCompanyName("cap-1")).toBe("Captured Corp");
  });

  it("does not overwrite existing company names", () => {
    ljm._setCompanyNames({ "cap-1": "Existing Corp" });

    const card = document.createElement("div");
    card.setAttribute("data-job-id", "cap-1");
    const companyEl = document.createElement("div");
    companyEl.className = "job-card-container__primary-description";
    companyEl.textContent = "New Corp";
    card.appendChild(companyEl);
    document.body.appendChild(card);

    ljm.captureCompanyNamesFromDOM();

    expect(ljm.getCompanyName("cap-1")).toBe("Existing Corp");
  });

  it("saves company names to sessionStorage", () => {
    const card = document.createElement("div");
    card.setAttribute("data-job-id", "cap-2");
    const companyEl = document.createElement("div");
    companyEl.className = "artdeco-entity-lockup__subtitle";
    companyEl.textContent = "Saved Corp";
    card.appendChild(companyEl);
    document.body.appendChild(card);

    ljm.captureCompanyNamesFromDOM();

    const stored = JSON.parse(sessionStorage.getItem("ljm_company_names"));
    expect(stored["cap-2"]).toBe("Saved Corp");
  });
});


// ===============================================================
// 15. csvEscape()
// ===============================================================

describe("csvEscape", () => {
  it("returns plain text as-is", () => {
    expect(ljm.csvEscape("hello")).toBe("hello");
  });

  it("wraps text with commas in quotes", () => {
    expect(ljm.csvEscape("a,b")).toBe('"a,b"');
  });

  it("escapes double quotes by doubling them", () => {
    expect(ljm.csvEscape('say "hi"')).toBe('"say ""hi"""');
  });

  it("wraps text with newlines in quotes", () => {
    expect(ljm.csvEscape("line1\nline2")).toBe('"line1\nline2"');
  });

  it("handles null by converting to empty string", () => {
    expect(ljm.csvEscape(null)).toBe("");
  });

  it("handles undefined by converting to empty string", () => {
    expect(ljm.csvEscape(undefined)).toBe("");
  });
});
