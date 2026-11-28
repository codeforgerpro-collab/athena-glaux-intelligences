/* SISTER-1 (28 Nov 2026) - answers from the sister site under the Ask answer.
   ATHENA Glaux Intelligence and The Oracle Hunters each publish a public bridge file (data/ask-bridge.json). This script, the same on
   both sites, reads the sister site's file in the browser and matches the question against it. The question itself never leaves the
   browser: only a public file is downloaded. If the sister site cannot be reached, nothing is shown. */
(function (G) {
  "use strict";
  function N(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/\p{Mn}/gu, "").replace(/ς/g, "σ")
      .replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  }
  var STOP = {};
  ("what which when where whom whose will would could should does have were been this that these those with from about into than then them they " +
   "their there here more most much many some very also just over under after before said says tell show give list latest today news week month year " +
   "read mean means work works check checked does how why " +
   "τι ποιος ποια ποιο ποιοι ποιες ποτε πως ειναι ηταν και στον στην στις στους στο απο για μετα πριν ειπε ειπαν λενε σημερα νεα τελευταια εβδομαδα μηνα")
    .split(" ").forEach(function (w) { STOP[w] = 1; });
  var W = { s: 6, i: 4, x: 3, p: 3, c: 2, t: 2 };
  function prep(b) {
    if (b._ok) return b;
    b.V = (b.voc || []).map(function (v) { return { k: v[0], p: v[1].map(N).filter(Boolean) }; });
    b.T = (b.items || []).map(function (it) { return " " + N(it[2] + " " + it[3]) + " "; });
    b._ok = 1;
    return b;
  }
  function wordHit(w, p) {
    if (w === p) return true;
    if (p.length >= 4 && w.indexOf(p) === 0 && w.length <= p.length + 5) return true;   // a stem: "inflat" -> "inflation", "πληθωρ" -> "πληθωρισμος"
    return w === p + "s" || w === p + "es";
  }
  function hit(words, qs, p) {
    if (p.indexOf(" ") >= 0) return qs.indexOf(" " + p) >= 0;                          // several words: as a phrase
    for (var i = 0; i < words.length; i++) if (wordHit(words[i], p)) return true;
    return false;
  }
  function match(b, q) {
    b = prep(b);
    var qn = N(q);
    if (!qn) return [];
    var words = qn.split(" "), qs = " " + qn + " ", M = {}, keys = 0, used = [], phr = [];
    b.V.forEach(function (v) {
      for (var j = 0; j < v.p.length; j++) {
        if (hit(words, qs, v.p[j])) { M[v.k] = 1; keys++; phr.push(v.p[j]); used = used.concat(v.p[j].split(" ")); break; }
      }
    });
    var free = words.filter(function (w) {
      if (w.length < 4 || STOP[w]) return false;
      for (var i = 0; i < used.length; i++) if (wordHit(w, used[i])) return false;
      return true;
    });
    var needP = Object.keys(M).some(function (k) { return k.charAt(0) === "p"; }),
        needT = Object.keys(M).some(function (k) { return k.charAt(0) === "t"; }), out = [];
    (b.items || []).forEach(function (it, i) {
      var s = 0, f = 0, longF = 0, hasP = false, lit = false;
      var onlyC = true;
      (it[6] || []).forEach(function (k) { if (M[k]) { s += W[k.charAt(0)] || 1; if (k.charAt(0) === "p") hasP = true; if (k.charAt(0) !== "c") onlyC = false; } });
      if (keys && !s) {                                                  // the question named topics or places: a short leftover word alone is not enough
        free.forEach(function (w) { if (w.length >= 6 && b.T[i].indexOf(" " + w) >= 0) longF++; });
        if (!longF) return;
      }
      free.forEach(function (w) { if (b.T[i].indexOf(" " + w) >= 0) { f++; s += w.length >= 6 ? 3 : 1; } });   // long words (names) count more than short ones
      if (s > 0) for (var j = 0; j < phr.length; j++) if (phr[j].length >= 3 && b.T[i].indexOf(" " + phr[j]) >= 0) { s += 2; lit = true; break; }   // the matched words are in the text itself
      if (needP && !hasP && !lit && !f) return;
      if (needT && onlyC && !lit && !f) return;                         // a topic was named: the country alone is not enough                         // a place was named: only items about that place, or with the question's own words
      if (s > 0) out.push([s, i]);
    });
    out.sort(function (a, c) { return c[0] - a[0] || a[1] - c[1]; });
    return out.map(function (x) { return x[1]; });
  }
  G.SisterMatch = function (b, q) { return match(b, q); };              // used by the tests
  if (typeof document === "undefined") return;

  var box = document.getElementById("sister");
  if (!box || !window.fetch) return;
  var src = box.getAttribute("data-src"), el = (document.documentElement.lang || "en").slice(0, 2) === "el";
  var B = null, P = null, pend = null;
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function hide() { box.hidden = true; box.innerHTML = ""; }
  function show(q) {
    if (!B) { pend = q; return; }
    var r = match(B, q).slice(0, 5);
    if (!r.length) { hide(); return; }
    var base = B.base, h = '<h2 class="sister-h">' + esc(el ? B.head_el : B.head_en) + ' <small>' + (el ? "από το " : "from ")
      + '<a href="' + esc(base) + '" rel="noopener">' + esc(B.site) + '</a></small></h2><ul class="sister-list">';
    r.forEach(function (i) {
      var it = B.items[i], u = base + (el && it[1] ? it[1] : it[0]);
      h += '<li><a class="sister-t" href="' + esc(u) + '" rel="noopener">' + esc(it[2]) + '</a>'
        + (it[3] ? '<span class="sister-sub">' + esc(it[3]) + '</span>' : '')
        + '<span class="sister-meta">' + esc(el ? it[5] : it[4]) + '</span></li>';
    });
    h += '</ul><p class="sister-more"><a href="' + esc(base + (el ? B.ask_el : B.ask_en) + "?q=" + encodeURIComponent(q)) + '" rel="noopener">'
      + esc((el ? "Δείτε περισσότερα στο " : "See more on ") + B.site) + '</a></p>';
    box.innerHTML = h;
    box.hidden = false;
  }
  document.addEventListener("askq", function (e) {
    var q = String((e && e.detail) || "").trim();
    if (!q) { pend = null; hide(); return; }
    if (!P) {
      P = fetch(src).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (b) { B = prep(b); if (pend != null) { var p = pend; pend = null; show(p); } })
        .catch(function () { B = null; pend = null; hide(); });
    }
    show(q);
  });
})(typeof window !== "undefined" ? window : globalThis);
