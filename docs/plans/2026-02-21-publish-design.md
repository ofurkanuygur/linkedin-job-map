# LinkedIn Job Map - Publish Design

**Date:** 2026-02-21
**Version:** 3.1.0 -> 3.2.0
**Approach:** Minimal touch + quality + Chrome Web Store publish

## Goals

1. Code improvements (performance + cleanup) without restructuring
2. Raise test coverage from ~20% to 80%+
3. Publish to Chrome Web Store

## Scope

### 1. Code Improvements

**Performance:**
- Use `DocumentFragment` for batch DOM rendering in job card list
- Add passive flag to scroll/touch event listeners
- Add dirty flag to prevent unnecessary re-renders in `updateMarkers()` and `renderJobCards()`
- Optimize geocoding cache lookups

**Cleanup:**
- Remove any stray console.log statements
- Add missing try/catch blocks around API calls (LinkedIn, Mapbox, OSRM)
- Remove unused variables/functions if found
- Ensure consistent error handling patterns

**Constraints:**
- Single-file architecture preserved (no modularization)
- No new dependencies
- No framework changes

### 2. Test Coverage (80%+)

**Strategy:** Expand `module.exports` to cover more functions, write unit tests with mocks.

**Test groups (priority order):**

| Group | Functions | Est. Tests |
|-------|-----------|------------|
| Geocoding | geocodeLocation, geocodeJobs, getProximityHint | ~15 |
| LinkedIn API | getCsrfToken, fetchJobWithCompany, buildAddressString | ~15 |
| Filtering/Sorting | getFilteredJobs, filter handlers | ~20 |
| Map/UI helpers | buildPopup, updateMarkers, marker logic | ~15 |
| Routing | fetchRoute, commute calculations | ~10 |
| CSV Export | exportJobsCSV | ~5 |
| Session/Storage | loadSession, saveSession | ~10 |

**Tools:** Vitest + jsdom (existing) + mocks for fetch, chrome.storage, Leaflet

**Config change:** Update vitest.config.js thresholds from 20% to 80%

### 3. Chrome Web Store Publishing

**Store listing materials:**
- Short description (max 132 chars)
- Detailed description (adapted from README)
- Screenshots (1280x800, minimum 1, target 3-5)
- Promotional tile (440x280, optional)
- Category: Productivity
- Languages: English (primary) + Turkish

**Privacy policy:**
- Create PRIVACY.md in repo root
- Host via GitHub Pages or link to raw GitHub file
- Content: no data collection, local processing only, no analytics

**Package (zip):**
- Include: manifest.json, content.js, options.js, options.html, styles.css, leaflet.*, icons/
- Exclude: node_modules, tests, coverage, docs, .claude, docker-compose.yml, sonar-project.properties, .env*, .git

**Submission:**
- Upload to Chrome Web Store developer dashboard
- Review period: 1-3 business days (first submission may take longer)
- Update README with actual Web Store URL after approval

## Out of Scope

- Modularization (deferred to future version)
- TypeScript migration
- New features
- Build pipeline (Webpack/Vite)
- Background service worker
- E2E/integration tests

## Success Criteria

- All existing tests pass
- Coverage >= 80% (branches, functions, lines, statements)
- ESLint passes with no warnings
- Extension loads and functions correctly in Chrome
- Successfully submitted to Chrome Web Store
- Privacy policy published and linked
