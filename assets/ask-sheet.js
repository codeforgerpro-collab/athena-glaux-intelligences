/* ATHENA Glaux - Ask answer sheet (ASK-3, 26 Nov 2026). Built in the reader's browser: nothing about the question leaves it.
   makes a PDF (text drawn on A4 pages, so every script - Greek, Cyrillic, Arabic - looks right), its SHA-256, and - only when the reader
   asks for it - a Bitcoin timestamp (OpenTimestamps): the 32-byte hash alone is sent to public calendar servers. */
(function () {
  var enc = new TextEncoder();
  var CAL = ["https://a.pool.opentimestamps.org", "https://b.pool.opentimestamps.org", "https://a.pool.eternitywall.com", "https://alice.btc.calendar.opentimestamps.org"];
  var MAGIC = [0x00, 0x4f, 0x70, 0x65, 0x6e, 0x54, 0x69, 0x6d, 0x65, 0x73, 0x74, 0x61, 0x6d, 0x70, 0x73, 0x00, 0x00, 0x50, 0x72, 0x6f, 0x6f, 0x66, 0x00, 0xbf, 0x89, 0xe2, 0xe8, 0x84, 0xe8, 0x92, 0x94];

  function hex(buf) { return [].map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); }
  function fromHex(h) { var a = new Uint8Array(h.length / 2); for (var i = 0; i < a.length; i++) a[i] = parseInt(h.substr(i * 2, 2), 16); return a; }
  function sha(bytes) { return crypto.subtle.digest("SHA-256", bytes).then(hex); }
  function cat(list) { var n = 0, o = 0, i; for (i = 0; i < list.length; i++) n += list[i].length; var r = new Uint8Array(n); for (i = 0; i < list.length; i++) { r.set(list[i], o); o += list[i].length; } return r; }
  function latin(s) { var a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i) & 255; return a; }
  function u16hex(s) { var h = "FEFF"; for (var i = 0; i < s.length; i++) h += ("000" + s.charCodeAt(i).toString(16)).slice(-4); return "<" + h.toUpperCase() + ">"; }
  function p2(n) { return ("0" + n).slice(-2); }
  function iso(d) { return d.getUTCFullYear() + "-" + p2(d.getUTCMonth() + 1) + "-" + p2(d.getUTCDate()) + " " + p2(d.getUTCHours()) + ":" + p2(d.getUTCMinutes()) + ":" + p2(d.getUTCSeconds()) + " UTC"; }

  /* ---------- the PDF file: one JPEG page image per A4 page, plus the document information ---------- */
  function buildPdf(pages, info) {
    var parts = [], off = 0, xref = [];
    function put(x) { var b = typeof x === "string" ? latin(x) : x; parts.push(b); off += b.length; }
    function obj(n, body) { xref[n] = off; put(n + " 0 obj\n" + body + "\nendobj\n"); }
    var n = pages.length, kids = [], i;
    put("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n");
    obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
    for (i = 0; i < n; i++) kids.push((4 + 3 * i) + " 0 R");
    obj(2, "<< /Type /Pages /Kids [" + kids.join(" ") + "] /Count " + n + " >>");
    var d = new Date(), cd = "D:" + d.getUTCFullYear() + p2(d.getUTCMonth() + 1) + p2(d.getUTCDate()) + p2(d.getUTCHours()) + p2(d.getUTCMinutes()) + p2(d.getUTCSeconds()) + "Z";
    obj(3, "<< /Title " + u16hex(info.title) + " /Author " + u16hex("ATHENA Glaux") + " /Subject " + u16hex(info.subject) + " /Keywords " + u16hex(info.keywords) + " /Creator " + u16hex("ATHENA Glaux Ask") + " /CreationDate (" + cd + ") >>");
    for (i = 0; i < n; i++) {
      var pg = pages[i], b = 4 + 3 * i;
      obj(b, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 " + (b + 2) + " 0 R >> >> /Contents " + (b + 1) + " 0 R >>");
      var cs = "q 595 0 0 842 0 0 cm /Im0 Do Q";
      obj(b + 1, "<< /Length " + cs.length + " >>\nstream\n" + cs + "\nendstream");
      xref[b + 2] = off;
      put((b + 2) + " 0 obj\n<< /Type /XObject /Subtype /Image /Width " + pg.w + " /Height " + pg.h + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + pg.jpeg.length + " >>\nstream\n");
      put(pg.jpeg); put("\nendstream\nendobj\n");
    }
    var size = 4 + 3 * n, xo = off, x = "xref\n0 " + size + "\n0000000000 65535 f \n";
    for (i = 1; i < size; i++) x += ("0000000000" + xref[i]).slice(-10) + " 00000 n \n";
    put(x + "trailer\n<< /Size " + size + " /Root 1 0 R /Info 3 0 R >>\nstartxref\n" + xo + "\n%%EOF\n");
    return cat(parts);
  }

  /* ---------- the sheet: text laid out on canvas pages ---------- */
  function layout(items, o) {
    var S = 2, W = 595 * S, H = 842 * S, M = 46 * S, rtl = !!o.rtl, fam = o.family || "sans-serif", cv = [], g, y, maxw = W - 2 * M;
    function fresh() {
      var c = document.createElement("canvas"); c.width = W; c.height = H; g = c.getContext("2d");
      g.fillStyle = "#ffffff"; g.fillRect(0, 0, W, H); g.textBaseline = "alphabetic"; cv.push(c); y = M + 6 * S;
    }
    function setf(st) { g.font = st.w + " " + st.s * S + "px " + (st.mono ? "ui-monospace,Menlo,Consolas,monospace" : fam); g.fillStyle = st.c; g.direction = rtl ? "rtl" : "ltr"; g.textAlign = rtl ? "right" : "left"; }
    function wrap(t, st) {
      setf(st); var out = [], words = String(t).split(/\s+/), line = "", i, w;
      function cut(w2) { var a = ""; for (var k = 0; k < w2.length; k++) { if (g.measureText(a + w2[k]).width > maxw) { out.push(a); a = ""; } a += w2[k]; } return a; }
      for (i = 0; i < words.length; i++) {
        w = words[i]; if (!w) continue;
        if (g.measureText(w).width > maxw) { if (line) { out.push(line); line = ""; } line = cut(w); continue; }
        var tr = line ? line + " " + w : w;
        if (g.measureText(tr).width > maxw) { out.push(line); line = w; } else line = tr;
      }
      if (line) out.push(line); return out;
    }
    var ST = { h1: { s: 21, w: "700", c: "#14233b", gap: 8, lh: 1.25 }, h2: { s: 12.5, w: "700", c: "#8a6a24", gap: 4, lh: 1.3, before: 14 },
      p: { s: 10, w: "400", c: "#1d2433", gap: 3, lh: 1.45 }, b: { s: 10, w: "700", c: "#1d2433", gap: 0, lh: 1.45, before: 6 }, s: { s: 8.5, w: "400", c: "#5b6578", gap: 2, lh: 1.4 },
      m: { s: 8, w: "400", c: "#1d2433", gap: 2, lh: 1.4, mono: 1 }, q: { s: 14, w: "600", c: "#1d2433", gap: 6, lh: 1.35 } };
    fresh();
    items.forEach(function (it) {
      var st = ST[it[0]]; if (!st) return;
      var lines = wrap(it[1], st), lh = st.s * st.lh * S;
      y += (st.before || 0) * S;
      if (y + lh * Math.min(lines.length, 2) > H - M - 14 * S) fresh();
      lines.forEach(function (l) { if (y + lh > H - M - 14 * S) fresh(); setf(st); y += lh; g.fillText(l, rtl ? W - M : M, y - lh * 0.22); });
      y += st.gap * S;
    });
    cv.forEach(function (c, i) {
      var k = c.getContext("2d"); k.font = "400 " + 7.5 * S + "px " + fam; k.fillStyle = "#8a93a5"; k.direction = rtl ? "rtl" : "ltr"; k.textAlign = rtl ? "right" : "left";
      k.fillRect(M, H - M, W - 2 * M, 1); k.fillStyle = "#8a93a5"; k.fillText(o.foot + "  ·  " + (i + 1) + "/" + cv.length, rtl ? W - M : M, H - M + 12 * S);
    });
    return cv;
  }
  function jpegs(cv) {
    return Promise.all(cv.map(function (c) {
      return new Promise(function (res) { c.toBlob(function (b) { b.arrayBuffer().then(function (ab) { res({ w: c.width, h: c.height, jpeg: new Uint8Array(ab) }); }); }, "image/jpeg", 0.9); });
    }));
  }

  /* ---------- the Bitcoin timestamp (OpenTimestamps) ---------- */
  function stampDigest(dig) {
    var ctl = "AbortController" in window ? new AbortController() : null, to = setTimeout(function () { if (ctl) ctl.abort(); }, 15000);
    return Promise.all(CAL.map(function (c) {
      return fetch(c + "/digest", { method: "POST", body: dig, headers: { "Accept": "application/vnd.opentimestamps.v1" }, signal: ctl ? ctl.signal : undefined })
        .then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); }).then(function (b) { b = new Uint8Array(b); if (!b.length || b.length > 9000) throw 0; return { c: c, b: b }; })
        .catch(function () { return null; });
    })).then(function (all) {
      clearTimeout(to); var ok = all.filter(Boolean);
      if (!ok.length) throw new Error("no calendar");
      var body = []; ok.forEach(function (a, i) { if (i < ok.length - 1) body.push(new Uint8Array([0xff])); body.push(a.b); });
      return { ots: cat([new Uint8Array(MAGIC), new Uint8Array([1, 8]), dig].concat(body)), cals: ok.map(function (a) { return a.c.replace("https://", ""); }) };
    });
  }

  /* ---------- a small ZIP (stored) so PDF, stamp and read-me arrive in one download ---------- */
  var CT = null;
  function crc(b) { if (!CT) { CT = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; CT[n] = c >>> 0; } }
    var r = 0xffffffff; for (var i = 0; i < b.length; i++) r = CT[(r ^ b[i]) & 255] ^ (r >>> 8); return (r ^ 0xffffffff) >>> 0; }
  function le(n, w) { var a = []; for (var i = 0; i < w; i++) a.push((n >>> (8 * i)) & 255); return new Uint8Array(a); }
  function zip(files) {
    var d = new Date(), tm = (d.getUTCHours() << 11) | (d.getUTCMinutes() << 5) | (d.getUTCSeconds() >> 1), dt = ((d.getUTCFullYear() - 1980) << 9) | ((d.getUTCMonth() + 1) << 5) | d.getUTCDate();
    var out = [], cen = [], off = 0;
    files.forEach(function (f) {
      var nm = enc.encode(f.name), c = crc(f.bytes);
      var lh = cat([le(0x04034b50, 4), le(20, 2), le(0x0800, 2), le(0, 2), le(tm, 2), le(dt, 2), le(c, 4), le(f.bytes.length, 4), le(f.bytes.length, 4), le(nm.length, 2), le(0, 2), nm]);
      cen.push(cat([le(0x02014b50, 4), le(20, 2), le(20, 2), le(0x0800, 2), le(0, 2), le(tm, 2), le(dt, 2), le(c, 4), le(f.bytes.length, 4), le(f.bytes.length, 4), le(nm.length, 2), le(0, 2), le(0, 2), le(0, 2), le(0, 2), le(0, 4), le(off, 4), nm]));
      out.push(lh, f.bytes); off += lh.length + f.bytes.length;
    });
    var cd = cat(cen);
    return cat(out.concat([cd, cat([le(0x06054b50, 4), le(0, 2), le(0, 2), le(files.length, 2), le(files.length, 2), le(cd.length, 4), le(off, 4), le(0, 2)])]));
  }
  function save(name, bytes, type) {
    var a = document.createElement("a"), u = URL.createObjectURL(new Blob([bytes], { type: type }));
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 4000);
  }

  /* ---------- the public call: make(ctx, withStamp) ----------
     ctx: {L (labels), lang, rtl, q, url, lines [read-as], events [{n,h,sec,risk,out,cn,ts,url}], total, gen, dataHash, vocabHash, text {how,tips,private,...}, root, family} */
  function make(c, withStamp, say) {
    var now = new Date(), L = c.L, items = [], i;
    var payload = JSON.stringify({ v: 1, q: c.q, lang: c.lang, data_generated: c.gen, data_sha256: c.dataHash, vocabulary_sha256: c.vocabHash, read_as: c.lines,
      answers: c.events.map(function (e) { return [e.id, e.h, e.risk, e.out, e.cn, e.ts]; }), total: c.total });
    return sha(enc.encode(payload)).then(function (contentHash) {
      items.push(["h1", L.title], ["s", L.sub], ["h2", L.q], ["q", c.q], ["h2", L.when], ["p", iso(now)], ["s", L.when_note.replace("{gen}", c.genText)],
        ["h2", L.page], ["m", c.url], ["h2", L.read]);
      c.lines.forEach(function (l) { items.push(["p", l]); });
      items.push(["h2", L.answers + " (" + c.total + ")"]);
      c.events.forEach(function (e, k) {
        items.push(["b", (k + 1) + ".  " + e.h], ["s", e.sec + "  ·  " + L.risk + " " + e.risk + "  ·  " + L.outlets + " " + e.out + "  ·  " + L.countries + " " + e.cn + "  ·  " + e.when], ["m", e.url]);
      });
      if (c.total > c.events.length) items.push(["s", L.more.replace("{n}", c.total - c.events.length)]);
      if (!c.total) items.push(["p", L.none]);
      items.push(["h2", L.meth]);
      (c.text.how || []).forEach(function (h) { items.push(["p", h[0] + ": " + h[1]]); });
      (c.text.tips || []).forEach(function (t) { items.push(["s", "• " + t]); });
      items.push(["p", L.meth_rules], ["s", c.text.private]);
      items.push(["h2", L.integ], ["s", L.chash], ["m", contentHash], ["s", L.dhash + " (" + c.root + "data/ask.json, " + L.gen + " " + c.genText + ")"], ["m", c.dataHash],
        ["s", L.vhash], ["m", c.vocabHash], ["h2", L.btc], ["p", L.btc_day.replace("{u}", c.proofs)],
        ["p", withStamp ? L.btc_own : L.btc_none], ["s", L.limits]);
      var foot = "ATHENA Glaux · " + L.title + " · " + iso(now) + " · " + contentHash.slice(0, 16);
      var cv = layout(items, { rtl: c.rtl, family: c.family, foot: foot });
      return jpegs(cv).then(function (pg) {
        var pdf = buildPdf(pg, { title: L.title + ": " + c.q.slice(0, 80), subject: c.url, keywords: "content-sha256 " + contentHash + "; data-sha256 " + c.dataHash });
        return sha(pdf).then(function (pdfHash) {
          var base = "athena-answer-sheet-" + now.getUTCFullYear() + p2(now.getUTCMonth() + 1) + p2(now.getUTCDate()) + "-" + p2(now.getUTCHours()) + p2(now.getUTCMinutes()) + "-" + contentHash.slice(0, 8), name = base + ".pdf";
          if (!withStamp) { save(name, pdf, "application/pdf"); return { name: name, pdfHash: pdfHash, contentHash: contentHash }; }
          say(L.stamping);
          return stampDigest(fromHex(pdfHash)).then(function (st) {
            var readme = L.readme.replace(/\{pdf\}/g, name).replace("{hash}", pdfHash).replace("{cals}", st.cals.join(", ")).replace("{time}", iso(now));
            save(base + ".zip", zip([{ name: name, bytes: pdf }, { name: name + ".ots", bytes: st.ots }, { name: "READ-ME.txt", bytes: enc.encode(readme) }]), "application/zip");
            return { name: base + ".zip", pdfHash: pdfHash, contentHash: contentHash, cals: st.cals };
          });
        });
      });
    });
  }
  window.AskSheet = { make: make, _t: { buildPdf: buildPdf, zip: zip, crc: crc, sha: sha, cat: cat, MAGIC: MAGIC } };
})();
