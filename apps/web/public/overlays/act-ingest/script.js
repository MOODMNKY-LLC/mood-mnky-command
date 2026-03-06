(function () {
  var CONFIG_KEY = "hydaelyn_ingest_config"
  var THROTTLE_MS = 5000
  var lastSend = 0

  function getConfigFromUrl() {
    var params = new URLSearchParams(window.location.search)
    var base = params.get("api_base") || params.get("api_base_url")
    var token = params.get("overlay_token") || params.get("token")
    if (base && token) return { apiBase: base.replace(/\/$/, ""), overlayToken: token }
    return null
  }

  function loadConfig(cb) {
    var fromUrl = getConfigFromUrl()
    if (fromUrl) return cb(fromUrl)
    try {
      var stored = localStorage.getItem(CONFIG_KEY)
      if (stored) {
        var parsed = JSON.parse(stored)
        if (parsed.apiBase && parsed.overlayToken) return cb(parsed)
      }
    } catch (e) {}
    if (typeof callOverlayHandler === "function") {
      callOverlayHandler({ call: "loadData", key: CONFIG_KEY }, function (data) {
        if (data && data.apiBase && data.overlayToken) return cb(data)
        cb(null)
      })
    } else {
      cb(null)
    }
  }

  function saveConfig(apiBase, overlayToken, cb) {
    var c = { apiBase: apiBase.replace(/\/$/, ""), overlayToken: overlayToken }
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(c))
    } catch (e) {}
    if (typeof callOverlayHandler === "function") {
      callOverlayHandler({ call: "saveData", key: CONFIG_KEY, value: c }, function () {
        if (cb) cb()
      })
    } else if (cb) {
      cb()
    }
  }

  function setStatus(text, ok) {
    var el = document.getElementById("status")
    if (el) {
      el.textContent = text
      el.className = "status " + (ok === true ? "ok" : ok === false ? "err" : "")
    }
  }

  function showConfigPanel() {
    var panel = document.getElementById("config-panel")
    if (panel) panel.style.display = "block"
    setStatus("Enter API base URL and overlay token above.")
  }

  function startIngest(apiBase, overlayToken) {
    var ingestUrl = apiBase + "/api/raid/ingest/combat"

    addOverlayListener("CombatData", function (data) {
      var now = Date.now()
      if (now - lastSend < THROTTLE_MS) return
      lastSend = now

      var body = {
        overlay_token: overlayToken,
        encounter: data.Encounter || null,
        combatants: data.Combatant || null,
      }

      fetch(ingestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then(function (res) {
          if (res.ok) setStatus("Sending combat data…", true)
          else setStatus("Ingest " + res.status, false)
        })
        .catch(function () {
          setStatus("Network error", false)
        })
    })

    startOverlayEvents()
    setStatus("Listening for combat data.", true)
  }

  document.addEventListener("DOMContentLoaded", function () {
    loadConfig(function (config) {
      if (config) {
        document.getElementById("config-panel").style.display = "none"
        startIngest(config.apiBase, config.overlayToken)
      } else {
        showConfigPanel()
      }
    })
  })

  var saveBtn = document.getElementById("save-config")
  if (saveBtn) {
    saveBtn.addEventListener("click", function () {
      var base = (document.getElementById("api-base") || {}).value
      var token = (document.getElementById("overlay-token") || {}).value
      if (!base || !token) {
        setStatus("Enter both API base URL and overlay token.", false)
        return
      }
      saveConfig(base, token, function () {
        document.getElementById("config-panel").style.display = "none"
        startIngest(base, token)
      })
    })
  }
})()
