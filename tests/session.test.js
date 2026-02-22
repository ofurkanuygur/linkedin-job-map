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
    localStorage.removeItem("ljm_geocode_cache_v3");
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
