(function () {
  var THROTTLE_MS = 5000;
  var lastSend = 0;
  var statusEl = document.getElementById("status");
  var currentZoneId = null;
  var lastParty = null;

  function getToken() {
    var params = new URLSearchParams(window.location.search);
    return params.get("token") || (window.HYDAELYN_OVERLAY_TOKEN || "").trim();
  }

  function getIngestUrl() {
    var base = window.HYDAELYN_INGEST_URL || window.location.origin;
    return base.replace(/\/$/, "") + "/api/ingest/combat";
  }

  function setStatus(cls, text) {
    if (statusEl) {
      statusEl.className = "status " + cls;
      statusEl.textContent = text;
    }
  }

  function sendToHydaelyn(payload, outcome) {
    var token = getToken();
    if (!token) {
      setStatus("error", "Missing token — add ?token=… to URL");
      return;
    }

    var url = getIngestUrl();
    var body = {
      overlay_token: token,
      encounter: payload.Encounter || {},
      combatants: payload.Combatant || {},
      zone_id: payload.zoneID != null ? String(payload.zoneID) : undefined,
    };
    if (outcome) body.outcome = outcome;

    setStatus("sending", "Sending…");
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(function (res) {
        if (res.ok) {
          setStatus("ok", "Sent to Hydaelyn");
        } else {
          setStatus("error", "Ingest failed: " + res.status);
        }
      })
      .catch(function () {
        setStatus("error", "Network error");
      });
  }

  addOverlayListener("CombatData", function (data) {
    if (!data) return;
    var now = Date.now();
    if (now - lastSend < THROTTLE_MS) return;
    lastSend = now;
    sendToHydaelyn(data);
  });

  addOverlayListener("ChangeZone", function (e) {
    if (e && e.zoneID != null) currentZoneId = e.zoneID;
  });

  addOverlayListener("PartyChanged", function (e) {
    if (e && e.party != null) lastParty = e.party;
  });

  var logLineThrottle = 0;
  var LOG_LINE_THROTTLE_MS = 3000;
  addOverlayListener("LogLine", function (e) {
    if (!e || !e.line) return;
    var now = Date.now();
    if (now - logLineThrottle < LOG_LINE_THROTTLE_MS) return;
    var line = e.line;
    var type = (line.split("|")[0] || "").trim();
    if (type !== "00" && type !== "01" && type !== "02" && type !== "03") return;
    logLineThrottle = now;
    var token = getToken();
    if (!token) return;
    var url = (window.HYDAELYN_INGEST_URL || window.location.origin).replace(/\/$/, "") + "/api/ingest/log-line";
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ overlay_token: token, line_type: type, line: line }),
    }).catch(function () {});
  });

  startOverlayEvents();

  if (!getToken()) {
    setStatus("error", "Missing token — add ?token=… to URL");
  } else {
    setStatus("ok", "Listening for combat data…");
  }
})();
