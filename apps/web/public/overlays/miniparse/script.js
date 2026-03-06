(function () {
  var encounterEl = document.getElementById("encounter");
  var tableEl = document.getElementById("combatantTable");
  var thead = document.getElementById("combatantTableHeader");
  var tbody = document.getElementById("combatantTableBody");

  function formatNum(val) {
    if (val === undefined || val === null || val === "") return "—";
    var n = Number(val);
    if (isNaN(n)) return String(val);
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
    return n.toFixed(0);
  }

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function updateEncounter(data) {
    if (!data || !data.Encounter) return;
    var enc = data.Encounter;
    var title = enc.title || "Encounter";
    var duration = enc.duration != null ? enc.duration : "";
    var dps = enc.ENCDPS != null ? formatNum(enc.ENCDPS) : "—";
    encounterEl.innerHTML =
      "<div class=\"encounter-title\">" + escapeHtml(title) + "</div>" +
      "<div class=\"encounter-meta\">Time: " + escapeHtml(String(duration)) + " · DPS: <span class=\"dps\">" + escapeHtml(dps) + "</span></div>";
  }

  function ensureHeader() {
    if (thead && thead.children.length) return;
    if (!thead) return;
    var row = thead.insertRow();
    ["Name", "Job", "DPS", "%", "HPS", "%", "Crit%"].forEach(function (label, i) {
      var th = document.createElement("th");
      th.textContent = label;
      if (i >= 2) th.className = "num";
      row.appendChild(th);
    });
  }

  function updateCombatants(data) {
    if (!tbody) return;
    if (!data || !data.Combatant || typeof data.Combatant !== "object") {
      tbody.innerHTML = "<tr><td colspan=\"7\" class=\"empty-state\">No combat data</td></tr>";
      return;
    }
    var names = Object.keys(data.Combatant);
    if (names.length === 0) {
      tbody.innerHTML = "<tr><td colspan=\"7\" class=\"empty-state\">No combat data</td></tr>";
      return;
    }
    names.sort(function (a, b) {
      var da = data.Combatant[a];
      var db = data.Combatant[b];
      var dpsA = Number(da.encdps) || 0;
      var dpsB = Number(db.encdps) || 0;
      return dpsB - dpsA;
    });
    tbody.innerHTML = "";
    names.forEach(function (name) {
      var c = data.Combatant[name];
      var row = tbody.insertRow();
      var deaths = parseInt(c.deaths, 10) || 0;
      if (deaths > 0) row.classList.add("dead");
      var pct = c["damage%"] != null ? Number(c["damage%"]).toFixed(1) + "%" : "—";
      var healPct = c["healed%"] != null ? Number(c["healed%"]).toFixed(1) + "%" : "—";
      var critPct = c.crithit != null ? Number(c.crithit).toFixed(1) + "%" : (c["crithit%"] != null ? Number(c["crithit%"]).toFixed(1) + "%" : "—");
      [
        c.name || name,
        c.Job != null ? String(c.Job) : "—",
        formatNum(c.encdps),
        pct,
        formatNum(c.enchps),
        healPct,
        critPct
      ].forEach(function (text, i) {
        var cell = row.insertCell();
        cell.textContent = text;
        if (i >= 2) cell.className = "num";
      });
    });
  }

  function update(data) {
    updateEncounter(data);
    ensureHeader();
    updateCombatants(data);
  }

  addOverlayListener("CombatData", function (data) { update(data); });
  startOverlayEvents();
})();
