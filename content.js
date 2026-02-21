(function () {
  "use strict";

  if (document.getElementById("ljm-panel")) return;

  // ── Constants ──

  var DEFAULT_TOKEN = "pk.eyJ1IjoidXlndW5mbHkiLCJhIjoiY21qbTVrd2lkMGpybDNkc2VnbXNoOWYyOSJ9.nGp8dJddewwJPS9FyXbByg";
  var GEOCODE_CACHE_KEY = "ljm_geocode_cache_v3";
  var MY_LOC_KEY = "ljm_my_location";
  var ALL_JOBS_KEY = "ljm_all_jobs";
  var COMPANY_NAMES_KEY = "ljm_company_names";
  var MAPBOX_TOKEN = DEFAULT_TOKEN;

  var WORKPLACE_ONSITE = 1;
  var WORKPLACE_REMOTE = 2;
  var WORKPLACE_HYBRID = 3;

  var WORKPLACE_COLORS = {};
  WORKPLACE_COLORS[WORKPLACE_ONSITE] = "#3b82f6";
  WORKPLACE_COLORS[WORKPLACE_REMOTE] = "#a855f7";
  WORKPLACE_COLORS[WORKPLACE_HYBRID] = "#10b981";

  var CONCURRENCY_LI = 4;
  var CONCURRENCY_GEO = 6;

  // ── i18n System ──

  var currentLocale = "en";

  var translations = {
    en: {
      openJobMap: "Open Job Map",
      linkedInJobMap: "LinkedIn Job Map",
      rescanJobs: "Rescan jobs",
      clearJobs: "Clear jobs",
      clearAllCache: "Clear all cache",
      fullscreen: "Fullscreen",
      exitFullscreen: "Exit fullscreen",
      closePanel: "Close panel",
      loadingBackground: "Loading in background...",
      onSite: "On-site",
      remote: "Remote",
      hybrid: "Hybrid",
      unknown: "Unknown",
      myLocation: "My Location",
      remove: "Remove",
      myLocationGPS: "My location (GPS)",
      zoomIn: "Zoom in",
      zoomOut: "Zoom out",
      commute: "COMMUTE",
      na: "N/A",
      min: "min",
      away: "away",
      approx: "approx",
      mappedJobs: "Mapped Jobs",
      ready: "Ready",
      live: "Live",
      updatedJustNow: "Updated just now",
      viewJob: "View Job",
      linkedInBtn: "LinkedIn",
      mapsBtn: "Maps",
      calculatingRoute: "Calculating route...",
      routeNotAvailable: "Route not available. Try Google Maps link.",
      routeInfo: "Route: {distance} km, ~{duration} min",
      noNewJobs: "No new jobs on this page. Total: {total}",
      newJobsFetching: "{count} new jobs. Fetching...",
      jobsProgress: "Jobs: {done}/{total}",
      gettingAddresses: "{count} jobs. Getting addresses...",
      companiesProgress: "Companies: {done}/{total}",
      preciseGeocoding: "{precise}/{total} precise. Geocoding...",
      geocodingProgress: "Geocoding: {done}/{total}",
      jobsCollected: "{total} jobs collected ({precise} precise). Open map to view.",
      mappedSummary: "{total} mapped ({precise} precise) | {onSite}: {onSiteN}, {hybrid}: {hybridN}, {remote}: {remoteN}",
      csrfNotFound: "CSRF token not found. Refresh the page.",
      pageChanged: "Page changed. Scanning new jobs...",
      newJobsDetected: "New jobs detected...",
      loadingJobData: "Loading job data...",
      allJobsCleared: "All jobs cleared. Scanning current page...",
      allCacheCleared: "All cache cleared. Re-scanning...",
      geoNotSupported: "Geolocation not supported by this browser.",
      gettingGPS: "Getting GPS location...",
      gpsSet: "GPS location set.",
      gpsFailed: "Could not get GPS location. Click the map instead.",
      sortBy: "Sort",
      sortDistance: "Distance",
      sortCompany: "Company",
      sortType: "Type",
      filterAll: "All",
      showingOf: "{shown} of {total}",
      noJobsMatch: "No jobs match filters.",
      searchPlaceholder: "Search jobs...",
      exportCSV: "Export CSV",
      justNow: "Just now",
      minutesAgo: "{n}m ago",
      hoursAgo: "{n}h ago",
      daysAgo: "{n}d ago",
      weeksAgo: "{n}w ago",
      posted: "Posted",
      sortDate: "Date"
    },
    tr: {
      openJobMap: "Haritayi Ac",
      linkedInJobMap: "LinkedIn Is Haritasi",
      rescanJobs: "Tekrar tara",
      clearJobs: "Isleri temizle",
      clearAllCache: "Onbellegi temizle",
      fullscreen: "Tam ekran",
      exitFullscreen: "Tam ekrandan cik",
      closePanel: "Paneli kapat",
      loadingBackground: "Arka planda yukleniyor...",
      onSite: "Yerinde",
      remote: "Uzaktan",
      hybrid: "Hibrit",
      unknown: "Bilinmiyor",
      myLocation: "Benim Konumum",
      remove: "Kaldir",
      myLocationGPS: "Konumum (GPS)",
      zoomIn: "Yakinlastir",
      zoomOut: "Uzaklastir",
      commute: "YOLCULUK",
      na: "N/A",
      min: "dk",
      away: "uzakta",
      approx: "tahmini",
      mappedJobs: "Haritadaki Isler",
      ready: "Hazir",
      live: "Canli",
      updatedJustNow: "Az once guncellendi",
      viewJob: "Ilana Git",
      linkedInBtn: "LinkedIn",
      mapsBtn: "Haritalar",
      calculatingRoute: "Rota hesaplaniyor...",
      routeNotAvailable: "Rota mevcut degil. Google Haritalar linkini deneyin.",
      routeInfo: "Rota: {distance} km, ~{duration} dk",
      noNewJobs: "Bu sayfada yeni is yok. Toplam: {total}",
      newJobsFetching: "{count} yeni is. Aliniyor...",
      jobsProgress: "Isler: {done}/{total}",
      gettingAddresses: "{count} is. Adresler aliniyor...",
      companiesProgress: "Sirketler: {done}/{total}",
      preciseGeocoding: "{precise}/{total} kesin. Kodlaniyor...",
      geocodingProgress: "Kodlama: {done}/{total}",
      jobsCollected: "{total} is toplandi ({precise} kesin). Goruntulemek icin haritayi acin.",
      mappedSummary: "{total} haritalandi ({precise} kesin) | {onSite}: {onSiteN}, {hybrid}: {hybridN}, {remote}: {remoteN}",
      csrfNotFound: "CSRF token bulunamadi. Sayfayi yenileyin.",
      pageChanged: "Sayfa degisti. Yeni isler taraniyor...",
      newJobsDetected: "Yeni isler algilandi...",
      loadingJobData: "Is verileri yukleniyor...",
      allJobsCleared: "Tum isler temizlendi. Sayfa taraniyor...",
      allCacheCleared: "Onbellek temizlendi. Tekrar taraniyor...",
      geoNotSupported: "Bu tarayici konum desteklemiyor.",
      gettingGPS: "GPS konumu aliniyor...",
      gpsSet: "GPS konumu ayarlandi.",
      gpsFailed: "GPS alinamadi. Haritaya tiklayin.",
      sortBy: "Sirala",
      sortDistance: "Mesafe",
      sortCompany: "Sirket",
      sortType: "Tur",
      filterAll: "Hepsi",
      showingOf: "{total} icinden {shown}",
      noJobsMatch: "Filtreye uyan is yok.",
      searchPlaceholder: "Is ara...",
      exportCSV: "CSV Indir",
      justNow: "Az once",
      minutesAgo: "{n}dk once",
      hoursAgo: "{n}sa once",
      daysAgo: "{n}g once",
      weeksAgo: "{n}hf once",
      posted: "Yayinlandi",
      sortDate: "Tarih"
    }
  };

  function t(key, params) {
    var lang = translations[currentLocale] || translations.en;
    var str = lang[key] || translations.en[key] || key;
    if (params) {
      var keys = Object.keys(params);
      for (var i = 0; i < keys.length; i++) {
        str = str.replace(new RegExp("\\{" + keys[i] + "\\}", "g"), params[keys[i]]);
      }
    }
    return str;
  }

  function detectLocale() {
    var lang = (navigator.language || "en").substring(0, 2).toLowerCase();
    currentLocale = translations[lang] ? lang : "en";
  }

  function getWorkplaceLabel(wt) {
    if (wt === WORKPLACE_HYBRID) return t("hybrid");
    if (wt === WORKPLACE_REMOTE) return t("remote");
    return t("onSite");
  }

  // ── State ──

  var map = null;
  var markersLayer = null;
  var myLocationLayer = null;
  var routeLayer = null;
  var myLocationMarker = null;
  var myLocation = null;
  var currentGeoJobs = [];
  var markerRefs = {};
  var isFullscreen = false;
  var panelEl = null;
  var toggleBtnEl = null;
  var highlightLayer = null;
  var isSyncing = false;
  var pendingFocusJobId = null;
  var mapInitialized = false;

  var allJobsById = {};
  var companyNames = {};
  var pagesScanned = 0;
  var lastUrl = location.href;
  var jobListObserver = null;
  var isLoading = false;
  var shouldFitBoundsNext = true;

  // Filter & Sort state
  var filterState = { onSite: true, hybrid: true, remote: true };
  var sortState = "distance"; // "distance" | "company" | "type"
  var searchQuery = "";

  // Cards panel elements
  var cardsListEl = null;
  var cardsBadgeEl = null;
  var cardsFooterTimeEl = null;

  // ── Session storage helpers ──

  function loadSession(key) {
    try { return JSON.parse(sessionStorage.getItem(key)); }
    catch (e) { return null; }
  }

  function saveSession(key, data) {
    try { sessionStorage.setItem(key, JSON.stringify(data)); }
    catch (e) {}
  }

  function loadAccumulatedState() {
    allJobsById = loadSession(ALL_JOBS_KEY) || {};
    companyNames = loadSession(COMPANY_NAMES_KEY) || {};
    pagesScanned = Object.keys(allJobsById).length > 0 ? 1 : 0;
  }

  function saveAccumulatedState() {
    saveSession(ALL_JOBS_KEY, allJobsById);
    saveSession(COMPANY_NAMES_KEY, companyNames);
  }

  function getAllJobs() {
    return Object.keys(allJobsById).map(function (k) { return allJobsById[k]; });
  }

  // ── Helpers ──

  function getGeocodeCache() {
    try { return JSON.parse(localStorage.getItem(GEOCODE_CACHE_KEY) || "{}"); }
    catch (e) { return {}; }
  }

  function setGeocodeCache(cache) {
    localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache));
  }

  function getCsrfToken() {
    var cookies = document.cookie.split(";");
    for (var i = 0; i < cookies.length; i++) {
      var c = cookies[i].trim();
      if (c.indexOf("JSESSIONID=") === 0) return c.split("=")[1].replace(/"/g, "");
    }
    return "";
  }

  function getWorkplaceType(wt) {
    if (!wt || !wt.length) return WORKPLACE_ONSITE;
    return parseInt(wt[0].split(":").pop(), 10) || WORKPLACE_ONSITE;
  }

  function apiHeaders(csrf) {
    return { "csrf-token": csrf, "accept": "application/vnd.linkedin.normalized+json+2.1" };
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function timeAgo(timestamp) {
    if (!timestamp) return "";
    var diff = Date.now() - timestamp;
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return t("justNow");
    if (mins < 60) return t("minutesAgo", { n: mins });
    var hours = Math.floor(mins / 60);
    if (hours < 24) return t("hoursAgo", { n: hours });
    var days = Math.floor(hours / 24);
    if (days < 7) return t("daysAgo", { n: days });
    var weeks = Math.floor(days / 7);
    return t("weeksAgo", { n: weeks });
  }

  function debounce(fn, ms) {
    var timer;
    return function () { clearTimeout(timer); timer = setTimeout(fn, ms); };
  }

  // ── Parallel processing (worker pool) ──

  function processInParallel(items, fn, concurrency, onProgress) {
    var results = new Array(items.length);
    var nextIdx = 0;
    var doneCount = 0;

    return new Promise(function (resolve) {
      if (items.length === 0) { resolve([]); return; }

      function runWorker() {
        var myIdx = nextIdx++;
        if (myIdx >= items.length) return;

        fn(items[myIdx], myIdx).then(function (result) {
          results[myIdx] = result;
          doneCount++;
          if (onProgress) onProgress(doneCount, items.length);
          if (doneCount >= items.length) {
            resolve(results);
          } else {
            runWorker();
          }
        }).catch(function () {
          results[myIdx] = null;
          doneCount++;
          if (onProgress) onProgress(doneCount, items.length);
          if (doneCount >= items.length) {
            resolve(results);
          } else {
            runWorker();
          }
        });
      }

      var workers = Math.min(concurrency, items.length);
      for (var i = 0; i < workers; i++) {
        runWorker();
      }
    });
  }

  function haversineKm(lat1, lng1, lat2, lng2) {
    var R = 6371;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLng = (lng2 - lng1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function formatDistance(km) {
    if (km < 1) return Math.round(km * 1000) + " m";
    return km.toFixed(1) + " km";
  }

  // ── Commute estimation (distance-based zones) ──

  function estimateCommuteMin(km) {
    if (!km || km <= 0) return 0;
    if (km <= 2) return Math.round(km * 8 + 5);
    if (km <= 5) return Math.round(km * 3);
    if (km <= 15) return Math.round(km * 1.5);
    if (km <= 30) return Math.round(km * 1.2);
    return Math.round(km * 1.0);
  }

  function getCommuteDisplay(job) {
    if (job.workplaceType === WORKPLACE_REMOTE) {
      return { text: t("na"), cls: "ljm-commute-na" };
    }
    if (!myLocation) {
      return { text: "--", cls: "ljm-commute-na" };
    }
    var km = haversineKm(myLocation.lat, myLocation.lng, job.lat, job.lng);
    var mins = estimateCommuteMin(km);
    var cls = mins <= 15 ? "ljm-commute-short" : (mins <= 40 ? "ljm-commute-medium" : "ljm-commute-long");
    return { text: "\uD83D\uDE97 " + mins + " " + t("min"), cls: cls, km: km, mins: mins };
  }

  // ── Extract jobs from DOM & capture company names ──

  function extractJobIds() {
    var cards = document.querySelectorAll("[data-job-id]");
    var ids = [], seen = {};
    cards.forEach(function (card) {
      var id = card.getAttribute("data-job-id");
      if (id && !seen[id]) { seen[id] = true; ids.push(id); }
    });
    return ids;
  }

  function captureCompanyNamesFromDOM() {
    document.querySelectorAll("[data-job-id]").forEach(function (card) {
      var id = card.getAttribute("data-job-id");
      if (!id || companyNames[id]) return;
      var el = card.querySelector(".job-card-container__primary-description, .artdeco-entity-lockup__subtitle");
      if (el) companyNames[id] = el.textContent.trim();
    });
    saveSession(COMPANY_NAMES_KEY, companyNames);
  }

  function getCompanyName(jobId) {
    if (companyNames[jobId]) return companyNames[jobId];
    var card = document.querySelector('[data-job-id="' + jobId + '"]');
    if (!card) return "";
    var el = card.querySelector(".job-card-container__primary-description, .artdeco-entity-lockup__subtitle");
    var name = el ? el.textContent.trim() : "";
    if (name) companyNames[jobId] = name;
    return name;
  }

  // ── Company data cache ──

  var companyCache = {};

  function fetchCompanyLocations(companyId, csrf) {
    if (companyCache[companyId]) return Promise.resolve(companyCache[companyId]);
    return fetch("https://www.linkedin.com/voyager/api/organization/dash/companies/" + companyId, {
      headers: apiHeaders(csrf)
    })
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (json) {
      if (!json) return null;
      var d = json.data || json;
      var logoUrl = null;
      try {
        var logoImg = d.logo && d.logo.image && d.logo.image["com.linkedin.common.VectorImage"];
        if (logoImg && logoImg.rootUrl && logoImg.artifacts && logoImg.artifacts.length > 0) {
          logoUrl = logoImg.rootUrl + logoImg.artifacts[logoImg.artifacts.length - 1].fileIdentifyingUrlPathSegment;
        }
      } catch (e) {}
      var result = {
        headquarter: d.headquarter || null,
        confirmedLocations: d.confirmedLocations || [],
        groupedLocationsByCountry: d.groupedLocationsByCountry || [],
        logoUrl: logoUrl
      };
      companyCache[companyId] = result;
      return result;
    })
    .catch(function () { return null; });
  }

  function buildAddressString(loc) {
    if (!loc || !loc.address) return null;
    var a = loc.address, parts = [];
    if (a.line1) parts.push(a.line1);
    if (a.city) parts.push(a.city);
    if (a.geographicArea) parts.push(a.geographicArea);
    if (a.postalCode) parts.push(a.postalCode);
    if (a.country) parts.push(a.country);
    return parts.length > 0 ? parts.join(", ") : null;
  }

  function extractGeoLocation(loc) {
    if (!loc) return null;
    var geo = loc.geoLocation || loc.geographicLocation || null;
    if (geo && geo.latitude && geo.longitude) {
      return { lat: geo.latitude, lng: geo.longitude };
    }
    return null;
  }

  function findBestAddress(companyData, jobLocation) {
    if (!companyData) return null;
    var jobCity = (jobLocation || "").split(",")[0].trim().toLowerCase();
    var allLocations = [];
    (companyData.groupedLocationsByCountry || []).forEach(function (g) {
      (g.locations || []).forEach(function (l) { allLocations.push(l); });
    });
    (companyData.confirmedLocations || []).forEach(function (l) { allLocations.push(l); });

    for (var i = 0; i < allLocations.length; i++) {
      var locCity = (allLocations[i].address && allLocations[i].address.city || "").toLowerCase();
      if (locCity && jobCity && (locCity.indexOf(jobCity) >= 0 || jobCity.indexOf(locCity) >= 0)) {
        return {
          address: buildAddressString(allLocations[i]),
          geo: extractGeoLocation(allLocations[i]),
          country: allLocations[i].address && allLocations[i].address.country || null
        };
      }
    }
    if (companyData.headquarter) {
      return {
        address: buildAddressString(companyData.headquarter),
        geo: extractGeoLocation(companyData.headquarter),
        country: companyData.headquarter.address && companyData.headquarter.address.country || null
      };
    }
    return null;
  }

  // ── Fetch job + company ──

  function fetchJobWithCompany(jobId, csrf) {
    return fetch("https://www.linkedin.com/voyager/api/jobs/jobPostings/" + jobId, {
      headers: apiHeaders(csrf)
    })
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (json) {
      if (!json || !json.data) return null;
      var d = json.data;
      var wt = getWorkplaceType(d.workplaceTypes);
      var companyUrn = d.companyDetails && d.companyDetails.company ? d.companyDetails.company : null;
      return {
        jobId: jobId, title: d.title || "", formattedLocation: d.formattedLocation || "",
        workRemoteAllowed: !!d.workRemoteAllowed,
        workplaceType: wt,
        workplaceLabel: getWorkplaceLabel(wt),
        companyId: companyUrn ? companyUrn.split(":").pop() : null,
        listedAt: d.listedAt || null
      };
    })
    .catch(function () { return null; });
  }

  function enrichWithCompanyAddress(jobs, csrf, onProgress) {
    var companyIds = [], seen = {};
    jobs.forEach(function (j) {
      if (j.companyId && !seen[j.companyId]) { seen[j.companyId] = true; companyIds.push(j.companyId); }
    });

    return processInParallel(companyIds, function (cid) {
      return fetchCompanyLocations(cid, csrf);
    }, CONCURRENCY_LI, onProgress).then(function () {
      jobs.forEach(function (job) {
        var cd = companyCache[job.companyId] || null;
        var result = findBestAddress(cd, job.formattedLocation);
        if (result) {
          job.geocodeAddress = result.address || job.formattedLocation;
          job.hasPreciseAddress = true;
          if (result.geo) {
            job.directLat = result.geo.lat;
            job.directLng = result.geo.lng;
          }
          if (result.country) job.countryCode = result.country;
        } else {
          job.geocodeAddress = job.formattedLocation;
          job.hasPreciseAddress = false;
        }
        // Extract country code from formattedLocation if not set
        if (!job.countryCode) {
          var locParts = (job.formattedLocation || "").split(",");
          var lastPart = (locParts[locParts.length - 1] || "").trim();
          if (lastPart.length === 2) job.countryCode = lastPart.toUpperCase();
        }
        if (cd && cd.logoUrl) job.logoUrl = cd.logoUrl;
      });
      return jobs;
    });
  }

  // ── Geocoding ──

  function geocodeLocation(location, proximity, country) {
    var cache = getGeocodeCache();
    if (cache[location]) return Promise.resolve(cache[location]);
    var url = "https://api.mapbox.com/geocoding/v5/mapbox.places/" +
      encodeURIComponent(location) + ".json?access_token=" + MAPBOX_TOKEN + "&limit=1";
    if (proximity) {
      url += "&proximity=" + proximity.lng + "," + proximity.lat;
    }
    if (country) {
      url += "&country=" + country.toLowerCase();
    }
    return fetch(url)
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        if (data && data.features && data.features.length > 0) {
          var c = data.features[0].center;
          var result = { lng: c[0], lat: c[1] };
          cache[location] = result;
          setGeocodeCache(cache);
          return result;
        }
        return null;
      })
      .catch(function () { return null; });
  }

  function getProximityHint() {
    if (myLocation) return { lat: myLocation.lat, lng: myLocation.lng };
    var existing = getAllJobs();
    if (existing.length === 0) return null;
    var sumLat = 0, sumLng = 0, count = 0;
    existing.forEach(function (j) {
      if (j.lat && j.lng) { sumLat += j.lat; sumLng += j.lng; count++; }
    });
    if (count === 0) return null;
    return { lat: sumLat / count, lng: sumLng / count };
  }

  function geocodeJobs(jobs, onProgress) {
    // Separate: jobs with direct coordinates vs jobs needing geocoding
    var needGeocode = [];
    var addrs = [], addrSet = {};
    jobs.forEach(function (j) {
      if (j.directLat && j.directLng) return; // has LinkedIn coordinates
      if (j.geocodeAddress && !addrSet[j.geocodeAddress]) {
        addrSet[j.geocodeAddress] = true;
        addrs.push({ address: j.geocodeAddress, country: j.countryCode || null });
      }
    });

    var proximity = getProximityHint();
    var addrMap = {};
    return processInParallel(addrs, function (item) {
      return geocodeLocation(item.address, proximity, item.country).then(function (res) {
        if (res) addrMap[item.address] = res;
        return res;
      });
    }, CONCURRENCY_GEO, onProgress).then(function () {
      return jobs.map(function (job) {
        var lat, lng;
        if (job.directLat && job.directLng) {
          lat = job.directLat;
          lng = job.directLng;
        } else {
          var geo = addrMap[job.geocodeAddress];
          if (!geo) return null;
          lat = geo.lat;
          lng = geo.lng;
        }
        return {
          jobId: job.jobId, title: job.title, company: getCompanyName(job.jobId),
          location: job.formattedLocation, address: job.geocodeAddress,
          hasPreciseAddress: job.hasPreciseAddress,
          workplaceType: job.workplaceType, workplaceLabel: job.workplaceLabel,
          lng: lng, lat: lat,
          listedAt: job.listedAt || null,
          logoUrl: job.logoUrl || null
        };
      }).filter(Boolean);
    });
  }

  // ── Routing (OSRM) ──

  function fetchRoute(fromLat, fromLng, toLat, toLng) {
    var url = "https://router.project-osrm.org/route/v1/driving/" +
      fromLng + "," + fromLat + ";" + toLng + "," + toLat +
      "?overview=full&geometries=geojson";
    return fetch(url)
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        if (data && data.routes && data.routes.length > 0) {
          var r = data.routes[0];
          return {
            geometry: r.geometry,
            distanceKm: (r.distance / 1000).toFixed(1),
            durationMin: Math.round(r.duration / 60)
          };
        }
        return null;
      })
      .catch(function () { return null; });
  }

  function showRoute(toLat, toLng) {
    if (!myLocation) return;
    clearRoute();
    setStatus(t("calculatingRoute"), true);
    fetchRoute(myLocation.lat, myLocation.lng, toLat, toLng).then(function (route) {
      if (!route) { setStatus(t("routeNotAvailable")); return; }
      routeLayer = L.geoJSON(route.geometry, {
        style: { color: "#0a66c2", weight: 5, opacity: 0.8 }
      }).addTo(map);
      map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
      setStatus(t("routeInfo", { distance: route.distanceKm, duration: route.durationMin }));
    });
  }

  function clearRoute() {
    if (routeLayer) { map.removeLayer(routeLayer); routeLayer = null; }
  }

  // ── Popup builder ──

  function getWtClass(wt) {
    if (wt === WORKPLACE_HYBRID) return "ljm-wt-hybrid";
    if (wt === WORKPLACE_REMOTE) return "ljm-wt-remote";
    return "ljm-wt-onsite";
  }

  function getTagClass(wt) {
    if (wt === WORKPLACE_HYBRID) return "ljm-tag-hybrid";
    if (wt === WORKPLACE_REMOTE) return "ljm-tag-remote";
    return "ljm-tag-onsite";
  }

  function buildPopup(job) {
    var linkUrl = "https://www.linkedin.com/jobs/view/" + job.jobId;
    var wtClass = getWtClass(job.workplaceType);
    var addrText = job.hasPreciseAddress ? job.address : job.location;

    var distHtml = "";
    if (myLocation && job.workplaceType !== WORKPLACE_REMOTE) {
      var info = getCommuteDisplay(job);
      distHtml = '<div class="ljm-popup-distance">' +
        '<span>\uD83D\uDE97</span>' +
        '<span>' + formatDistance(info.km) + ' ' + t("away") + ' (' + t("approx") + ' ' + info.mins + ' ' + t("min") + ')</span>' +
        '</div>';
    }

    var mapsUrl = myLocation
      ? "https://www.google.com/maps/dir/?api=1&origin=" + myLocation.lat + "," + myLocation.lng + "&destination=" + job.lat + "," + job.lng
      : "https://www.google.com/maps/dir/?api=1&destination=" + job.lat + "," + job.lng;

    var logoHtml = job.logoUrl
      ? '<img class="ljm-popup-logo" src="' + escapeHtml(job.logoUrl) + '" alt="" onerror="this.style.display=\'none\'">'
      : '';

    return '<div class="ljm-popup">' +
      '<div class="ljm-popup-header">' +
        logoHtml +
        '<div>' +
          '<div class="ljm-popup-title">' + escapeHtml(job.title) + '</div>' +
          '<div class="ljm-popup-company">' + escapeHtml(job.company) + '</div>' +
        '</div>' +
        '<span class="ljm-popup-wt-badge ' + wtClass + '">' + escapeHtml(getWorkplaceLabel(job.workplaceType)) + '</span>' +
      '</div>' +
      '<div class="ljm-popup-address">' +
        '<span class="ljm-popup-addr-icon">\u25CF</span>' +
        '<span>' + escapeHtml(addrText) + '</span>' +
      '</div>' +
      (job.listedAt ? '<div class="ljm-popup-time">' + escapeHtml(t("posted")) + ': ' + escapeHtml(timeAgo(job.listedAt)) + '</div>' : '') +
      distHtml +
      '<div class="ljm-popup-actions">' +
        '<a href="' + linkUrl + '" target="_blank" class="ljm-popup-btn ljm-popup-btn-primary">' + t("linkedInBtn") + '</a>' +
        '<a href="' + mapsUrl + '" target="_blank" class="ljm-popup-btn ljm-popup-btn-secondary">' + t("mapsBtn") + ' \u2197</a>' +
      '</div>' +
    '</div>';
  }

  // ── Filtering & Sorting ──

  function getFilteredJobs() {
    var all = getAllJobs();

    // Apply workplace type filter
    var filtered = all.filter(function (job) {
      if (job.workplaceType === WORKPLACE_ONSITE && !filterState.onSite) return false;
      if (job.workplaceType === WORKPLACE_HYBRID && !filterState.hybrid) return false;
      if (job.workplaceType === WORKPLACE_REMOTE && !filterState.remote) return false;
      return true;
    });

    // Apply search filter
    if (searchQuery) {
      var q = searchQuery.toLowerCase();
      filtered = filtered.filter(function (job) {
        return (job.title && job.title.toLowerCase().indexOf(q) >= 0) ||
               (job.company && job.company.toLowerCase().indexOf(q) >= 0) ||
               (job.location && job.location.toLowerCase().indexOf(q) >= 0);
      });
    }

    // Apply sort
    if (sortState === "distance" && myLocation) {
      filtered.sort(function (a, b) {
        var dA = haversineKm(myLocation.lat, myLocation.lng, a.lat, a.lng);
        var dB = haversineKm(myLocation.lat, myLocation.lng, b.lat, b.lng);
        return dA - dB;
      });
    } else if (sortState === "company") {
      filtered.sort(function (a, b) {
        return (a.company || "").localeCompare(b.company || "");
      });
    } else if (sortState === "type") {
      filtered.sort(function (a, b) {
        return a.workplaceType - b.workplaceType;
      });
    } else if (sortState === "date") {
      filtered.sort(function (a, b) {
        return (b.listedAt || 0) - (a.listedAt || 0);
      });
    }

    return filtered;
  }

  // ── Map ──

  function initMap(container) {
    map = L.map(container, { center: [30, 0], zoom: 2, zoomControl: false });
    L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=" + MAPBOX_TOKEN, {
      tileSize: 512, zoomOffset: -1, maxZoom: 18, attribution: "&copy; Mapbox"
    }).addTo(map);

    // Use markerClusterGroup for clustering
    markersLayer = L.markerClusterGroup({
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: function (cluster) {
        var count = cluster.getChildCount();
        var size = count < 10 ? "ljm-cluster-small" : (count < 30 ? "ljm-cluster-medium" : "ljm-cluster-large");
        return L.divIcon({
          html: '<div class="ljm-cluster-icon ' + size + '">' + count + '</div>',
          className: "ljm-cluster-wrapper",
          iconSize: L.point(36, 36)
        });
      }
    });
    map.addLayer(markersLayer);
    myLocationLayer = L.layerGroup().addTo(map);

    map.on("popupopen", function (e) {
      var popup = e.popup;
      if (!isSyncing) {
        var sourceMarker = popup._source;
        if (sourceMarker && sourceMarker._ljmJobId) {
          isSyncing = true;
          focusJobInList(sourceMarker._ljmJobId);
          focusJobInCardsPanel(sourceMarker._ljmJobId);
          setTimeout(function () { isSyncing = false; }, 1000);
        }
      }
    });

    var saved = localStorage.getItem(MY_LOC_KEY);
    if (saved) {
      try {
        var loc = JSON.parse(saved);
        if (loc.lat && loc.lng) setMyLocation(loc.lat, loc.lng, true);
      } catch (e) {}
    }
  }

  // ── My Location ──

  function setMyLocation(lat, lng, skipSave) {
    myLocation = { lat: lat, lng: lng };
    myLocationLayer.clearLayers();

    var icon = L.divIcon({
      className: "ljm-my-loc-icon",
      html: '<div class="ljm-my-loc-dot"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    myLocationMarker = L.marker([lat, lng], { icon: icon, draggable: true }).addTo(myLocationLayer);
    myLocationMarker.bindPopup('<div style="font-family:system-ui;color:#fff;font-size:12px"><strong>' + t("myLocation") + '</strong><br>' +
      lat.toFixed(5) + ', ' + lng.toFixed(5) +
      '<br><a href="#" class="ljm-clear-loc" style="color:#ef4444;font-size:11px;text-decoration:none">' + t("remove") + '</a></div>');

    myLocationMarker.on("dragend", function () {
      var pos = myLocationMarker.getLatLng();
      myLocation = { lat: pos.lat, lng: pos.lng };
      localStorage.setItem(MY_LOC_KEY, JSON.stringify(myLocation));
      refreshPopups();
    });

    if (!skipSave) localStorage.setItem(MY_LOC_KEY, JSON.stringify(myLocation));
    refreshPopups();
  }

  function clearMyLocation() {
    myLocation = null;
    myLocationMarker = null;
    myLocationLayer.clearLayers();
    localStorage.removeItem(MY_LOC_KEY);
    clearRoute();
    refreshPopups();
  }

  function useGPS() {
    if (!navigator.geolocation) { setStatus(t("geoNotSupported")); return; }
    setStatus(t("gettingGPS"), true);
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        setMyLocation(pos.coords.latitude, pos.coords.longitude);
        map.setView([pos.coords.latitude, pos.coords.longitude], 12);
        setStatus(t("gpsSet"));
      },
      function () { setStatus(t("gpsFailed")); }
    );
  }

  function refreshPopups() {
    currentGeoJobs.forEach(function (job) {
      var m = markerRefs[job.jobId];
      if (m) m.setPopupContent(buildPopup(job));
    });
  }

  // ── Bidirectional sync ──

  function focusJobOnMap(jobId) {
    if (!mapInitialized) {
      pendingFocusJobId = jobId;
      if (toggleBtnEl) toggleBtnEl.click();
      return;
    }
    var marker = markerRefs[jobId];
    if (!marker) { pendingFocusJobId = jobId; return; }
    pendingFocusJobId = null;

    if (panelEl && panelEl.classList.contains("ljm-hidden")) {
      panelEl.classList.remove("ljm-hidden");
      setTimeout(function () { if (map) map.invalidateSize(); }, 200);
    }

    var latlng = marker.getLatLng();
    map.setView(latlng, Math.max(map.getZoom(), 14), { animate: true });
    setTimeout(function () {
      // Unspiderfy cluster if needed, then open popup
      markersLayer.zoomToShowLayer(marker, function () {
        marker.openPopup();
        highlightMarkerRing(latlng);
      });
    }, 350);
  }

  function highlightMarkerRing(latlng) {
    if (highlightLayer) { map.removeLayer(highlightLayer); }
    highlightLayer = L.circleMarker(latlng, {
      radius: 22, fillColor: "transparent", color: "#f59e0b",
      weight: 3, opacity: 0.9, fillOpacity: 0
    }).addTo(map);
    setTimeout(function () {
      if (highlightLayer) { map.removeLayer(highlightLayer); highlightLayer = null; }
    }, 2500);
  }

  function focusJobInList(jobId) {
    var card = document.querySelector('[data-job-id="' + jobId + '"]');
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    isSyncing = true;
    setTimeout(function () {
      card.click();
      setTimeout(function () { isSyncing = false; }, 500);
    }, 300);
    card.style.transition = "box-shadow 0.3s ease";
    card.style.boxShadow = "inset 0 0 0 2px #f59e0b";
    setTimeout(function () { card.style.boxShadow = ""; }, 2500);
  }

  function focusJobInCardsPanel(jobId) {
    if (!cardsListEl || !isFullscreen) return;
    var card = cardsListEl.querySelector('[data-ljm-job="' + jobId + '"]');
    if (!card) return;
    var prev = cardsListEl.querySelector(".ljm-card-active");
    if (prev) prev.classList.remove("ljm-card-active");
    card.classList.add("ljm-card-active");
    card.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function setupJobCardClickListener() {
    document.addEventListener("click", function (e) {
      if (isSyncing) return;
      if (e.target.closest("#ljm-panel") || e.target.closest("#ljm-toggle-btn")) return;
      var card = e.target.closest("[data-job-id]");
      if (!card) return;
      var jobId = card.getAttribute("data-job-id");
      if (!jobId) return;
      isSyncing = true;
      focusJobOnMap(jobId);
      setTimeout(function () { isSyncing = false; }, 1000);
    }, true);
  }

  // ── Markers ──

  function updateMarkers(geoJobs) {
    if (!map || !markersLayer) return;
    markersLayer.clearLayers();
    markerRefs = {};
    currentGeoJobs = geoJobs;

    // Detect duplicate coordinates and apply jitter
    var coordCount = {};
    var coordIndex = {};
    geoJobs.forEach(function (job) {
      var key = job.lat.toFixed(5) + "," + job.lng.toFixed(5);
      coordCount[key] = (coordCount[key] || 0) + 1;
    });

    var bounds = [];
    geoJobs.forEach(function (job) {
      var key = job.lat.toFixed(5) + "," + job.lng.toFixed(5);
      var lat = job.lat, lng = job.lng;
      if (coordCount[key] > 1) {
        if (!coordIndex[key]) coordIndex[key] = 0;
        var idx = coordIndex[key]++;
        var total = coordCount[key];
        var angle = (2 * Math.PI * idx) / total;
        var offset = 0.0004; // ~40m spread
        lat += Math.cos(angle) * offset;
        lng += Math.sin(angle) * offset;
      }
      var color = WORKPLACE_COLORS[job.workplaceType] || "#0a66c2";
      var marker = L.circleMarker([lat, lng], {
        radius: 7, fillColor: color, color: "#fff", weight: 2, opacity: 1, fillOpacity: 0.9
      });
      marker.bindPopup(buildPopup(job));
      marker._ljmJobId = job.jobId;
      markersLayer.addLayer(marker);
      markerRefs[job.jobId] = marker;
      bounds.push([lat, lng]);
    });

    if (shouldFitBoundsNext && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
      shouldFitBoundsNext = false;
    }
  }

  // ── Filter chip counts ──

  function updateFilterChipCounts() {
    var all = getAllJobs();
    var counts = {};
    counts[WORKPLACE_ONSITE] = 0;
    counts[WORKPLACE_HYBRID] = 0;
    counts[WORKPLACE_REMOTE] = 0;
    all.forEach(function (j) {
      if (counts[j.workplaceType] !== undefined) counts[j.workplaceType]++;
    });
    var chipMap = { onSite: WORKPLACE_ONSITE, hybrid: WORKPLACE_HYBRID, remote: WORKPLACE_REMOTE };
    var keys = Object.keys(chipMap);
    for (var i = 0; i < keys.length; i++) {
      var chips = document.querySelectorAll('[data-filter-key="' + keys[i] + '"]');
      for (var c = 0; c < chips.length; c++) {
        var chip = chips[c];
        var countSpan = chip.querySelector(".ljm-chip-count");
        if (!countSpan) {
          countSpan = document.createElement("span");
          countSpan.className = "ljm-chip-count";
          chip.appendChild(countSpan);
        }
        countSpan.textContent = "(" + counts[chipMap[keys[i]]] + ")";
      }
    }
  }

  // ── Central display function (respects filters/sort) ──

  function displayFilteredResults() {
    var filtered = getFilteredJobs();
    var total = getAllJobs().length;

    setCount(total);
    updateMarkers(filtered);
    updateFilterChipCounts();

    if (isFullscreen) renderJobCards(filtered);

    var pr = filtered.filter(function (j) { return j.hasPreciseAddress; }).length;
    var onN = filtered.filter(function (j) { return j.workplaceType === WORKPLACE_ONSITE; }).length;
    var hyN = filtered.filter(function (j) { return j.workplaceType === WORKPLACE_HYBRID; }).length;
    var reN = filtered.filter(function (j) { return j.workplaceType === WORKPLACE_REMOTE; }).length;
    setStatus(t("mappedSummary", {
      total: filtered.length, precise: pr,
      onSite: t("onSite"), onSiteN: onN,
      hybrid: t("hybrid"), hybridN: hyN,
      remote: t("remote"), remoteN: reN
    }));
  }

  // ── CSV Export ──

  function exportJobsCSV() {
    var jobs = getFilteredJobs();
    if (jobs.length === 0) return;

    function csvEscape(val) {
      var s = String(val || "");
      if (s.indexOf(",") >= 0 || s.indexOf('"') >= 0 || s.indexOf("\n") >= 0) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }

    var rows = ["Title,Company,Location,Type,Commute (min),URL"];
    jobs.forEach(function (job) {
      var ci = getCommuteDisplay(job);
      var mins = ci.mins != null ? ci.mins : "";
      rows.push([
        csvEscape(job.title),
        csvEscape(job.company),
        csvEscape(job.location),
        csvEscape(getWorkplaceLabel(job.workplaceType)),
        mins,
        "https://www.linkedin.com/jobs/view/" + job.jobId
      ].join(","));
    });

    var BOM = "\uFEFF";
    var blob = new Blob([BOM + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "linkedin-jobs-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Fullscreen ──

  function toggleFullscreen() {
    isFullscreen = !isFullscreen;
    if (isFullscreen) {
      panelEl.classList.add("ljm-fullscreen");
      document.body.classList.add("ljm-fs-active");
      renderJobCards(getFilteredJobs());
    } else {
      panelEl.classList.remove("ljm-fullscreen");
      document.body.classList.remove("ljm-fs-active");
    }
    var fsBtn = document.getElementById("ljm-fs-btn");
    if (fsBtn) {
      fsBtn.textContent = isFullscreen ? "\u2716" : "\u26F6";
      fsBtn.setAttribute("data-tooltip", isFullscreen ? t("exitFullscreen") : t("fullscreen"));
    }
    setTimeout(function () { if (map) map.invalidateSize(); }, 250);
  }

  // ── Job Cards Panel (Fullscreen) ──

  function createFilterBar() {
    var bar = document.createElement("div");
    bar.className = "ljm-filter-bar";

    // Search input
    var searchWrap = document.createElement("div");
    searchWrap.className = "ljm-search-wrap";
    var searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.className = "ljm-search-input";
    searchInput.placeholder = t("searchPlaceholder");
    searchInput.setAttribute("autocomplete", "off");
    var debouncedSearch = debounce(function () {
      searchQuery = searchInput.value.trim();
      displayFilteredResults();
    }, 300);
    searchInput.addEventListener("input", debouncedSearch);
    searchWrap.appendChild(searchInput);
    bar.appendChild(searchWrap);

    // Workplace type toggles
    var types = [
      { key: "onSite", wt: WORKPLACE_ONSITE, dotClass: "ljm-dot-onsite" },
      { key: "hybrid", wt: WORKPLACE_HYBRID, dotClass: "ljm-dot-hybrid" },
      { key: "remote", wt: WORKPLACE_REMOTE, dotClass: "ljm-dot-remote" }
    ];

    var filterGroup = document.createElement("div");
    filterGroup.className = "ljm-filter-group";

    types.forEach(function (item) {
      var btn = document.createElement("button");
      btn.className = "ljm-filter-chip" + (filterState[item.key] ? " ljm-filter-active" : "");
      btn.setAttribute("data-filter-key", item.key);
      var dot = document.createElement("span");
      dot.className = "ljm-filter-dot " + item.dotClass;
      btn.appendChild(dot);
      btn.appendChild(document.createTextNode(t(item.key)));
      btn.addEventListener("click", function () {
        filterState[item.key] = !filterState[item.key];
        btn.classList.toggle("ljm-filter-active", filterState[item.key]);
        displayFilteredResults();
      });
      filterGroup.appendChild(btn);
    });
    bar.appendChild(filterGroup);

    // Sort select
    var sortWrap = document.createElement("div");
    sortWrap.className = "ljm-sort-wrap";
    var sortLabel = document.createElement("span");
    sortLabel.className = "ljm-sort-label";
    sortLabel.textContent = t("sortBy") + ":";
    sortWrap.appendChild(sortLabel);

    var sortSelect = document.createElement("select");
    sortSelect.className = "ljm-sort-select";
    var opts = [
      { val: "distance", text: t("sortDistance") },
      { val: "company", text: t("sortCompany") },
      { val: "type", text: t("sortType") },
      { val: "date", text: t("sortDate") }
    ];
    opts.forEach(function (o) {
      var opt = document.createElement("option");
      opt.value = o.val;
      opt.textContent = o.text;
      sortSelect.appendChild(opt);
    });
    sortSelect.value = sortState;
    sortSelect.addEventListener("change", function () {
      sortState = sortSelect.value;
      displayFilteredResults();
    });
    sortWrap.appendChild(sortSelect);
    bar.appendChild(sortWrap);

    return bar;
  }

  function createCardsPanel() {
    var panel = document.createElement("div");
    panel.id = "ljm-cards-panel";

    // Header
    var header = document.createElement("div");
    header.className = "ljm-cards-header";
    var titleRow = document.createElement("div");
    titleRow.className = "ljm-cards-title-row";
    var title = document.createElement("div");
    title.className = "ljm-cards-title";
    title.textContent = t("mappedJobs");
    cardsBadgeEl = document.createElement("span");
    cardsBadgeEl.className = "ljm-cards-badge";
    cardsBadgeEl.textContent = "0";
    title.appendChild(cardsBadgeEl);
    titleRow.appendChild(title);

    var exportBtn = document.createElement("button");
    exportBtn.className = "ljm-export-btn";
    exportBtn.textContent = "\u2B07";
    exportBtn.setAttribute("data-tooltip", t("exportCSV"));
    exportBtn.addEventListener("click", exportJobsCSV);
    titleRow.appendChild(exportBtn);
    header.appendChild(titleRow);
    panel.appendChild(header);

    // Filter bar
    panel.appendChild(createFilterBar());

    // Cards list
    cardsListEl = document.createElement("div");
    cardsListEl.className = "ljm-cards-list";
    panel.appendChild(cardsListEl);

    // Footer
    var footer = document.createElement("div");
    footer.className = "ljm-cards-footer";
    cardsFooterTimeEl = document.createElement("span");
    cardsFooterTimeEl.textContent = t("ready");
    footer.appendChild(cardsFooterTimeEl);
    var liveEl = document.createElement("span");
    liveEl.style.cssText = "display:flex;align-items:center;gap:2px;";
    var liveDot = document.createElement("span");
    liveDot.className = "ljm-live-dot";
    liveEl.appendChild(liveDot);
    liveEl.appendChild(document.createTextNode(t("live")));
    footer.appendChild(liveEl);
    panel.appendChild(footer);

    return panel;
  }

  function renderJobCards(jobs) {
    if (!cardsListEl) return;
    if (!jobs) jobs = getFilteredJobs();

    while (cardsListEl.firstChild) {
      cardsListEl.removeChild(cardsListEl.firstChild);
    }

    if (cardsBadgeEl) cardsBadgeEl.textContent = String(jobs.length);
    if (cardsFooterTimeEl) cardsFooterTimeEl.textContent = t("updatedJustNow");

    if (jobs.length === 0) {
      var emptyMsg = document.createElement("div");
      emptyMsg.className = "ljm-cards-empty";
      emptyMsg.textContent = t("noJobsMatch");
      cardsListEl.appendChild(emptyMsg);
      return;
    }

    var fragment = document.createDocumentFragment();
    jobs.forEach(function (job, idx) {
      var card = document.createElement("div");
      card.className = "ljm-job-card" + (idx === 0 ? " ljm-card-active" : "");
      card.setAttribute("data-ljm-job", job.jobId);

      // Header row
      var hdr = document.createElement("div");
      hdr.className = "ljm-job-card-header";
      var logo = document.createElement("div");
      logo.className = "ljm-job-logo";
      if (job.logoUrl) {
        var logoImg = document.createElement("img");
        logoImg.className = "ljm-job-logo-img";
        logoImg.src = job.logoUrl;
        logoImg.alt = "";
        logoImg.addEventListener("error", function () {
          logo.removeChild(logoImg);
          logo.textContent = (job.company || "?").charAt(0).toUpperCase();
        });
        logo.appendChild(logoImg);
      } else {
        logo.textContent = (job.company || "?").charAt(0).toUpperCase();
      }
      hdr.appendChild(logo);

      var info = document.createElement("div");
      info.className = "ljm-job-info";
      var titleEl = document.createElement("div");
      titleEl.className = "ljm-job-title";
      titleEl.textContent = job.title;
      info.appendChild(titleEl);
      var compEl = document.createElement("div");
      compEl.className = "ljm-job-company";
      compEl.textContent = job.company;
      info.appendChild(compEl);
      hdr.appendChild(info);
      card.appendChild(hdr);

      // Tags
      var tags = document.createElement("div");
      tags.className = "ljm-job-tags";
      var wtTag = document.createElement("span");
      wtTag.className = "ljm-job-tag " + getTagClass(job.workplaceType);
      wtTag.textContent = getWorkplaceLabel(job.workplaceType);
      tags.appendChild(wtTag);

      // Location tag
      if (job.location) {
        var locTag = document.createElement("span");
        locTag.className = "ljm-job-tag ljm-tag-location";
        locTag.textContent = job.location.split(",")[0].trim();
        tags.appendChild(locTag);
      }

      // Time tag
      if (job.listedAt) {
        var timeTag = document.createElement("span");
        timeTag.className = "ljm-job-tag ljm-tag-time";
        timeTag.textContent = timeAgo(job.listedAt);
        tags.appendChild(timeTag);
      }
      card.appendChild(tags);

      // Divider row: commute + view button
      var divider = document.createElement("div");
      divider.className = "ljm-job-divider";

      var commuteCol = document.createElement("div");
      var commuteLabel = document.createElement("div");
      commuteLabel.className = "ljm-job-commute-label";
      commuteLabel.textContent = t("commute");
      commuteCol.appendChild(commuteLabel);

      var commuteVal = document.createElement("div");
      commuteVal.className = "ljm-job-commute-value";
      var ci = getCommuteDisplay(job);
      commuteVal.className += " " + ci.cls;
      commuteVal.textContent = ci.text;
      commuteCol.appendChild(commuteVal);
      divider.appendChild(commuteCol);

      var viewBtn = document.createElement("button");
      viewBtn.className = "ljm-job-apply";
      viewBtn.textContent = t("viewJob");
      viewBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        window.open("https://www.linkedin.com/jobs/view/" + job.jobId, "_blank");
      });
      divider.appendChild(viewBtn);
      card.appendChild(divider);

      card.addEventListener("click", function () {
        var prev = cardsListEl.querySelector(".ljm-card-active");
        if (prev) prev.classList.remove("ljm-card-active");
        card.classList.add("ljm-card-active");
        isSyncing = true;
        focusJobOnMap(job.jobId);
        setTimeout(function () { isSyncing = false; }, 1000);
      });

      fragment.appendChild(card);
    });
    cardsListEl.appendChild(fragment);
  }

  // ── UI ──

  function createUI() {
    // Toggle button
    toggleBtnEl = document.createElement("button");
    toggleBtnEl.id = "ljm-toggle-btn";
    toggleBtnEl.textContent = "\uD83D\uDDFA";
    toggleBtnEl.setAttribute("data-tooltip", t("openJobMap"));
    toggleBtnEl.classList.add("ljm-tip-left");
    document.body.appendChild(toggleBtnEl);

    // Panel
    panelEl = document.createElement("div");
    panelEl.id = "ljm-panel";
    panelEl.classList.add("ljm-hidden");

    // ── Header ──
    var header = document.createElement("div");
    header.id = "ljm-header";

    var headerLeft = document.createElement("div");
    headerLeft.className = "ljm-header-left";

    var titleEl = document.createElement("span");
    titleEl.className = "ljm-header-title";
    titleEl.textContent = t("linkedInJobMap");
    var badge = document.createElement("span");
    badge.className = "ljm-badge";
    badge.id = "ljm-count";
    badge.textContent = "0";
    titleEl.appendChild(badge);
    headerLeft.appendChild(titleEl);

    var divider = document.createElement("span");
    divider.className = "ljm-divider";
    headerLeft.appendChild(divider);

    // Inline legend
    var legend = document.createElement("div");
    legend.className = "ljm-legend-inline";
    var legendItems = [
      { dotClass: "ljm-dot-onsite", key: "onSite" },
      { dotClass: "ljm-dot-hybrid", key: "hybrid" },
      { dotClass: "ljm-dot-remote", key: "remote" }
    ];
    legendItems.forEach(function (item) {
      var el = document.createElement("span");
      el.className = "ljm-legend-item";
      var dot = document.createElement("span");
      dot.className = "ljm-legend-dot " + item.dotClass;
      el.appendChild(dot);
      el.appendChild(document.createTextNode(t(item.key)));
      legend.appendChild(el);
    });
    headerLeft.appendChild(legend);
    header.appendChild(headerLeft);

    // Header actions
    var actions = document.createElement("div");
    actions.className = "ljm-header-actions";

    var refreshBtn = document.createElement("button");
    refreshBtn.className = "ljm-header-btn";
    refreshBtn.textContent = "\u21BB";
    refreshBtn.setAttribute("data-tooltip", t("rescanJobs"));
    refreshBtn.addEventListener("click", function () {
      shouldFitBoundsNext = true;
      scanCurrentPage();
    });
    actions.appendChild(refreshBtn);

    var clearJobsBtn = document.createElement("button");
    clearJobsBtn.className = "ljm-header-btn";
    clearJobsBtn.textContent = "\u2298";
    clearJobsBtn.setAttribute("data-tooltip", t("clearJobs"));
    clearJobsBtn.addEventListener("click", function () {
      allJobsById = {};
      companyNames = {};
      pagesScanned = 0;
      saveAccumulatedState();
      if (map && markersLayer) {
        markersLayer.clearLayers();
        clearRoute();
        markerRefs = {};
        currentGeoJobs = [];
      }
      shouldFitBoundsNext = true;
      setCount(0);
      if (isFullscreen) renderJobCards([]);
      setStatus(t("allJobsCleared"));
      scanCurrentPage();
    });
    actions.appendChild(clearJobsBtn);

    var clearCacheBtn = document.createElement("button");
    clearCacheBtn.className = "ljm-header-btn";
    clearCacheBtn.textContent = "\uD83D\uDDD1";
    clearCacheBtn.setAttribute("data-tooltip", t("clearAllCache"));
    clearCacheBtn.addEventListener("click", function () {
      try { localStorage.removeItem(GEOCODE_CACHE_KEY); } catch (e) {}
      allJobsById = {};
      companyNames = {};
      companyCache = {};
      pagesScanned = 0;
      saveAccumulatedState();
      if (map && markersLayer) {
        markersLayer.clearLayers();
        clearRoute();
        markerRefs = {};
        currentGeoJobs = [];
      }
      shouldFitBoundsNext = true;
      setCount(0);
      if (isFullscreen) renderJobCards([]);
      setStatus(t("allCacheCleared"));
      scanCurrentPage();
    });
    actions.appendChild(clearCacheBtn);

    var fsBtn = document.createElement("button");
    fsBtn.id = "ljm-fs-btn";
    fsBtn.className = "ljm-header-btn";
    fsBtn.textContent = "\u26F6";
    fsBtn.setAttribute("data-tooltip", t("fullscreen"));
    fsBtn.addEventListener("click", toggleFullscreen);
    actions.appendChild(fsBtn);

    var closeBtn = document.createElement("button");
    closeBtn.className = "ljm-header-btn";
    closeBtn.textContent = "\u2715";
    closeBtn.setAttribute("data-tooltip", t("closePanel"));
    closeBtn.addEventListener("click", function () {
      if (isFullscreen) toggleFullscreen();
      panelEl.classList.add("ljm-hidden");
    });
    actions.appendChild(closeBtn);

    header.appendChild(actions);
    panelEl.appendChild(header);

    // ── Body (map + cards panel) ──
    var body = document.createElement("div");
    body.id = "ljm-body";

    var mapWrap = document.createElement("div");
    mapWrap.id = "ljm-map-wrap";
    var mapContainer = document.createElement("div");
    mapContainer.id = "ljm-map-container";
    mapWrap.appendChild(mapContainer);

    // Custom map controls
    var controls = document.createElement("div");
    controls.className = "ljm-map-controls";

    var zoomGroup = document.createElement("div");
    zoomGroup.className = "ljm-ctrl-group";
    var zoomIn = document.createElement("button");
    zoomIn.className = "ljm-ctrl-btn";
    zoomIn.textContent = "+";
    zoomIn.setAttribute("data-tooltip", t("zoomIn"));
    zoomIn.classList.add("ljm-tip-bottom");
    zoomIn.addEventListener("click", function () { if (map) map.zoomIn(); });
    zoomGroup.appendChild(zoomIn);
    var zoomOut = document.createElement("button");
    zoomOut.className = "ljm-ctrl-btn";
    zoomOut.textContent = "\u2212";
    zoomOut.setAttribute("data-tooltip", t("zoomOut"));
    zoomOut.classList.add("ljm-tip-bottom");
    zoomOut.addEventListener("click", function () { if (map) map.zoomOut(); });
    zoomGroup.appendChild(zoomOut);
    controls.appendChild(zoomGroup);

    var gpsBtn = document.createElement("button");
    gpsBtn.className = "ljm-ctrl-single";
    gpsBtn.textContent = "\u25CE";
    gpsBtn.setAttribute("data-tooltip", t("myLocationGPS"));
    gpsBtn.classList.add("ljm-tip-bottom");
    gpsBtn.addEventListener("click", useGPS);
    controls.appendChild(gpsBtn);

    mapWrap.appendChild(controls);
    body.appendChild(mapWrap);
    body.appendChild(createCardsPanel());
    panelEl.appendChild(body);

    // Status bar
    var status = document.createElement("div");
    status.id = "ljm-status";
    status.textContent = t("loadingBackground");
    panelEl.appendChild(status);

    document.body.appendChild(panelEl);

    // Clear location from popup
    panelEl.addEventListener("click", function (e) {
      if (e.target && e.target.classList.contains("ljm-clear-loc")) {
        e.preventDefault();
        clearMyLocation();
        map.closePopup();
      }
    });

    // Toggle panel + lazy init map
    var mapInited = false;
    toggleBtnEl.addEventListener("click", function () {
      panelEl.classList.toggle("ljm-hidden");
      if (!panelEl.classList.contains("ljm-hidden") && !mapInited) {
        mapInited = true;
        mapInitialized = true;
        initMap(mapContainer);
        setTimeout(function () { map.invalidateSize(); }, 200);
        var jobs = getAllJobs();
        if (jobs.length > 0) {
          displayFilteredResults();
        } else {
          setStatus(t("loadingJobData"), true);
        }
      } else if (map) {
        setTimeout(function () { map.invalidateSize(); }, 200);
      }
    });
  }

  function setStatus(text, showSpinner) {
    var el = document.getElementById("ljm-status");
    if (!el) return;
    el.textContent = "";
    if (showSpinner) {
      var spinner = document.createElement("div");
      spinner.className = "ljm-spinner";
      el.appendChild(spinner);
      el.appendChild(document.createTextNode(" " + text));
    } else {
      el.textContent = text;
    }
  }

  function setCount(n) {
    var el = document.getElementById("ljm-count");
    if (el) el.textContent = String(n);
  }

  // ── Main Logic ──

  function loadPageJobs(csrf) {
    captureCompanyNamesFromDOM();
    var jobIds = extractJobIds();
    var newIds = jobIds.filter(function (id) { return !allJobsById[id]; });
    if (newIds.length === 0) {
      setStatus(t("noNewJobs", { total: Object.keys(allJobsById).length }));
      return Promise.resolve([]);
    }

    setStatus(t("newJobsFetching", { count: newIds.length }), true);

    return processInParallel(newIds, function (jid) {
      return fetchJobWithCompany(jid, csrf);
    }, CONCURRENCY_LI, function (done, total) {
      setStatus(t("jobsProgress", { done: done, total: total }), true);
    }).then(function (results) {
      var jobs = results.filter(Boolean);
      setStatus(t("gettingAddresses", { count: jobs.length }), true);
      return enrichWithCompanyAddress(jobs, csrf, function (d, tot) {
        setStatus(t("companiesProgress", { done: d, total: tot }), true);
      });
    }).then(function (jobs) {
      var precise = jobs.filter(function (j) { return j.hasPreciseAddress; }).length;
      setStatus(t("preciseGeocoding", { precise: precise, total: jobs.length }), true);
      return geocodeJobs(jobs, function (d, tot) {
        setStatus(t("geocodingProgress", { done: d, total: tot }), true);
      });
    });
  }

  function mergeAndDisplay(newGeoJobs) {
    newGeoJobs.forEach(function (j) {
      allJobsById[j.jobId] = j;
    });
    saveAccumulatedState();

    if (map && markersLayer) {
      displayFilteredResults();
    } else {
      var all = getAllJobs();
      setCount(all.length);
      updateFilterChipCounts();
      var pr = all.filter(function (j) { return j.hasPreciseAddress; }).length;
      setStatus(t("jobsCollected", { total: all.length, precise: pr }));
    }

    if (isFullscreen) renderJobCards();
  }

  function scanCurrentPage() {
    if (isLoading) return;
    isLoading = true;
    var csrf = getCsrfToken();
    if (!csrf) {
      isLoading = false;
      setStatus(t("csrfNotFound"));
      return;
    }

    loadPageJobs(csrf).then(function (newGeoJobs) {
      isLoading = false;
      if (newGeoJobs.length > 0) {
        pagesScanned++;
        mergeAndDisplay(newGeoJobs);
      }
    }).catch(function (err) {
      isLoading = false;
      console.warn("LJM scan error:", err);
    });
  }

  // ── URL change detection ──

  function startUrlWatcher() {
    setInterval(function () {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        setTimeout(function () {
          setStatus(t("pageChanged"), true);
          reattachJobListObserver();
          scanCurrentPage();
        }, 1500);
      }
    }, 800);
  }

  // ── MutationObserver for scroll-loaded jobs ──

  function reattachJobListObserver() {
    if (jobListObserver) { jobListObserver.disconnect(); jobListObserver = null; }
    var jobList = document.querySelector(".jobs-search-results-list, .scaffold-layout__list");
    if (!jobList) return;
    jobListObserver = new MutationObserver(debounce(function () {
      if (!isLoading) {
        setStatus(t("newJobsDetected"), true);
        scanCurrentPage();
      }
    }, 3000));
    jobListObserver.observe(jobList, { childList: true, subtree: true });
  }

  // ── Init ──

  function init() {
    detectLocale();

    // Migrate old cache
    try {
      if (localStorage.getItem("ljm_geocode_cache")) {
        localStorage.removeItem("ljm_geocode_cache");
        sessionStorage.removeItem(ALL_JOBS_KEY);
        sessionStorage.removeItem(COMPANY_NAMES_KEY);
      }
    } catch (e) {}

    loadAccumulatedState();

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get("mapboxToken", function (data) {
        if (data && data.mapboxToken) MAPBOX_TOKEN = data.mapboxToken;
        boot();
      });
    } else {
      boot();
    }
  }

  // ── Keyboard shortcuts ──

  function setupKeyboardShortcuts() {
    document.addEventListener("keydown", function (e) {
      var tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable) return;

      if (e.key === "Escape") {
        if (isFullscreen) {
          toggleFullscreen();
        } else if (panelEl && !panelEl.classList.contains("ljm-hidden")) {
          panelEl.classList.add("ljm-hidden");
        }
        return;
      }

      if (!isFullscreen || !cardsListEl) return;

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        var cards = cardsListEl.querySelectorAll(".ljm-job-card");
        if (cards.length === 0) return;
        var active = cardsListEl.querySelector(".ljm-card-active");
        var idx = -1;
        for (var i = 0; i < cards.length; i++) {
          if (cards[i] === active) { idx = i; break; }
        }
        if (e.key === "ArrowDown") {
          idx = idx < cards.length - 1 ? idx + 1 : 0;
        } else {
          idx = idx > 0 ? idx - 1 : cards.length - 1;
        }
        if (active) active.classList.remove("ljm-card-active");
        cards[idx].classList.add("ljm-card-active");
        cards[idx].scrollIntoView({ behavior: "smooth", block: "nearest" });
        var jobId = cards[idx].getAttribute("data-ljm-job");
        if (jobId) {
          isSyncing = true;
          focusJobOnMap(jobId);
          setTimeout(function () { isSyncing = false; }, 1000);
        }
        return;
      }

      if (e.key === "Enter") {
        var activeCard = cardsListEl.querySelector(".ljm-card-active");
        if (activeCard) {
          var jid = activeCard.getAttribute("data-ljm-job");
          if (jid) window.open("https://www.linkedin.com/jobs/view/" + jid, "_blank");
        }
        return;
      }
    });
  }

  function boot() {
    createUI();
    setupJobCardClickListener();
    setupKeyboardShortcuts();
    var existingCount = Object.keys(allJobsById).length;
    if (existingCount > 0) setCount(existingCount);
    scanCurrentPage();
    startUrlWatcher();
    reattachJobListObserver();
  }

  // ── Test exports (only in test environment) ──
  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
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
})();
