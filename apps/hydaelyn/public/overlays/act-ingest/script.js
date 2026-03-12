(function () {
  var THROTTLE_MS = 5000;
  var lastSend = 0;
  var statusEl = document.getElementById("status");
  var subEl = document.getElementById("sub");
  var tokenHintEl = document.getElementById("token-hint");

  if (typeof addOverlayListener === "undefined" || typeof startOverlayEvents === "undefined") {
    if (statusEl) {
      statusEl.className = "main error";
      statusEl.textContent = "OverlayPlugin script failed to load";
    }
    if (subEl) subEl.textContent = "Check network, or use OverlayPlugin (ngld) and add ?OVERLAY_WS=ws://127.0.0.1:10501/ws in browser.";
    return;
  }

  function getToken() {
    var params = new URLSearchParams(window.location.search);
    return params.get("token") || (window.HYDAELYN_OVERLAY_TOKEN || "").trim();
  }

  function getIngestUrl() {
    var base = window.HYDAELYN_INGEST_URL || window.location.origin;
    return base.replace(/\/$/, "") + "/api/ingest/combat";
  }

  function setMain(cls, text) {
    if (statusEl) {
      statusEl.className = "main " + (cls || "");
      statusEl.textContent = text;
    }
  }

  function setSub(text) {
    if (subEl) subEl.textContent = text || "N/A";
  }

  function sendToHydaelyn(payload, outcome) {
    var token = getToken();
    if (!token) {
      setMain("error", "Missing token");
      setSub("Add ?token=… to the URL");
      return;
    }

    var body = {
      overlay_token: token,
      encounter: payload.Encounter || {},
      combatants: payload.Combatant || {},
      zone_id: payload.zoneID != null ? String(payload.zoneID) : undefined,
    };
    if (outcome) body.outcome = outcome;

    setMain("sending", "Sending…");
    setSub("Posting to Hydaelyn");
    fetch(getIngestUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(function (res) {
        if (res.ok) {
          setMain("ok", "Sent to Hydaelyn");
          setSub("Last sent: just now");
        } else {
          setMain("error", "Ingest failed: " + res.status);
          setSub(res.status === 401 ? "Invalid token?" : "Check dashboard token");
        }
      })
      .catch(function () {
        setMain("error", "Network error");
        setSub("Check URL and CORS");
      });
  }

  addOverlayListener("CombatData", function (data) {
    if (!data) return;
    var now = Date.now();
    if (now - lastSend < THROTTLE_MS) return;
    lastSend = now;
    sendToHydaelyn(data);
  });

  startOverlayEvents();

  var token = getToken();
  if (!token) {
    setMain("error", "Missing token");
    setSub("Add ?token=… to the URL");
    if (tokenHintEl) tokenHintEl.style.display = "block";
  } else {
    setMain("awaiting", "Awaiting encounter data…");
    setSub("N/A");
    if (tokenHintEl) tokenHintEl.style.display = "none";
  }
})();
