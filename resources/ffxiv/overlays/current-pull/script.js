(function () {
  var titleEl = document.getElementById("pull-title");
  var durationEl = document.getElementById("pull-duration");
  var dpsEl = document.getElementById("pull-dps");
  function formatNum(val) {
    if (val === undefined || val === null || val === "") return "—";
    var n = Number(val);
    if (isNaN(n)) return String(val);
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
    return n.toFixed(0);
  }
  function update(data) {
    if (!data || !data.Encounter) {
      titleEl.textContent = "No combat data";
      durationEl.textContent = "—";
      dpsEl.textContent = "—";
      return;
    }
    var enc = data.Encounter;
    titleEl.textContent = enc.title || "Current pull";
    durationEl.textContent = enc.duration != null ? String(enc.duration) : "—";
    dpsEl.textContent = enc.ENCDPS != null ? formatNum(enc.ENCDPS) : "—";
  }
  addOverlayListener("CombatData", function (data) { update(data); });
  startOverlayEvents();
})();
