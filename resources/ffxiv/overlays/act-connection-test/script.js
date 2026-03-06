(function () {
  var statusEl = document.getElementById("status");
  var dataEl = document.getElementById("data");
  var hintEl = document.getElementById("hint");

  function setStatus(cls, text) {
    statusEl.className = "status " + cls;
    statusEl.textContent = text;
  }

  function setData(text) {
    dataEl.textContent = text;
  }

  function formatNum(val) {
    if (val === undefined || val === null || val === "") return "—";
    var n = Number(val);
    if (isNaN(n)) return String(val);
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
    return n.toFixed(0);
  }

  addOverlayListener("CombatData", function (data) {
    setStatus("connected", "Connected — receiving combat data");
    if (!data || !data.Encounter) {
      setData("Encounter data empty.");
      return;
    }
    var enc = data.Encounter;
    var lines = [
      "Encounter: " + (enc.title || "—"),
      "Duration: " + (enc.duration != null ? enc.duration : "—"),
      "Enc DPS: " + (enc.ENCDPS != null ? formatNum(enc.ENCDPS) : "—")
    ];
    if (data.Combatant && typeof data.Combatant === "object") {
      var names = Object.keys(data.Combatant);
      if (names.length > 0) {
        lines.push("");
        lines.push("Combatants: " + names.length);
        names.slice(0, 5).forEach(function (name) {
          var c = data.Combatant[name];
          lines.push("  " + (c.name || name) + " | " + (c.Job || "—") + " | " + formatNum(c.encdps) + " DPS");
        });
        if (names.length > 5) lines.push("  … and " + (names.length - 5) + " more");
      }
    }
    setData(lines.join("\n"));
  });

  addOverlayListener("ChangeZone", function (e) {
    setStatus("connected", "Connected — zone " + (e && e.zoneID != null ? e.zoneID : "?"));
    if (!dataEl.textContent || dataEl.textContent.indexOf("No combat data") === 0) {
      setData("Zone: " + (e && e.zoneID != null ? e.zoneID : "—") + "\nNo combat data yet.");
    }
  });

  addOverlayListener("ChangePrimaryPlayer", function (e) {
    if (e && e.charName) {
      setStatus("connected", "Connected — " + e.charName);
    }
  });

  startOverlayEvents();

  setTimeout(function () {
    if (statusEl.classList.contains("waiting")) {
      setStatus("error", "No data yet");
      setData(
        "No overlay events received.\n\n" +
        "1. If in browser: use URL with ?OVERLAY_WS=ws://127.0.0.1:10501/ws\n" +
        "2. In OverlayPlugin: enable the WebSocket server (WSServer tab)\n" +
        "3. Add this overlay in OverlayPlugin and point URL to this page\n" +
        "4. Ensure ACT is parsing (FFXIV tab, test with Parse from network)"
      );
    }
  }, 4000);
})();
