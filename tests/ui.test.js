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

// Mock fetch
global.fetch = vi.fn();

// Mock chrome.storage
global.chrome = {
  storage: {
    local: { get: vi.fn(), set: vi.fn(), remove: vi.fn() },
    sync: { get: vi.fn() }
  }
};

// Mock URL.createObjectURL and URL.revokeObjectURL for CSV export
global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = vi.fn();

const ljm = require("../content.js");

// ── Shared state reset ──
beforeEach(() => {
  ljm._setMyLocation(null);
  ljm._setAllJobsById({});
  ljm._setFilterState({ onSite: true, hybrid: true, remote: true });
  ljm._setSortState("distance");
  ljm._setSearchQuery("");
  ljm._setCompanyNames({});
  ljm._setCompanyCache({});
  ljm._setCurrentLocale("en");
  ljm._setIsFullscreen(false);
});

afterEach(() => {
  // Clean up DOM between tests
  document.body.textContent = "";
  document.body.className = "";
});

// ===============================================================
// 1. csvEscape(val)
// ===============================================================
describe("csvEscape", () => {
  it("passes through a simple string unchanged", () => {
    expect(ljm.csvEscape("hello world")).toBe("hello world");
  });

  it("wraps string containing a comma in double quotes", () => {
    expect(ljm.csvEscape("Istanbul, TR")).toBe('"Istanbul, TR"');
  });

  it("escapes double quotes by doubling them and wraps in quotes", () => {
    expect(ljm.csvEscape('He said "hi"')).toBe('"He said ""hi"""');
  });

  it("wraps string containing a newline in double quotes", () => {
    expect(ljm.csvEscape("line1\nline2")).toBe('"line1\nline2"');
  });

  it("returns empty string for null", () => {
    expect(ljm.csvEscape(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(ljm.csvEscape(undefined)).toBe("");
  });

  it("returns empty string for empty string input", () => {
    expect(ljm.csvEscape("")).toBe("");
  });

  it("handles string with both comma and double quotes", () => {
    expect(ljm.csvEscape('a "b", c')).toBe('"a ""b"", c"');
  });

  it("converts numeric values to string", () => {
    expect(ljm.csvEscape(42)).toBe("42");
  });
});

// ===============================================================
// 2. renderJobCards(jobs)
// ===============================================================
describe("renderJobCards", () => {
  var sampleJob;
  var sampleJob2;

  beforeEach(() => {
    sampleJob = {
      jobId: "123", title: "Software Engineer", company: "Acme Corp",
      location: "Istanbul, TR", address: "Levent, Istanbul",
      workplaceType: 1, workplaceLabel: "On-site",
      hasPreciseAddress: true, lat: 41.08, lng: 29.01,
      listedAt: Date.now() - 3600000, logoUrl: "https://example.com/logo.png"
    };
    sampleJob2 = {
      jobId: "456", title: "Product Manager", company: "Beta Inc",
      location: "Ankara, TR", address: "Cankaya, Ankara",
      workplaceType: 3, workplaceLabel: "Hybrid",
      hasPreciseAddress: false, lat: 39.93, lng: 32.86,
      listedAt: null, logoUrl: null
    };

    var cardsListEl = document.createElement("div");
    cardsListEl.className = "ljm-cards-list";
    document.body.appendChild(cardsListEl);
    ljm._setCardsListEl(cardsListEl);

    var badgeEl = document.createElement("span");
    badgeEl.className = "ljm-cards-badge";
    document.body.appendChild(badgeEl);
    ljm._setCardsBadgeEl(badgeEl);

    var footerTimeEl = document.createElement("span");
    footerTimeEl.className = "ljm-footer-time";
    document.body.appendChild(footerTimeEl);
    ljm._setCardsFooterTimeEl(footerTimeEl);
  });

  it("renders correct number of cards", () => {
    ljm.renderJobCards([sampleJob, sampleJob2]);
    var cards = document.querySelectorAll(".ljm-job-card");
    expect(cards).toHaveLength(2);
  });

  it("first card has ljm-card-active class", () => {
    ljm.renderJobCards([sampleJob, sampleJob2]);
    var cards = document.querySelectorAll(".ljm-job-card");
    expect(cards[0].classList.contains("ljm-card-active")).toBe(true);
    expect(cards[1].classList.contains("ljm-card-active")).toBe(false);
  });

  it("card contains job title text", () => {
    ljm.renderJobCards([sampleJob]);
    var titleEl = document.querySelector(".ljm-job-title");
    expect(titleEl).not.toBeNull();
    expect(titleEl.textContent).toBe("Software Engineer");
  });

  it("card contains company name text", () => {
    ljm.renderJobCards([sampleJob]);
    var compEl = document.querySelector(".ljm-job-company");
    expect(compEl).not.toBeNull();
    expect(compEl.textContent).toBe("Acme Corp");
  });

  it("card contains workplace type tag", () => {
    ljm.renderJobCards([sampleJob]);
    var wtTag = document.querySelector(".ljm-job-tag.ljm-tag-onsite");
    expect(wtTag).not.toBeNull();
    expect(wtTag.textContent).toBe("On-site");
  });

  it("card contains location tag", () => {
    ljm.renderJobCards([sampleJob]);
    var locTag = document.querySelector(".ljm-job-tag.ljm-tag-location");
    expect(locTag).not.toBeNull();
    expect(locTag.textContent).toBe("Istanbul");
  });

  it("card contains time tag when listedAt present", () => {
    ljm.renderJobCards([sampleJob]);
    var timeTag = document.querySelector(".ljm-job-tag.ljm-tag-time");
    expect(timeTag).not.toBeNull();
    expect(timeTag.textContent).toBe("1h ago");
  });

  it("card does not contain time tag when listedAt is null", () => {
    ljm.renderJobCards([sampleJob2]);
    var timeTag = document.querySelector(".ljm-job-tag.ljm-tag-time");
    expect(timeTag).toBeNull();
  });

  it("card has data-ljm-job attribute with jobId", () => {
    ljm.renderJobCards([sampleJob]);
    var card = document.querySelector(".ljm-job-card");
    expect(card.getAttribute("data-ljm-job")).toBe("123");
  });

  it("shows empty message when no jobs match", () => {
    ljm.renderJobCards([]);
    var emptyMsg = document.querySelector(".ljm-cards-empty");
    expect(emptyMsg).not.toBeNull();
    expect(emptyMsg.textContent).toBe("No jobs match filters.");
  });

  it("badge shows correct count", () => {
    ljm.renderJobCards([sampleJob, sampleJob2]);
    var badge = document.querySelector(".ljm-cards-badge");
    expect(badge.textContent).toBe("2");
  });

  it("footer shows Updated just now text", () => {
    ljm.renderJobCards([sampleJob]);
    var footerTime = document.querySelector(".ljm-footer-time");
    expect(footerTime.textContent).toBe("Updated just now");
  });

  it("card has commute display", () => {
    ljm.renderJobCards([sampleJob]);
    var commuteLabel = document.querySelector(".ljm-job-commute-label");
    expect(commuteLabel).not.toBeNull();
    expect(commuteLabel.textContent).toBe("COMMUTE");
    var commuteVal = document.querySelector(".ljm-job-commute-value");
    expect(commuteVal).not.toBeNull();
  });

  it("card has View Job button", () => {
    ljm.renderJobCards([sampleJob]);
    var viewBtn = document.querySelector(".ljm-job-apply");
    expect(viewBtn).not.toBeNull();
    expect(viewBtn.textContent).toBe("View Job");
  });

  it("logo image is created when logoUrl present", () => {
    ljm.renderJobCards([sampleJob]);
    var logoImg = document.querySelector(".ljm-job-logo-img");
    expect(logoImg).not.toBeNull();
    expect(logoImg.src).toBe("https://example.com/logo.png");
  });

  it("fallback letter shown when no logoUrl", () => {
    ljm.renderJobCards([sampleJob2]);
    var logo = document.querySelector(".ljm-job-logo");
    expect(logo).not.toBeNull();
    var img = logo.querySelector(".ljm-job-logo-img");
    expect(img).toBeNull();
    expect(logo.textContent).toBe("B");
  });

  it("does not throw when cardsListEl is null", () => {
    ljm._setCardsListEl(null);
    expect(() => ljm.renderJobCards([sampleJob])).not.toThrow();
  });

  it("clears previous cards before rendering new ones", () => {
    ljm.renderJobCards([sampleJob]);
    expect(document.querySelectorAll(".ljm-job-card")).toHaveLength(1);
    ljm.renderJobCards([sampleJob, sampleJob2]);
    expect(document.querySelectorAll(".ljm-job-card")).toHaveLength(2);
  });

  it("card contains hybrid tag class for hybrid job", () => {
    ljm.renderJobCards([sampleJob2]);
    var wtTag = document.querySelector(".ljm-job-tag.ljm-tag-hybrid");
    expect(wtTag).not.toBeNull();
    expect(wtTag.textContent).toBe("Hybrid");
  });
});

// ===============================================================
// 3. setStatus(text, showSpinner)
// ===============================================================
describe("setStatus", () => {
  beforeEach(() => {
    var statusEl = document.createElement("div");
    statusEl.id = "ljm-status";
    document.body.appendChild(statusEl);
  });

  it("sets text content", () => {
    ljm.setStatus("Loading...");
    var el = document.getElementById("ljm-status");
    expect(el.textContent).toBe("Loading...");
  });

  it("shows spinner when showSpinner is true", () => {
    ljm.setStatus("Scanning", true);
    var el = document.getElementById("ljm-status");
    var spinner = el.querySelector(".ljm-spinner");
    expect(spinner).not.toBeNull();
    expect(el.textContent).toContain("Scanning");
  });

  it("no spinner when showSpinner is false", () => {
    ljm.setStatus("Done", false);
    var el = document.getElementById("ljm-status");
    var spinner = el.querySelector(".ljm-spinner");
    expect(spinner).toBeNull();
    expect(el.textContent).toBe("Done");
  });

  it("no spinner when showSpinner is undefined", () => {
    ljm.setStatus("Ready");
    var el = document.getElementById("ljm-status");
    var spinner = el.querySelector(".ljm-spinner");
    expect(spinner).toBeNull();
  });

  it("handles missing status element gracefully", () => {
    document.body.textContent = "";
    expect(() => ljm.setStatus("Test text", true)).not.toThrow();
  });

  it("overwrites previous status text", () => {
    ljm.setStatus("First");
    ljm.setStatus("Second");
    var el = document.getElementById("ljm-status");
    expect(el.textContent).toBe("Second");
    expect(el.textContent).not.toContain("First");
  });

  it("clears spinner when called without spinner after spinner call", () => {
    ljm.setStatus("Loading", true);
    ljm.setStatus("Done");
    var el = document.getElementById("ljm-status");
    expect(el.querySelector(".ljm-spinner")).toBeNull();
    expect(el.textContent).toBe("Done");
  });
});

// ===============================================================
// 4. setCount(n)
// ===============================================================
describe("setCount", () => {
  beforeEach(() => {
    var countEl = document.createElement("span");
    countEl.id = "ljm-count";
    document.body.appendChild(countEl);
  });

  it("sets count text", () => {
    ljm.setCount(42);
    var el = document.getElementById("ljm-count");
    expect(el.textContent).toBe("42");
  });

  it("sets count to zero", () => {
    ljm.setCount(0);
    var el = document.getElementById("ljm-count");
    expect(el.textContent).toBe("0");
  });

  it("sets count as string representation", () => {
    ljm.setCount(100);
    var el = document.getElementById("ljm-count");
    expect(el.textContent).toBe("100");
  });

  it("handles missing element without throwing", () => {
    document.body.textContent = "";
    expect(() => ljm.setCount(10)).not.toThrow();
  });
});

// ===============================================================
// 5. exportJobsCSV()
// ===============================================================
describe("exportJobsCSV", () => {
  var capturedBlobContent;

  beforeEach(() => {
    capturedBlobContent = null;
    ljm._setMyLocation(null);
    ljm._setFilterState({ onSite: true, hybrid: true, remote: true });
    ljm._setSortState("distance");
    ljm._setSearchQuery("");

    // Mock Blob to capture its content
    global.Blob = class MockBlob {
      constructor(parts, options) {
        capturedBlobContent = parts.join("");
        this.size = capturedBlobContent.length;
        this.type = options && options.type || "";
      }
    };

    URL.createObjectURL = vi.fn(() => "blob:mock-url");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    delete global.Blob;
  });

  it("does nothing when no jobs", () => {
    ljm._setAllJobsById({});
    ljm.exportJobsCSV();
    expect(capturedBlobContent).toBeNull();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("creates download link with correct filename format", () => {
    ljm._setAllJobsById({
      "1": {
        jobId: "1", title: "Dev", company: "Co", location: "Loc",
        workplaceType: 1, lat: 41, lng: 29, hasPreciseAddress: true
      }
    });

    var appendedElements = [];
    var origAppend = document.body.appendChild.bind(document.body);
    var origRemove = document.body.removeChild.bind(document.body);

    vi.spyOn(document.body, "appendChild").mockImplementation(function (el) {
      appendedElements.push(el);
      return origAppend(el);
    });
    vi.spyOn(document.body, "removeChild").mockImplementation(function (el) {
      return origRemove(el);
    });

    ljm.exportJobsCSV();

    var anchor = appendedElements.find(function (el) {
      return el.tagName === "A";
    });
    expect(anchor).toBeDefined();
    expect(anchor.download).toMatch(/^linkedin-jobs-\d{4}-\d{2}-\d{2}\.csv$/);

    vi.restoreAllMocks();
  });

  it("CSV contains header row", () => {
    ljm._setAllJobsById({
      "1": {
        jobId: "1", title: "Dev", company: "Co", location: "Loc",
        workplaceType: 1, lat: 41, lng: 29, hasPreciseAddress: true
      }
    });
    ljm.exportJobsCSV();
    expect(capturedBlobContent).not.toBeNull();
    var content = capturedBlobContent.replace(/^\uFEFF/, "");
    var lines = content.split("\n");
    expect(lines[0]).toBe("Title,Company,Location,Type,Commute (min),URL");
  });

  it("CSV rows contain job data", () => {
    ljm._setAllJobsById({
      "1": {
        jobId: "1", title: "Software Engineer", company: "Acme Corp",
        location: "Istanbul, TR", workplaceType: 1, lat: 41, lng: 29,
        hasPreciseAddress: true
      }
    });
    ljm.exportJobsCSV();
    var content = capturedBlobContent.replace(/^\uFEFF/, "");
    var lines = content.split("\n");
    expect(lines.length).toBeGreaterThanOrEqual(2);
    expect(lines[1]).toContain("Software Engineer");
    expect(lines[1]).toContain("Acme Corp");
    expect(lines[1]).toContain("On-site");
    expect(lines[1]).toContain("linkedin.com/jobs/view/1");
  });

  it("handles special characters in job data via csvEscape", () => {
    ljm._setAllJobsById({
      "1": {
        jobId: "1", title: 'Senior "Lead" Dev', company: "Foo, Bar & Co",
        location: "City, Country", workplaceType: 2, lat: 41, lng: 29,
        hasPreciseAddress: false
      }
    });
    ljm.exportJobsCSV();
    var content = capturedBlobContent.replace(/^\uFEFF/, "");
    expect(content).toContain('""Lead""');
    expect(content).toContain('"Foo, Bar & Co"');
  });

  it("CSV starts with UTF-8 BOM", () => {
    ljm._setAllJobsById({
      "1": {
        jobId: "1", title: "Dev", company: "Co", location: "Loc",
        workplaceType: 1, lat: 41, lng: 29, hasPreciseAddress: true
      }
    });
    ljm.exportJobsCSV();
    expect(capturedBlobContent.charCodeAt(0)).toBe(0xFEFF);
  });

  it("calls URL.revokeObjectURL after download", () => {
    ljm._setAllJobsById({
      "1": {
        jobId: "1", title: "Dev", company: "Co", location: "Loc",
        workplaceType: 1, lat: 41, lng: 29, hasPreciseAddress: true
      }
    });
    ljm.exportJobsCSV();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });
});

// ===============================================================
// 6. toggleFullscreen()
// ===============================================================
describe("toggleFullscreen", () => {
  beforeEach(() => {
    ljm._setIsFullscreen(false);

    var panel = document.createElement("div");
    panel.id = "ljm-panel";
    document.body.appendChild(panel);
    ljm._setPanelEl(panel);

    var fsBtn = document.createElement("button");
    fsBtn.id = "ljm-fs-btn";
    document.body.appendChild(fsBtn);

    // renderJobCards needs cardsListEl set up plus badge and footer
    var cardsListEl = document.createElement("div");
    cardsListEl.className = "ljm-cards-list";
    document.body.appendChild(cardsListEl);
    ljm._setCardsListEl(cardsListEl);

    var badgeEl = document.createElement("span");
    ljm._setCardsBadgeEl(badgeEl);

    var footerTimeEl = document.createElement("span");
    ljm._setCardsFooterTimeEl(footerTimeEl);
  });

  it("adds ljm-fullscreen class to panel", () => {
    ljm.toggleFullscreen();
    var panel = document.getElementById("ljm-panel");
    expect(panel.classList.contains("ljm-fullscreen")).toBe(true);
  });

  it("adds ljm-fs-active to body", () => {
    ljm.toggleFullscreen();
    expect(document.body.classList.contains("ljm-fs-active")).toBe(true);
  });

  it("toggles back on second call", () => {
    ljm.toggleFullscreen();
    var panel = document.getElementById("ljm-panel");
    expect(panel.classList.contains("ljm-fullscreen")).toBe(true);
    expect(document.body.classList.contains("ljm-fs-active")).toBe(true);

    ljm.toggleFullscreen();
    expect(panel.classList.contains("ljm-fullscreen")).toBe(false);
    expect(document.body.classList.contains("ljm-fs-active")).toBe(false);
  });

  it("updates button text and tooltip when entering fullscreen", () => {
    ljm.toggleFullscreen();
    var fsBtn = document.getElementById("ljm-fs-btn");
    expect(fsBtn.textContent).toBe("\u2716");
    expect(fsBtn.getAttribute("data-tooltip")).toBe("Exit fullscreen");
  });

  it("updates button text and tooltip when exiting fullscreen", () => {
    ljm.toggleFullscreen(); // enter
    ljm.toggleFullscreen(); // exit
    var fsBtn = document.getElementById("ljm-fs-btn");
    expect(fsBtn.textContent).toBe("\u26F6");
    expect(fsBtn.getAttribute("data-tooltip")).toBe("Fullscreen");
  });
});

// ===============================================================
// 7. captureCompanyNamesFromDOM()
// ===============================================================
describe("captureCompanyNamesFromDOM", () => {
  beforeEach(() => {
    ljm._setCompanyNames({});
  });

  it("captures company name from DOM using artdeco-entity-lockup__subtitle", () => {
    var card = document.createElement("div");
    card.setAttribute("data-job-id", "999");
    var subtitle = document.createElement("span");
    subtitle.className = "artdeco-entity-lockup__subtitle";
    subtitle.textContent = "Google";
    card.appendChild(subtitle);
    document.body.appendChild(card);

    ljm.captureCompanyNamesFromDOM();
    expect(ljm.getCompanyName("999")).toBe("Google");
  });

  it("captures company name using job-card-container__primary-description", () => {
    var card = document.createElement("div");
    card.setAttribute("data-job-id", "888");
    var desc = document.createElement("span");
    desc.className = "job-card-container__primary-description";
    desc.textContent = "  Microsoft  ";
    card.appendChild(desc);
    document.body.appendChild(card);

    ljm.captureCompanyNamesFromDOM();
    expect(ljm.getCompanyName("888")).toBe("Microsoft");
  });

  it("does not overwrite existing names", () => {
    ljm._setCompanyNames({ "999": "Already Set" });

    var card = document.createElement("div");
    card.setAttribute("data-job-id", "999");
    var subtitle = document.createElement("span");
    subtitle.className = "artdeco-entity-lockup__subtitle";
    subtitle.textContent = "New Name";
    card.appendChild(subtitle);
    document.body.appendChild(card);

    ljm.captureCompanyNamesFromDOM();
    expect(ljm.getCompanyName("999")).toBe("Already Set");
  });

  it("handles missing subtitle element", () => {
    var card = document.createElement("div");
    card.setAttribute("data-job-id", "777");
    document.body.appendChild(card);

    ljm.captureCompanyNamesFromDOM();
    expect(ljm.getCompanyName("777")).toBe("");
  });

  it("handles multiple cards", () => {
    var card1 = document.createElement("div");
    card1.setAttribute("data-job-id", "100");
    var sub1 = document.createElement("span");
    sub1.className = "artdeco-entity-lockup__subtitle";
    sub1.textContent = "Apple";
    card1.appendChild(sub1);

    var card2 = document.createElement("div");
    card2.setAttribute("data-job-id", "200");
    var sub2 = document.createElement("span");
    sub2.className = "artdeco-entity-lockup__subtitle";
    sub2.textContent = "Amazon";
    card2.appendChild(sub2);

    document.body.appendChild(card1);
    document.body.appendChild(card2);

    ljm.captureCompanyNamesFromDOM();
    expect(ljm.getCompanyName("100")).toBe("Apple");
    expect(ljm.getCompanyName("200")).toBe("Amazon");
  });
});

// ===============================================================
// 8. getCompanyName(jobId)
// ===============================================================
describe("getCompanyName", () => {
  beforeEach(() => {
    ljm._setCompanyNames({});
  });

  it("returns name from companyNames cache", () => {
    ljm._setCompanyNames({ "555": "Cached Corp" });
    expect(ljm.getCompanyName("555")).toBe("Cached Corp");
  });

  it("returns name from DOM if not cached", () => {
    var card = document.createElement("div");
    card.setAttribute("data-job-id", "666");
    var subtitle = document.createElement("span");
    subtitle.className = "artdeco-entity-lockup__subtitle";
    subtitle.textContent = "DOM Company";
    card.appendChild(subtitle);
    document.body.appendChild(card);

    expect(ljm.getCompanyName("666")).toBe("DOM Company");
  });

  it("returns empty string if not found in cache or DOM", () => {
    expect(ljm.getCompanyName("nonexistent")).toBe("");
  });

  it("caches the name after finding it in DOM", () => {
    var card = document.createElement("div");
    card.setAttribute("data-job-id", "777");
    var subtitle = document.createElement("span");
    subtitle.className = "artdeco-entity-lockup__subtitle";
    subtitle.textContent = "Found Corp";
    card.appendChild(subtitle);
    document.body.appendChild(card);

    // First call finds in DOM
    ljm.getCompanyName("777");
    // Remove from DOM
    document.body.removeChild(card);
    // Should still return from cache
    expect(ljm.getCompanyName("777")).toBe("Found Corp");
  });

  it("returns empty string when card exists but has no subtitle", () => {
    var card = document.createElement("div");
    card.setAttribute("data-job-id", "888");
    document.body.appendChild(card);

    expect(ljm.getCompanyName("888")).toBe("");
  });
});

// ===============================================================
// 9. createFilterBar()
// ===============================================================
describe("createFilterBar", () => {
  it("returns a div with ljm-filter-bar class", () => {
    var bar = ljm.createFilterBar();
    expect(bar.tagName).toBe("DIV");
    expect(bar.className).toBe("ljm-filter-bar");
  });

  it("contains search input", () => {
    var bar = ljm.createFilterBar();
    var input = bar.querySelector(".ljm-search-input");
    expect(input).not.toBeNull();
    expect(input.tagName).toBe("INPUT");
    expect(input.type).toBe("text");
    expect(input.placeholder).toBe("Search jobs...");
  });

  it("contains 3 filter chips (onSite, hybrid, remote)", () => {
    var bar = ljm.createFilterBar();
    var chips = bar.querySelectorAll(".ljm-filter-chip");
    expect(chips).toHaveLength(3);
  });

  it("filter chips have data-filter-key attributes", () => {
    var bar = ljm.createFilterBar();
    var onSiteChip = bar.querySelector('[data-filter-key="onSite"]');
    var hybridChip = bar.querySelector('[data-filter-key="hybrid"]');
    var remoteChip = bar.querySelector('[data-filter-key="remote"]');
    expect(onSiteChip).not.toBeNull();
    expect(hybridChip).not.toBeNull();
    expect(remoteChip).not.toBeNull();
  });

  it("contains sort select with 4 options", () => {
    var bar = ljm.createFilterBar();
    var select = bar.querySelector(".ljm-sort-select");
    expect(select).not.toBeNull();
    expect(select.tagName).toBe("SELECT");

    var options = select.querySelectorAll("option");
    expect(options).toHaveLength(4);

    var values = Array.from(options).map(function (o) { return o.value; });
    expect(values).toContain("distance");
    expect(values).toContain("company");
    expect(values).toContain("type");
    expect(values).toContain("date");
  });

  it("sort select has correct option labels", () => {
    var bar = ljm.createFilterBar();
    var options = bar.querySelectorAll(".ljm-sort-select option");
    var texts = Array.from(options).map(function (o) { return o.textContent; });
    expect(texts).toContain("Distance");
    expect(texts).toContain("Company");
    expect(texts).toContain("Type");
    expect(texts).toContain("Date");
  });

  it("filter chips have active class when filter state is true", () => {
    ljm._setFilterState({ onSite: true, hybrid: true, remote: true });
    var bar = ljm.createFilterBar();
    var chips = bar.querySelectorAll(".ljm-filter-chip");
    chips.forEach(function (chip) {
      expect(chip.classList.contains("ljm-filter-active")).toBe(true);
    });
  });

  it("contains sort label with Sort: text", () => {
    var bar = ljm.createFilterBar();
    var label = bar.querySelector(".ljm-sort-label");
    expect(label).not.toBeNull();
    expect(label.textContent).toBe("Sort:");
  });

  it("contains search wrapper", () => {
    var bar = ljm.createFilterBar();
    var searchWrap = bar.querySelector(".ljm-search-wrap");
    expect(searchWrap).not.toBeNull();
  });

  it("contains filter group", () => {
    var bar = ljm.createFilterBar();
    var filterGroup = bar.querySelector(".ljm-filter-group");
    expect(filterGroup).not.toBeNull();
  });

  it("each filter chip has a dot element", () => {
    var bar = ljm.createFilterBar();
    var onSiteChip = bar.querySelector('[data-filter-key="onSite"]');
    var dot = onSiteChip.querySelector(".ljm-filter-dot");
    expect(dot).not.toBeNull();
    expect(dot.classList.contains("ljm-dot-onsite")).toBe(true);
  });

  it("filter chip text contains localized labels", () => {
    var bar = ljm.createFilterBar();
    var onSiteChip = bar.querySelector('[data-filter-key="onSite"]');
    expect(onSiteChip.textContent).toContain("On-site");
    var hybridChip = bar.querySelector('[data-filter-key="hybrid"]');
    expect(hybridChip.textContent).toContain("Hybrid");
    var remoteChip = bar.querySelector('[data-filter-key="remote"]');
    expect(remoteChip.textContent).toContain("Remote");
  });
});

// ===============================================================
// 10. createCardsPanel()
// ===============================================================
describe("createCardsPanel", () => {
  it("returns div with id ljm-cards-panel", () => {
    var panel = ljm.createCardsPanel();
    expect(panel.tagName).toBe("DIV");
    expect(panel.id).toBe("ljm-cards-panel");
  });

  it("contains header with title", () => {
    var panel = ljm.createCardsPanel();
    var title = panel.querySelector(".ljm-cards-title");
    expect(title).not.toBeNull();
    expect(title.textContent).toContain("Mapped Jobs");
  });

  it("contains filter bar", () => {
    var panel = ljm.createCardsPanel();
    var filterBar = panel.querySelector(".ljm-filter-bar");
    expect(filterBar).not.toBeNull();
  });

  it("contains cards list", () => {
    var panel = ljm.createCardsPanel();
    var cardsList = panel.querySelector(".ljm-cards-list");
    expect(cardsList).not.toBeNull();
  });

  it("contains footer", () => {
    var panel = ljm.createCardsPanel();
    var footer = panel.querySelector(".ljm-cards-footer");
    expect(footer).not.toBeNull();
  });

  it("contains badge in header with initial value 0", () => {
    var panel = ljm.createCardsPanel();
    var badge = panel.querySelector(".ljm-cards-badge");
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe("0");
  });

  it("contains export button in header", () => {
    var panel = ljm.createCardsPanel();
    var exportBtn = panel.querySelector(".ljm-export-btn");
    expect(exportBtn).not.toBeNull();
    expect(exportBtn.getAttribute("data-tooltip")).toBe("Export CSV");
  });

  it("footer contains live indicator dot", () => {
    var panel = ljm.createCardsPanel();
    var liveDot = panel.querySelector(".ljm-live-dot");
    expect(liveDot).not.toBeNull();
  });

  it("footer shows Ready text initially", () => {
    var panel = ljm.createCardsPanel();
    var footer = panel.querySelector(".ljm-cards-footer");
    expect(footer.textContent).toContain("Ready");
  });

  it("contains title row with title and export button", () => {
    var panel = ljm.createCardsPanel();
    var titleRow = panel.querySelector(".ljm-cards-title-row");
    expect(titleRow).not.toBeNull();
    expect(titleRow.querySelector(".ljm-cards-title")).not.toBeNull();
    expect(titleRow.querySelector(".ljm-export-btn")).not.toBeNull();
  });

  it("footer contains Live text", () => {
    var panel = ljm.createCardsPanel();
    var footer = panel.querySelector(".ljm-cards-footer");
    expect(footer.textContent).toContain("Live");
  });
});
