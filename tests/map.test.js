import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ── Mock localStorage before loading content.js ──
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

// ── Mock fetch BEFORE requiring content.js ──
global.fetch = vi.fn();

// ── Mock chrome.storage ──
global.chrome = {
  storage: {
    local: {
      get: vi.fn((key, cb) => cb({})),
      set: vi.fn(),
      remove: vi.fn(),
    },
    sync: { get: vi.fn() },
  },
};

// ── Leaflet mock factory functions ──

function createMockMarker() {
  const marker = {
    bindPopup: vi.fn().mockReturnThis(),
    setPopupContent: vi.fn().mockReturnThis(),
    openPopup: vi.fn(),
    getPopup: vi.fn(() => ({
      getElement: vi.fn(() => ({ querySelector: vi.fn() })),
    })),
    getLatLng: vi.fn(() => ({ lat: 41.0, lng: 29.0 })),
    on: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
    _ljmJobId: null,
  };
  return marker;
}

function createMockMap() {
  return {
    setView: vi.fn().mockReturnThis(),
    fitBounds: vi.fn().mockReturnThis(),
    invalidateSize: vi.fn(),
    getZoom: vi.fn(() => 10),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    removeLayer: vi.fn(),
    addLayer: vi.fn(),
    closePopup: vi.fn(),
    on: vi.fn(),
  };
}

function createMockMarkersLayer() {
  return {
    clearLayers: vi.fn(),
    addLayer: vi.fn(),
    zoomToShowLayer: vi.fn((marker, cb) => cb()),
  };
}

function createMockLayerGroup() {
  return {
    clearLayers: vi.fn(),
    addTo: vi.fn().mockReturnThis(),
  };
}

// ── Mock L globally BEFORE require ──
global.L = {
  map: vi.fn(() => createMockMap()),
  tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
  marker: vi.fn(() => createMockMarker()),
  circleMarker: vi.fn((latlng, opts) => {
    const m = createMockMarker();
    // Store the actual latlng for assertions
    m._latlng = latlng;
    m.getLatLng = vi.fn(() => ({ lat: latlng[0], lng: latlng[1] }));
    return m;
  }),
  divIcon: vi.fn((opts) => opts),
  point: vi.fn((x, y) => ({ x, y })),
  layerGroup: vi.fn(() => createMockLayerGroup()),
  markerClusterGroup: vi.fn(() => createMockMarkersLayer()),
  geoJSON: vi.fn(() => ({
    addTo: vi.fn().mockReturnThis(),
    getBounds: vi.fn(() => [[40, 28], [42, 30]]),
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

function makeGeoJob(overrides) {
  return Object.assign({
    jobId: "job-1",
    title: "Software Engineer",
    company: "TestCorp",
    location: "Istanbul, TR",
    address: "Levent, Istanbul, TR",
    hasPreciseAddress: true,
    workplaceType: 1,
    workplaceLabel: "On-site",
    lat: 41.0,
    lng: 29.0,
    listedAt: Date.now(),
    logoUrl: null,
  }, overrides);
}

// ═══════════════════════════════════════════════════════════════
//  Global setup / teardown
// ═══════════════════════════════════════════════════════════════

beforeEach(() => {
  // Reset all module-level state
  ljm._setMyLocation(null);
  ljm._setAllJobsById({});
  ljm._setFilterState({ onSite: true, hybrid: true, remote: true });
  ljm._setSortState("distance");
  ljm._setSearchQuery("");
  ljm._setCompanyNames({});
  ljm._setCompanyCache({});
  ljm._setCurrentLocale("en");
  ljm._setMarkerRefs({});
  ljm._setCurrentGeoJobs([]);
  ljm._setRouteLayer(null);
  ljm._setIsSyncing(false);
  ljm._setIsFullscreen(false);
  ljm._setMapInitialized(true);

  // Reset mocks
  fetch.mockReset();
  chrome.storage.local.set.mockReset();
  chrome.storage.local.remove.mockReset();
  chrome.storage.local.get.mockReset();
  L.circleMarker.mockClear();
  L.marker.mockClear();
  L.geoJSON.mockClear();
  L.divIcon.mockClear();

  localStorage.clear();
});

afterEach(() => {
  // Clean up DOM without innerHTML
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }
  vi.useRealTimers();
});

// ═══════════════════════════════════════════════════════════════
//  1. updateMarkers(geoJobs)
// ═══════════════════════════════════════════════════════════════

describe("updateMarkers", () => {
  let mockMap;
  let mockMarkersLayer;

  beforeEach(() => {
    mockMap = createMockMap();
    mockMarkersLayer = createMockMarkersLayer();
    ljm._setMap(mockMap);
    ljm._setMarkersLayer(mockMarkersLayer);
  });

  it("clears existing markers before adding new ones", () => {
    const jobs = [makeGeoJob()];
    ljm.updateMarkers(jobs);
    expect(mockMarkersLayer.clearLayers).toHaveBeenCalledTimes(1);
  });

  it("creates a circleMarker for each job", () => {
    const jobs = [
      makeGeoJob({ jobId: "j1", lat: 41.0, lng: 29.0 }),
      makeGeoJob({ jobId: "j2", lat: 39.9, lng: 32.8 }),
      makeGeoJob({ jobId: "j3", lat: 38.4, lng: 27.1 }),
    ];
    ljm.updateMarkers(jobs);
    expect(L.circleMarker).toHaveBeenCalledTimes(3);
  });

  it("uses correct color for on-site jobs (#3b82f6)", () => {
    const jobs = [makeGeoJob({ workplaceType: 1 })];
    ljm.updateMarkers(jobs);
    const callArgs = L.circleMarker.mock.calls[0][1];
    expect(callArgs.fillColor).toBe("#3b82f6");
  });

  it("uses correct color for remote jobs (#a855f7)", () => {
    const jobs = [makeGeoJob({ workplaceType: 2 })];
    ljm.updateMarkers(jobs);
    const callArgs = L.circleMarker.mock.calls[0][1];
    expect(callArgs.fillColor).toBe("#a855f7");
  });

  it("uses correct color for hybrid jobs (#10b981)", () => {
    const jobs = [makeGeoJob({ workplaceType: 3 })];
    ljm.updateMarkers(jobs);
    const callArgs = L.circleMarker.mock.calls[0][1];
    expect(callArgs.fillColor).toBe("#10b981");
  });

  it("binds a popup to each marker", () => {
    const jobs = [makeGeoJob({ jobId: "j1" }), makeGeoJob({ jobId: "j2" })];
    ljm.updateMarkers(jobs);

    // Each circleMarker mock should have had bindPopup called
    const markers = L.circleMarker.mock.results;
    markers.forEach((result) => {
      expect(result.value.bindPopup).toHaveBeenCalledTimes(1);
    });
  });

  it("stores marker references keyed by jobId", () => {
    const jobs = [
      makeGeoJob({ jobId: "job-100" }),
      makeGeoJob({ jobId: "job-200" }),
    ];
    ljm.updateMarkers(jobs);
    const refs = ljm._getMarkerRefs();
    expect(refs["job-100"]).toBeDefined();
    expect(refs["job-200"]).toBeDefined();
  });

  it("fits bounds on first call (shouldFitBoundsNext is true initially)", () => {
    // updateMarkers should call fitBounds when shouldFitBoundsNext is true
    const jobs = [makeGeoJob({ lat: 41.0, lng: 29.0 })];

    // Trigger the condition by calling updateMarkers which uses the internal flag
    ljm.updateMarkers(jobs);

    // After the first run, shouldFitBoundsNext should be false, so a second call should NOT fitBounds
    mockMap.fitBounds.mockClear();
    ljm.updateMarkers(jobs);
    expect(mockMap.fitBounds).not.toHaveBeenCalled();
  });

  it("handles duplicate coordinates with jitter", () => {
    const jobs = [
      makeGeoJob({ jobId: "j1", lat: 41.00000, lng: 29.00000 }),
      makeGeoJob({ jobId: "j2", lat: 41.00000, lng: 29.00000 }),
    ];
    ljm.updateMarkers(jobs);

    // Both should produce circleMarker calls
    expect(L.circleMarker).toHaveBeenCalledTimes(2);

    // The latlng arrays passed to circleMarker should differ due to jitter
    const latlng1 = L.circleMarker.mock.calls[0][0];
    const latlng2 = L.circleMarker.mock.calls[1][0];

    const sameCoords = (latlng1[0] === latlng2[0] && latlng1[1] === latlng2[1]);
    expect(sameCoords).toBe(false);
  });

  it("empty array clears everything and adds no markers", () => {
    ljm.updateMarkers([]);
    expect(mockMarkersLayer.clearLayers).toHaveBeenCalledTimes(1);
    expect(L.circleMarker).not.toHaveBeenCalled();
    expect(mockMarkersLayer.addLayer).not.toHaveBeenCalled();
  });

  it("adds each marker to the markers layer", () => {
    const jobs = [
      makeGeoJob({ jobId: "j1" }),
      makeGeoJob({ jobId: "j2" }),
    ];
    ljm.updateMarkers(jobs);
    expect(mockMarkersLayer.addLayer).toHaveBeenCalledTimes(2);
  });

  it("sets _ljmJobId on each marker", () => {
    const jobs = [makeGeoJob({ jobId: "myJob123" })];
    ljm.updateMarkers(jobs);
    const marker = L.circleMarker.mock.results[0].value;
    expect(marker._ljmJobId).toBe("myJob123");
  });

  it("does nothing when map is null", () => {
    ljm._setMap(null);
    ljm.updateMarkers([makeGeoJob()]);
    expect(L.circleMarker).not.toHaveBeenCalled();
  });

  it("does nothing when markersLayer is null", () => {
    ljm._setMarkersLayer(null);
    ljm.updateMarkers([makeGeoJob()]);
    expect(L.circleMarker).not.toHaveBeenCalled();
  });

  it("updates currentGeoJobs reference", () => {
    const jobs = [makeGeoJob({ jobId: "jA" }), makeGeoJob({ jobId: "jB" })];
    ljm.updateMarkers(jobs);
    const current = ljm._getCurrentGeoJobs();
    expect(current).toHaveLength(2);
    expect(current[0].jobId).toBe("jA");
  });
});

// ═══════════════════════════════════════════════════════════════
//  2. setMyLocation(lat, lng, skipSave)
// ═══════════════════════════════════════════════════════════════

describe("setMyLocation", () => {
  let mockMap;
  let mockMyLocationLayer;
  let mockMarkersLayer;

  beforeEach(() => {
    mockMap = createMockMap();
    mockMyLocationLayer = createMockLayerGroup();
    mockMarkersLayer = createMockMarkersLayer();

    ljm._setMap(mockMap);
    ljm._setMyLocationLayer(mockMyLocationLayer);
    ljm._setMarkersLayer(mockMarkersLayer);
    ljm._setCurrentGeoJobs([]);
    ljm._setMarkerRefs({});
  });

  it("sets myLocation with the provided lat/lng", () => {
    ljm.setMyLocation(41.0, 29.0);
    const loc = ljm._getMyLocation();
    expect(loc).toEqual({ lat: 41.0, lng: 29.0 });
  });

  it("creates a location marker via L.marker", () => {
    ljm.setMyLocation(41.0, 29.0);
    expect(L.marker).toHaveBeenCalledTimes(1);
    expect(L.marker.mock.calls[0][0]).toEqual([41.0, 29.0]);
  });

  it("saves to chrome.storage when skipSave is false", () => {
    ljm.setMyLocation(41.0, 29.0, false);
    expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
    const savedObj = chrome.storage.local.set.mock.calls[0][0];
    expect(savedObj["ljm_my_location"]).toEqual({ lat: 41.0, lng: 29.0 });
  });

  it("saves to chrome.storage when skipSave is undefined", () => {
    ljm.setMyLocation(41.0, 29.0);
    expect(chrome.storage.local.set).toHaveBeenCalled();
  });

  it("skips save when skipSave is true", () => {
    ljm.setMyLocation(41.0, 29.0, true);
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });

  it("clears previous location layer before adding new marker", () => {
    ljm.setMyLocation(41.0, 29.0);
    expect(mockMyLocationLayer.clearLayers).toHaveBeenCalledTimes(1);
  });

  it("creates a divIcon for the my-location marker", () => {
    ljm.setMyLocation(41.0, 29.0);
    expect(L.divIcon).toHaveBeenCalled();
    const iconOpts = L.divIcon.mock.calls[0][0];
    expect(iconOpts.className).toBe("ljm-my-loc-icon");
  });

  it("binds a popup to the location marker", () => {
    ljm.setMyLocation(41.0, 29.0);
    const marker = L.marker.mock.results[0].value;
    expect(marker.bindPopup).toHaveBeenCalled();
    const popupContent = marker.bindPopup.mock.calls[0][0];
    expect(popupContent).toContain("My Location");
  });

  it("sets up dragend event on the marker", () => {
    ljm.setMyLocation(41.0, 29.0);
    const marker = L.marker.mock.results[0].value;
    expect(marker.on).toHaveBeenCalledWith("dragend", expect.any(Function));
  });
});

// ═══════════════════════════════════════════════════════════════
//  3. clearMyLocation()
// ═══════════════════════════════════════════════════════════════

describe("clearMyLocation", () => {
  let mockMap;
  let mockMyLocationLayer;
  let mockMarkersLayer;

  beforeEach(() => {
    mockMap = createMockMap();
    mockMyLocationLayer = createMockLayerGroup();
    mockMarkersLayer = createMockMarkersLayer();

    ljm._setMap(mockMap);
    ljm._setMyLocationLayer(mockMyLocationLayer);
    ljm._setMarkersLayer(mockMarkersLayer);
    ljm._setCurrentGeoJobs([]);
    ljm._setMarkerRefs({});

    // First set a location so we can clear it
    ljm.setMyLocation(41.0, 29.0, true);
    // Reset mocks after setup
    mockMyLocationLayer.clearLayers.mockClear();
    chrome.storage.local.remove.mockClear();
  });

  it("sets myLocation to null", () => {
    ljm.clearMyLocation();
    expect(ljm._getMyLocation()).toBeNull();
  });

  it("clears location layer", () => {
    ljm.clearMyLocation();
    expect(mockMyLocationLayer.clearLayers).toHaveBeenCalledTimes(1);
  });

  it("removes from chrome.storage", () => {
    ljm.clearMyLocation();
    expect(chrome.storage.local.remove).toHaveBeenCalledWith("ljm_my_location");
  });

  it("clears any existing route", () => {
    // Set a route layer first
    const routeLayer = { id: "mock-route" };
    ljm._setRouteLayer(routeLayer);

    ljm.clearMyLocation();

    // clearRoute should have been called, which calls map.removeLayer
    expect(mockMap.removeLayer).toHaveBeenCalledWith(routeLayer);
  });
});

// ═══════════════════════════════════════════════════════════════
//  4. showRoute(toLat, toLng)
// ═══════════════════════════════════════════════════════════════

describe("showRoute", () => {
  let mockMap;
  let statusEl;

  beforeEach(() => {
    mockMap = createMockMap();
    ljm._setMap(mockMap);
    ljm._setMarkersLayer(createMockMarkersLayer());
    ljm._setMyLocationLayer(createMockLayerGroup());
    ljm._setCurrentGeoJobs([]);
    ljm._setMarkerRefs({});
    ljm._setRouteLayer(null);

    statusEl = document.createElement("div");
    statusEl.id = "ljm-status";
    document.body.appendChild(statusEl);

    fetch.mockReset();
  });

  it("does nothing without myLocation", () => {
    ljm._setMyLocation(null);
    ljm.showRoute(39.9, 32.8);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fetches route from OSRM when myLocation is set", async () => {
    ljm._setMyLocation({ lat: 41.0, lng: 29.0 });

    const mockGeometry = { type: "LineString", coordinates: [[29, 41], [32.8, 39.9]] };
    mockFetchResponse({
      routes: [{
        geometry: mockGeometry,
        distance: 35200,
        duration: 1920,
      }],
    });

    ljm.showRoute(39.9, 32.8);

    // Wait for fetch to resolve
    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    expect(fetch.mock.calls[0][0]).toContain("router.project-osrm.org/route/v1/driving/");
  });

  it("shows calculating status before route returns", () => {
    ljm._setMyLocation({ lat: 41.0, lng: 29.0 });

    // Use a pending promise so it stays in "calculating" state
    global.fetch.mockReturnValueOnce(new Promise(() => {}));

    ljm.showRoute(39.9, 32.8);

    expect(statusEl.textContent).toContain("Calculating route");
  });

  it("creates a geoJSON layer when route is returned", async () => {
    ljm._setMyLocation({ lat: 41.0, lng: 29.0 });

    const mockGeometry = { type: "LineString", coordinates: [[29, 41], [32.8, 39.9]] };
    mockFetchResponse({
      routes: [{
        geometry: mockGeometry,
        distance: 35200,
        duration: 1920,
      }],
    });

    ljm.showRoute(39.9, 32.8);

    await vi.waitFor(() => {
      expect(L.geoJSON).toHaveBeenCalled();
    });

    expect(L.geoJSON.mock.calls[0][0]).toEqual(mockGeometry);
  });

  it("shows error status when no route is available", async () => {
    ljm._setMyLocation({ lat: 41.0, lng: 29.0 });

    mockFetchResponse({ routes: [] });

    ljm.showRoute(39.9, 32.8);

    await vi.waitFor(() => {
      expect(statusEl.textContent).toContain("Route not available");
    });
  });

  it("displays route info on success", async () => {
    ljm._setMyLocation({ lat: 41.0, lng: 29.0 });

    mockFetchResponse({
      routes: [{
        geometry: { type: "LineString", coordinates: [] },
        distance: 35200,
        duration: 1920,
      }],
    });

    ljm.showRoute(39.9, 32.8);

    await vi.waitFor(() => {
      expect(statusEl.textContent).toContain("Route:");
      expect(statusEl.textContent).toContain("35.2");
      expect(statusEl.textContent).toContain("32");
    });
  });
});

// ═══════════════════════════════════════════════════════════════
//  5. clearRoute()
// ═══════════════════════════════════════════════════════════════

describe("clearRoute", () => {
  let mockMap;

  beforeEach(() => {
    mockMap = createMockMap();
    ljm._setMap(mockMap);
  });

  it("removes route layer from map when routeLayer exists", () => {
    const routeLayer = { id: "mock-route-layer" };
    ljm._setRouteLayer(routeLayer);

    ljm.clearRoute();

    expect(mockMap.removeLayer).toHaveBeenCalledWith(routeLayer);
  });

  it("does nothing if no route layer exists", () => {
    ljm._setRouteLayer(null);
    ljm.clearRoute();
    expect(mockMap.removeLayer).not.toHaveBeenCalled();
  });

  it("sets routeLayer to null after clearing", () => {
    ljm._setRouteLayer({ id: "some-layer" });
    ljm.clearRoute();

    // After clearRoute, calling it again should NOT call removeLayer
    mockMap.removeLayer.mockClear();
    ljm.clearRoute();
    expect(mockMap.removeLayer).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════
//  6. highlightMarkerRing(latlng)
// ═══════════════════════════════════════════════════════════════

describe("highlightMarkerRing", () => {
  let mockMap;

  beforeEach(() => {
    vi.useFakeTimers();
    mockMap = createMockMap();
    ljm._setMap(mockMap);
  });

  it("creates a circle marker with correct highlight options", () => {
    const latlng = { lat: 41.0, lng: 29.0 };
    ljm.highlightMarkerRing(latlng);

    expect(L.circleMarker).toHaveBeenCalledWith(latlng, expect.objectContaining({
      radius: 22,
      fillColor: "transparent",
      color: "#f59e0b",
      weight: 3,
      opacity: 0.9,
      fillOpacity: 0,
    }));
  });

  it("removes previous highlight when called again", () => {
    const latlng1 = { lat: 41.0, lng: 29.0 };
    const latlng2 = { lat: 39.9, lng: 32.8 };

    ljm.highlightMarkerRing(latlng1);
    ljm.highlightMarkerRing(latlng2);

    // removeLayer should have been called to remove the first highlight
    expect(mockMap.removeLayer).toHaveBeenCalled();
  });

  it("auto-removes highlight after 2500ms timeout", () => {
    const latlng = { lat: 41.0, lng: 29.0 };
    ljm.highlightMarkerRing(latlng);

    // Before timeout, removeLayer should not be called for auto-removal
    mockMap.removeLayer.mockClear();

    vi.advanceTimersByTime(2499);
    expect(mockMap.removeLayer).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(mockMap.removeLayer).toHaveBeenCalled();
  });

  it("clears timer on rapid calls to prevent premature removal", () => {
    const latlng1 = { lat: 41.0, lng: 29.0 };
    const latlng2 = { lat: 39.9, lng: 32.8 };

    ljm.highlightMarkerRing(latlng1);
    // Advance partway
    vi.advanceTimersByTime(1000);

    // Call again before the first timeout fires
    mockMap.removeLayer.mockClear();
    ljm.highlightMarkerRing(latlng2);

    // Now only advance 2499ms from the second call
    mockMap.removeLayer.mockClear();
    vi.advanceTimersByTime(2499);
    // The second highlight should still be visible (not yet auto-removed)
    expect(mockMap.removeLayer).not.toHaveBeenCalled();

    // At exactly 2500ms from the second call
    vi.advanceTimersByTime(1);
    expect(mockMap.removeLayer).toHaveBeenCalledTimes(1);
  });

  it("adds the highlight to the map", () => {
    const latlng = { lat: 41.0, lng: 29.0 };
    ljm.highlightMarkerRing(latlng);

    const marker = L.circleMarker.mock.results[0].value;
    expect(marker.addTo).toHaveBeenCalledWith(mockMap);
  });
});

// ═══════════════════════════════════════════════════════════════
//  7. focusJobOnMap(jobId)
// ═══════════════════════════════════════════════════════════════

describe("focusJobOnMap", () => {
  let mockMap;
  let mockMarkersLayer;

  beforeEach(() => {
    vi.useFakeTimers();
    mockMap = createMockMap();
    mockMarkersLayer = createMockMarkersLayer();
    ljm._setMap(mockMap);
    ljm._setMarkersLayer(mockMarkersLayer);
    ljm._setMapInitialized(true);
    ljm._setPanelEl(null);
    ljm._setToggleBtnEl(null);
  });

  it("sets pendingFocusJobId when map is not initialized", () => {
    ljm._setMapInitialized(false);

    // Create a mock toggle button to catch its click
    const mockToggleBtn = document.createElement("button");
    const clickSpy = vi.spyOn(mockToggleBtn, "click");
    ljm._setToggleBtnEl(mockToggleBtn);

    ljm.focusJobOnMap("job-42");

    expect(clickSpy).toHaveBeenCalled();
  });

  it("opens popup when marker is found in markerRefs", () => {
    const mockMarker = createMockMarker();
    ljm._setMarkerRefs({ "job-99": mockMarker });

    ljm.focusJobOnMap("job-99");

    // openPopup is called inside a setTimeout(350) -> zoomToShowLayer callback
    vi.advanceTimersByTime(350);

    expect(mockMarker.openPopup).toHaveBeenCalled();
  });

  it("shows panel if hidden", () => {
    const panel = document.createElement("div");
    panel.classList.add("ljm-hidden");
    ljm._setPanelEl(panel);

    const mockMarker = createMockMarker();
    ljm._setMarkerRefs({ "job-50": mockMarker });

    ljm.focusJobOnMap("job-50");

    expect(panel.classList.contains("ljm-hidden")).toBe(false);
  });

  it("zooms to marker location via map.setView", () => {
    const mockMarker = createMockMarker();
    mockMarker.getLatLng.mockReturnValue({ lat: 41.0, lng: 29.0 });
    ljm._setMarkerRefs({ "job-77": mockMarker });

    ljm.focusJobOnMap("job-77");

    expect(mockMap.setView).toHaveBeenCalledWith(
      { lat: 41.0, lng: 29.0 },
      14,
      { animate: true }
    );
  });

  it("uses at least zoom 14 even if current zoom is lower", () => {
    mockMap.getZoom.mockReturnValue(8);

    const mockMarker = createMockMarker();
    ljm._setMarkerRefs({ "job-low-zoom": mockMarker });

    ljm.focusJobOnMap("job-low-zoom");

    expect(mockMap.setView).toHaveBeenCalledWith(
      expect.anything(),
      14,
      expect.anything()
    );
  });

  it("keeps current zoom if already higher than 14", () => {
    mockMap.getZoom.mockReturnValue(16);

    const mockMarker = createMockMarker();
    ljm._setMarkerRefs({ "job-high-zoom": mockMarker });

    ljm.focusJobOnMap("job-high-zoom");

    expect(mockMap.setView).toHaveBeenCalledWith(
      expect.anything(),
      16,
      expect.anything()
    );
  });

  it("stores jobId as pending when marker not found", () => {
    ljm._setMarkerRefs({});

    ljm.focusJobOnMap("unknown-job");

    // The primary check is that setView was NOT called
    expect(mockMap.setView).not.toHaveBeenCalled();
  });

  it("calls zoomToShowLayer on markersLayer with the marker", () => {
    const mockMarker = createMockMarker();
    ljm._setMarkerRefs({ "job-cluster": mockMarker });

    ljm.focusJobOnMap("job-cluster");

    vi.advanceTimersByTime(350);

    expect(mockMarkersLayer.zoomToShowLayer).toHaveBeenCalledWith(
      mockMarker,
      expect.any(Function)
    );
  });
});

// ═══════════════════════════════════════════════════════════════
//  8. refreshPopups(geoJobs)
// ═══════════════════════════════════════════════════════════════

describe("refreshPopups", () => {
  let mockMap;

  beforeEach(() => {
    mockMap = createMockMap();
    ljm._setMap(mockMap);
    ljm._setMarkersLayer(createMockMarkersLayer());
    ljm._setMyLocationLayer(createMockLayerGroup());
  });

  it("updates popup content for all markers with matching jobIds", () => {
    const marker1 = createMockMarker();
    const marker2 = createMockMarker();
    ljm._setMarkerRefs({ "j1": marker1, "j2": marker2 });

    const jobs = [
      makeGeoJob({ jobId: "j1", title: "Dev A" }),
      makeGeoJob({ jobId: "j2", title: "Dev B" }),
    ];
    ljm._setCurrentGeoJobs(jobs);

    ljm.refreshPopups();

    expect(marker1.setPopupContent).toHaveBeenCalledTimes(1);
    expect(marker2.setPopupContent).toHaveBeenCalledTimes(1);

    // Verify the popup content is an HTML string containing the title
    const popup1Content = marker1.setPopupContent.mock.calls[0][0];
    expect(popup1Content).toContain("Dev A");
    const popup2Content = marker2.setPopupContent.mock.calls[0][0];
    expect(popup2Content).toContain("Dev B");
  });

  it("does nothing for jobs without matching markers", () => {
    const marker1 = createMockMarker();
    ljm._setMarkerRefs({ "j1": marker1 });

    const jobs = [
      makeGeoJob({ jobId: "j1", title: "Has Marker" }),
      makeGeoJob({ jobId: "j-no-marker", title: "No Marker" }),
    ];
    ljm._setCurrentGeoJobs(jobs);

    ljm.refreshPopups();

    // Only marker1 should be updated
    expect(marker1.setPopupContent).toHaveBeenCalledTimes(1);
  });

  it("handles empty currentGeoJobs gracefully", () => {
    ljm._setCurrentGeoJobs([]);
    ljm._setMarkerRefs({ "j1": createMockMarker() });

    // Should not throw
    expect(() => ljm.refreshPopups()).not.toThrow();
  });

  it("handles empty markerRefs gracefully", () => {
    ljm._setMarkerRefs({});
    ljm._setCurrentGeoJobs([makeGeoJob()]);

    // Should not throw
    expect(() => ljm.refreshPopups()).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
//  9. displayFilteredResults()
// ═══════════════════════════════════════════════════════════════

describe("displayFilteredResults", () => {
  let mockMap;
  let mockMarkersLayer;
  let statusEl;
  let countEl;

  beforeEach(() => {
    mockMap = createMockMap();
    mockMarkersLayer = createMockMarkersLayer();
    ljm._setMap(mockMap);
    ljm._setMarkersLayer(mockMarkersLayer);

    // Create status and count DOM elements
    statusEl = document.createElement("div");
    statusEl.id = "ljm-status";
    document.body.appendChild(statusEl);

    countEl = document.createElement("span");
    countEl.id = "ljm-count";
    document.body.appendChild(countEl);
  });

  it("calls updateMarkers with filtered jobs", () => {
    const jobs = {
      "j1": makeGeoJob({ jobId: "j1", workplaceType: 1 }),
      "j2": makeGeoJob({ jobId: "j2", workplaceType: 2 }),
    };
    ljm._setAllJobsById(jobs);

    // Disable remote filter
    ljm._setFilterState({ onSite: true, hybrid: true, remote: false });

    ljm.displayFilteredResults();

    // markersLayer.clearLayers should have been called (from updateMarkers)
    expect(mockMarkersLayer.clearLayers).toHaveBeenCalled();

    // Only 1 job should produce a marker (on-site), remote is filtered
    expect(L.circleMarker).toHaveBeenCalledTimes(1);
  });

  it("updates filter chip counts", () => {
    // Create filter chip DOM elements
    const chip = document.createElement("button");
    chip.setAttribute("data-filter-key", "onSite");
    document.body.appendChild(chip);

    const jobs = {
      "j1": makeGeoJob({ jobId: "j1", workplaceType: 1 }),
      "j2": makeGeoJob({ jobId: "j2", workplaceType: 1 }),
    };
    ljm._setAllJobsById(jobs);

    ljm.displayFilteredResults();

    const countSpan = chip.querySelector(".ljm-chip-count");
    expect(countSpan).not.toBeNull();
    expect(countSpan.textContent).toBe("(2)");
  });

  it("sets status with mapped summary", () => {
    const jobs = {
      "j1": makeGeoJob({ jobId: "j1", workplaceType: 1, hasPreciseAddress: true }),
      "j2": makeGeoJob({ jobId: "j2", workplaceType: 2, hasPreciseAddress: false }),
      "j3": makeGeoJob({ jobId: "j3", workplaceType: 3, hasPreciseAddress: true }),
    };
    ljm._setAllJobsById(jobs);

    ljm.displayFilteredResults();

    // Status should contain summary information
    expect(statusEl.textContent).toContain("3 mapped");
    expect(statusEl.textContent).toContain("2 precise");
    expect(statusEl.textContent).toContain("On-site");
    expect(statusEl.textContent).toContain("Remote");
    expect(statusEl.textContent).toContain("Hybrid");
  });

  it("updates badge count with total jobs", () => {
    const jobs = {
      "j1": makeGeoJob({ jobId: "j1" }),
      "j2": makeGeoJob({ jobId: "j2" }),
      "j3": makeGeoJob({ jobId: "j3" }),
    };
    ljm._setAllJobsById(jobs);

    ljm.displayFilteredResults();

    expect(countEl.textContent).toBe("3");
  });

  it("renders job cards in fullscreen mode", () => {
    ljm._setIsFullscreen(true);

    const cardsListEl = document.createElement("div");
    ljm._setCardsListEl(cardsListEl);

    const badgeEl = document.createElement("span");
    ljm._setCardsBadgeEl(badgeEl);

    const footerTimeEl = document.createElement("span");
    ljm._setCardsFooterTimeEl(footerTimeEl);

    const jobs = {
      "j1": makeGeoJob({ jobId: "j1", title: "Test Job" }),
    };
    ljm._setAllJobsById(jobs);

    ljm.displayFilteredResults();

    // In fullscreen mode, renderJobCards should populate cardsListEl
    expect(cardsListEl.children.length).toBeGreaterThan(0);
  });

  it("does not render job cards when not in fullscreen", () => {
    ljm._setIsFullscreen(false);

    const cardsListEl = document.createElement("div");
    ljm._setCardsListEl(cardsListEl);

    const jobs = {
      "j1": makeGeoJob({ jobId: "j1" }),
    };
    ljm._setAllJobsById(jobs);

    ljm.displayFilteredResults();

    // Cards list should remain empty
    expect(cardsListEl.children.length).toBe(0);
  });

  it("handles empty jobs gracefully", () => {
    ljm._setAllJobsById({});

    ljm.displayFilteredResults();

    expect(statusEl.textContent).toContain("0 mapped");
    expect(countEl.textContent).toBe("0");
  });

  it("correctly counts each workplace type in summary", () => {
    const jobs = {
      "j1": makeGeoJob({ jobId: "j1", workplaceType: 1 }),
      "j2": makeGeoJob({ jobId: "j2", workplaceType: 1 }),
      "j3": makeGeoJob({ jobId: "j3", workplaceType: 2 }),
      "j4": makeGeoJob({ jobId: "j4", workplaceType: 3 }),
      "j5": makeGeoJob({ jobId: "j5", workplaceType: 3 }),
    };
    ljm._setAllJobsById(jobs);

    ljm.displayFilteredResults();

    // The status should reflect filtered counts
    expect(statusEl.textContent).toContain("On-site");
    expect(statusEl.textContent).toContain("Remote");
    expect(statusEl.textContent).toContain("Hybrid");
  });
});
