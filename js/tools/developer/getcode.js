import { h as T, errBox } from '../../core.js?v=6.9.20';

export const meta = {"id": "getcode", "name": "Get Code HTML", "cat": "developer", "icon": "💻", "desc": "Ambil & ekstrak source HTML dari URL mana pun.", "keywords": "html,source,kode,extract,view-source,scrape"};

export function render(root) {

  const HIST_KEY = 'adip-getcode-history';
  const readHist = () => { try { const l = JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); return Array.isArray(l) ? l : []; } catch (e) { return []; } };
  const pushHist = (rec) => { try { localStorage.setItem(HIST_KEY, JSON.stringify([rec].concat(readHist()).slice(0, 24))); } catch (e) {} };

  const ROUTES = [
    { id: 'allorigins', label: 'AllOrigins', url: (u) => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u) },
    { id: 'jina', label: 'Jina Reader', url: (u) => 'https://r.jina.ai/' + u },
    { id: 'codetabs', label: 'CodeTabs', url: (u) => 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u) },
    { id: 'corsanyway', label: 'CorsAnyway', url: (u) => 'https://cors-anyway.huskymobile.com/?' + u },
  ];

  /* ---- log ekstraksi ---- */
  const logSec = T.el('<div style="margin:16px 0 4px" hidden><b>Log ekstraksi</b></div>');
  const logList = T.el('<div style="display:grid;gap:6px;margin:8px 0" hidden></div>');
  const logEntries = [];
  const renderLog = () => {
    logList.innerHTML = '';
    logEntries.slice(-30).forEach((e) => {
      const row = T.el('<div style="border:1px solid #ffffff20;border-radius:8px;padding:8px 10px;font-size:12px;display:flex;gap:8px;align-items:center"></div>');
      row.appendChild(T.el('<b style="flex-shrink:0">' + T.esc(e.route) + '</b>'));
      row.appendChild(T.el(e.ok ? '<span class="ok">OK</span>' : '<span style="color:#f87171">Gagal</span>'));
      row.appendChild(T.el('<span class="dim" style="word-break:break-all">' + T.esc(e.msg) + '</span>'));
      logList.appendChild(row);
    });
    const show = logEntries.length > 0;
    logSec.hidden = !show; logList.hidden = !show;
  };
  const addLog = (route, ok, msg) => { logEntries.push({ route, ok, msg }); renderLog(); };

  const inp = T.input('text', 'https://contoh.com', 'https://');
  inp.style.fontFamily = 'monospace';
  const box = T.out();
  const statBox = T.el('<div class="dim" style="font-size:13px;margin:8px 0"></div>');
  const viewer = T.ta(16, 'Source HTML akan tampil di sini…', '');
  viewer.style.fontFamily = 'monospace';
  viewer.style.fontSize = '12px';
  viewer.readOnly = true;
  const previewWrap = T.el('<div style="margin-top:12px" hidden></div>');
  const frame = document.createElement('iframe');
  frame.setAttribute('sandbox', 'allow-same-origin');
  frame.style.cssText = 'width:100%;height:420px;border:1px solid #ffffff20;border-radius:12px;background:#fff';
  previewWrap.appendChild(frame);

  let latest = '', latestUrl = '', latestRoute = '';

  const extract = async () => {
    let target = inp.value.trim();
    if (!target) { T.show(box, errBox('Tempel dulu URL yang mau diambil source-nya.')); return; }
    if (!/^https?:\/\//i.test(target)) target = 'https://' + target;
    let u;
    try { u = new URL(target); } catch (e) { T.show(box, errBox('URL tidak valid.')); return; }
    if (!/^https?:$/.test(u.protocol)) { T.show(box, errBox('Hanya URL http/https yang didukung.')); return; }
    if (/[^a-zA-Z0-9.\-:[\]]/.test(u.hostname)) { T.show(box, errBox('URL tidak valid.')); return; }
    target = u.toString();

    T.show(box, '<span class="dim">Mengambil source…</span>');
    statBox.textContent = '';
    let html = '', routeUsed = '', lastErr = '';
    for (const r of ROUTES) {
      try {
        T.show(box, '<span class="dim">Mencoba via ' + r.label + '…</span>');
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 20000);
        const res = await fetch(r.url(target), { signal: ctrl.signal });
        clearTimeout(t);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const text = await res.text();
        if (!text || !text.trim()) throw new Error('Respons kosong');
        if (/^4\d\d/.test(text.slice(0, 3)) && text.length < 200) throw new Error('Halaman error');
        html = text; routeUsed = r.label;
        addLog(r.label, true, 'Berhasil (' + (new Blob([text]).size / 1024).toFixed(1) + ' KB)');
        break;
      } catch (e) {
        lastErr = e.name === 'AbortError' ? 'timeout' : e.message;
        addLog(r.label, false, lastErr);
      }
    }
    if (!html) { T.show(box, errBox('Gagal mengambil source dari semua jalur (' + lastErr + '). Coba lagi nanti.')); return; }

    latest = html; latestUrl = target; latestRoute = routeUsed;
    viewer.value = html;
    try { buildReport(html, target); } catch (e) { /* laporan opsional */ }
    const kb = (new Blob([html]).size / 1024).toFixed(1);
    const lines = html.split('\n').length;
    statBox.innerHTML = 'Berhasil via <b>' + T.esc(routeUsed) + '</b> · <b>' + kb + ' KB</b> · <b>' + lines.toLocaleString('id-ID') + '</b> baris';
    T.show(box, '<span class="ok">Source berhasil diambil.</span>');
    pushHist({ url: target.slice(0, 100), route: routeUsed, size: kb + ' KB', waktu: Date.now() });
    actRow.hidden = false;
  };

  const bCopy = T.copyBtn(() => viewer.value, 'Salin Source');
  const bDl = T.btn('Unduh .html', () => {
    if (!latest) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([latest], { type: 'text/html;charset=utf-8' }));
    let host = 'halaman';
    try { host = new URL(latestUrl).hostname.replace(/^www\./, ''); } catch (e) {}
    a.download = host + '-source.html';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  const bPrev = T.btn('Pratinjau', () => {
    if (!latest) return;
    frame.srcdoc = latest;
    previewWrap.hidden = false;
    previewWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  const bPrevM = T.btn('Pratinjau HP', () => {
    if (!latest) return;
    frame.srcdoc = latest;
    frame.style.maxWidth = '400px';
    frame.style.margin = '0 auto';
    frame.style.display = 'block';
    previewWrap.hidden = false;
    previewWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  const actRow = T.el('<div hidden></div>');
  actRow.appendChild(T.row(bCopy, bDl, bPrev, bPrevM));

  /* ---- laporan source: aset & endpoint ---- */
  const repSec = T.el('<div style="margin:16px 0 4px" hidden></div>');
  const repList = T.el('<div style="display:grid;gap:6px;margin:8px 0" hidden></div>');
  const KIND_LABEL = { script: 'script', css: 'css', gambar: 'gambar', media: 'media', iframe: 'iframe', 'css-url': 'css-url', '@import': '@import', endpoint: 'endpoint' };
  const buildReport = (html, baseUrl) => {
    repList.innerHTML = '';
    let base;
    try { base = new URL(baseUrl); } catch (e) { return; }
    const items = [];
    const seen = new Set();
    const push = (kind, raw) => {
      if (!raw || /^(data|blob|javascript|mailto|tel):/i.test(raw)) return;
      let abs;
      try { abs = new URL(raw, base).href; } catch (e) { return; }
      const key = kind + '|' + abs;
      if (seen.has(key)) return;
      seen.add(key);
      items.push({ kind, url: abs, scope: new URL(abs).hostname === base.hostname ? 'internal' : 'eksternal' });
    };
    let doc;
    try { doc = new DOMParser().parseFromString(html, 'text/html'); } catch (e) { doc = null; }
    if (doc) {
      doc.querySelectorAll('script[src]').forEach((el) => push('script', el.getAttribute('src')));
      doc.querySelectorAll('link[href]').forEach((el) => push('css', el.getAttribute('href')));
      doc.querySelectorAll('img[src]').forEach((el) => push('gambar', el.getAttribute('src')));
      doc.querySelectorAll('img[srcset], source[srcset]').forEach((el) => {
        String(el.getAttribute('srcset') || '').split(',').forEach((p) => push('gambar', p.trim().split(/\s+/)[0]));
      });
      doc.querySelectorAll('source[src], video[src], audio[src], track[src], embed[src], input[type="image"][src]').forEach((el) => push('media', el.getAttribute('src')));
      doc.querySelectorAll('iframe[src]').forEach((el) => push('iframe', el.getAttribute('src')));
      const cssText = [...doc.querySelectorAll('style')].map((el) => el.textContent).join('\n') +
        [...doc.querySelectorAll('[style]')].map((el) => el.getAttribute('style')).join('\n');
      let m;
      const urlRe = /url\(\s*['"]?([^'")\s]+)['"]?\s*\)/gi;
      while ((m = urlRe.exec(cssText))) push('css-url', m[1]);
      const impRe = /@import\s+(?:url\(\s*)?['"]([^'"]+)['"]/gi;
      while ((m = impRe.exec(cssText))) push('@import', m[1]);
      const jsText = [...doc.querySelectorAll('script:not([src])')].map((el) => el.textContent).join('\n');
      const epRes = [
        /fetch\(\s*['"`]([^'"`]+)['"`]/g,
        /axios\s*\.\s*(?:get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/g,
        /\$\.(?:get|post|ajax)\(\s*['"`]([^'"`]+)['"`]/g,
        /\.open\(\s*['"](?:GET|POST|PUT|PATCH|DELETE)['"]\s*,\s*['"`]([^'"`]+)['"`]/g,
      ];
      epRes.forEach((re) => { let x; while ((x = re.exec(jsText))) push('endpoint', x[1]); });
      const apiRe = /['"`](\/[A-Za-z0-9_\-./?&=#%:]{2,140})['"`]/g;
      let a;
      while ((a = apiRe.exec(jsText))) {
        const p = a[1];
        if (/api|\.(json|php|aspx?|do|action)(\?|#|$)/i.test(p)) push('endpoint', p);
      }
    }
    const MAXR = 150;
    repSec.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b>Laporan source</b><span class="dim" style="font-size:12px">' +
      items.length + ' item' + (items.length > MAXR ? ' (ditampilkan ' + MAXR + ')' : '') + '</span></div>' +
      '<p class="dim" style="font-size:12px;line-height:1.5;margin:6px 0">Aset & endpoint yang terdeteksi dari source HTML.</p>';
    if (!items.length) {
      repList.appendChild(T.el('<span class="dim">Tidak ada aset atau endpoint yang terdeteksi.</span>'));
    }
    items.slice(0, MAXR).forEach((it) => {
      const row = T.el('<div style="border:1px solid #ffffff20;border-radius:8px;padding:8px 10px;font-size:12px"></div>');
      const top = T.el('<div style="display:flex;gap:8px;align-items:center"></div>');
      top.appendChild(T.el('<span style="flex-shrink:0;font-size:11px;border:1px solid #ffffff25;border-radius:6px;padding:2px 8px" title="' + T.esc(it.kind) + '">' + T.esc(KIND_LABEL[it.kind] || it.kind) + '</span>'));
      top.appendChild(T.el('<span class="dim" style="flex-shrink:0;font-size:11px">' + T.esc(it.scope) + '</span>'));
      const cp = T.btn('Salin', () => { try { navigator.clipboard.writeText(it.url); } catch (e) {} });
      cp.classList.add('small'); cp.style.padding = '2px 10px'; cp.style.flexShrink = '0';
      top.appendChild(cp);
      row.appendChild(top);
      row.appendChild(T.el('<div style="font-family:monospace;word-break:break-all;margin-top:4px" title="' + T.esc(it.url) + '">' + T.esc(it.url.length > 160 ? it.url.slice(0, 160) + '…' : it.url) + '</div>'));
      repList.appendChild(row);
    });
    repSec.hidden = false; repList.hidden = false;
  };

  /* riwayat */
  const hBox = T.out();
  const gambarHist = () => {
    const l = readHist();
    if (!l.length) { hBox.innerHTML = '<span class="dim">Belum ada riwayat.</span>'; return; }
    hBox.innerHTML = '<div style="display:grid;gap:8px">' + l.map((h, i) =>
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:10px 12px;font-size:13px;display:flex;gap:10px;align-items:center">' +
      '<span style="flex:1;font-family:monospace;word-break:break-all">' + T.esc(h.url) + '</span>' +
      '<span class="dim">' + T.esc(h.size) + '</span>' +
      '<button class="small" data-hi="' + i + '" style="flex-shrink:0">Buka</button></div>'
    ).join('') + '</div>';
    hBox.querySelectorAll('[data-hi]').forEach((b) => b.addEventListener('click', () => {
      const h = readHist()[+b.dataset.hi];
      if (h) { inp.value = h.url; extract(); }
    }));
  };
  const bClearH = T.btn('Hapus Riwayat', () => { try { localStorage.removeItem(HIST_KEY); } catch (e) {} gambarHist(); });
  bClearH.classList.add('small');

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ekstrak source HTML dari URL mana pun lewat proxy publik — tanpa backend sendiri.</p>'));
  root.appendChild(T.field('URL target', inp));
  root.appendChild(T.row(T.btn('Ekstrak Source', extract, true)));
  root.appendChild(box);
  root.appendChild(statBox);
  root.appendChild(actRow);
  root.appendChild(T.el('<div style="margin:12px 0 4px"><b>Source HTML</b></div>'));
  root.appendChild(viewer);
  root.appendChild(previewWrap);
  root.appendChild(logSec);
  root.appendChild(logList);
  root.appendChild(repSec);
  root.appendChild(repList);
  root.appendChild(T.el('<div style="margin:16px 0 4px;display:flex;justify-content:space-between;align-items:center"><b>Riwayat</b></div>'));
  root.appendChild(hBox);
  root.appendChild(T.row(bClearH));
  gambarHist();
}
