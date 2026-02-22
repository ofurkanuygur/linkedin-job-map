(function () {
  "use strict";

  var tokenInput = document.getElementById("mapbox-token");
  var saveBtn = document.getElementById("save-btn");
  var testBtn = document.getElementById("test-btn");
  var resetBtn = document.getElementById("reset-btn");
  var clearCacheBtn = document.getElementById("clear-cache-btn");
  var msgEl = document.getElementById("msg");

  function showMsg(text, type) {
    msgEl.textContent = text;
    msgEl.className = "message " + type;
    setTimeout(function () { msgEl.className = "message"; msgEl.textContent = ""; }, 4000);
  }

  // Load saved token
  chrome.storage.sync.get("mapboxToken", function (data) {
    if (data && data.mapboxToken) {
      tokenInput.value = data.mapboxToken;
    }
  });

  // Save
  saveBtn.addEventListener("click", function () {
    var token = tokenInput.value.trim();
    if (!token) {
      showMsg("Token is required. Get one from mapbox.com.", "error");
      return;
    }
    chrome.storage.sync.set({ mapboxToken: token }, function () {
      showMsg("Token saved. Reload LinkedIn to apply.", "success");
    });
  });

  // Test
  testBtn.addEventListener("click", function () {
    var token = tokenInput.value.trim();
    if (!token) {
      showMsg("Enter a token first.", "error");
      return;
    }
    var url = "https://api.mapbox.com/geocoding/v5/mapbox.places/London.json?access_token=" + token + "&limit=1";
    fetch(url)
      .then(function (res) {
        if (res.ok) return res.json();
        throw new Error("HTTP " + res.status);
      })
      .then(function (data) {
        if (data && data.features && data.features.length > 0) {
          showMsg("Token is valid! Geocoding works.", "success");
        } else {
          showMsg("Token returned no results. It may be invalid.", "error");
        }
      })
      .catch(function (err) {
        showMsg("Token test failed: " + err.message, "error");
      });
  });

  // Clear
  resetBtn.addEventListener("click", function () {
    chrome.storage.sync.remove("mapboxToken", function () {
      tokenInput.value = "";
      showMsg("Token cleared. Extension requires a token to work.", "success");
    });
  });

  // Clear geocode cache
  clearCacheBtn.addEventListener("click", function () {
    // We can't access LinkedIn's localStorage from here,
    // so we inform the user to clear it from the LinkedIn page.
    showMsg("Geocode cache is stored on LinkedIn's domain. Open LinkedIn, press F12, go to Console, and run: localStorage.removeItem('ljm_geocode_cache')", "success");
  });
})();
