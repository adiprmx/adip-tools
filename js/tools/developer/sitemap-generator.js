import { h as T, kv, esc, errBox, preHtml } from '../../core.js?v=6.13.0';

/* Fungsi murni (bisa diuji dari node tanpa DOM). */
export function parseUrlList(text) {
  const valid = [], invalid = [];
  String(text == null ? '' : text).split(/\r?\n/).forEach((line) => {
    const s = line.trim();
    if (!s) return;
    let cand = s;
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(cand)) cand = 'https://' + cand;
    try {
      const u = new URL(cand);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') { invalid.push(s); return; }
      if (!u.hostname.includes('.')) { invalid.push(s); return; }
      valid.push(u.href);
    } catch (e) { invalid.push(s); }
  });
  return { valid, invalid };
}

export function xmlEscape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export function fmtPriority(v) {
  let n = parseFloat(String(v == null ? '' : v).replace(',', '.'));
  if (isNaN(n)) n = 0.5;
  n = Math.max(0, Math.min(1, n));
  return n.toFixed(1);
}

export function buildSitemap(entries) {
  const L = ['<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
  entries.forEach((e) => {
    L.push('  <url>');
    L.push('    <loc>' + xmlEscape(e.loc) + '</loc>');
    if (e.lastmod) L.push('    <lastmod>' + xmlEscape(e.lastmod) + '</lastmod>');
    if (e.freq) L.push('    <changefreq>' + xmlEscape(e.freq) + '</changefreq>');
    if (e.priority != null) L.push('    <priority>' + fmtPriority(e.priority) + '</priority>');
    L.push('  </url>');
  });
  L.push('</urlset>');
  return L.join('\n');
}

export const meta = {"id": "sitemap-generator", "name": "Sitemap Generator", "cat": "developer", "icon": "🗺️", "desc": "Buat sitemap.xml dari daftar URL situsmu.", "keywords": "sitemap,xml,seo,url,google", "since": "6.11.0"};
export function render(root) {
  const FREQS = [['daily', 'Harian'], ['weekly', 'Mingguan'], ['monthly', 'Bulanan'], ['always', 'Selalu'], ['hourly', 'Tiap jam'], ['yearly', 'Tahunan'], ['never', 'Tidak pernah']];
  const taUrls = T.ta(6, 'Tempel daftar URL, satu per baris. Contoh:\nhttps://contoh.com/\nhttps://contoh.com/tentang\nhttps://contoh.com/blog/artikel-1');
  const chkLastmod = T.el('<input type="checkbox" checked style="width:18px;height:18px;accent-color:#fff">');
  const fFreqAll = T.select(FREQS, 'weekly');
  const fPrioAll = T.input('text', '0.5', '0.5');
  fPrioAll.inputMode = 'decimal';
  const listBox = T.el('<div style="margin:12px 0"></div>');
  const outBox = T.out();
  let entries = [];

  const paintList = () => {
    listBox.innerHTML = '';
    if (!entries.length) {
      listBox.appendChild(T.el('<div class="hint">Belum ada URL. Tempel daftar di atas lalu tekan "Buat Daftar".</div>'));
      return;
    }
    const head = T.el('<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px"><span style="font-size:13px;font-weight:600">' + T.fmt(entries.length) + ' URL</span><span class="hint">Atur seberapa sering berubah dan seberapa penting tiap halaman.</span></div>');
    listBox.appendChild(head);
    entries.forEach((e, i) => {
      const row = T.el('<div style="background:#131316;border:1px solid #27272a;border-radius:8px;padding:8px 10px;margin-bottom:6px"></div>');
      const urlLine = T.el('<div style="font-size:12.5px;font-family:monospace;word-break:break-all;margin-bottom:8px">' + esc(e.loc) + '</div>');
      const sel = T.select(FREQS, e.freq);
      sel.style.flex = '1';
      sel.addEventListener('change', () => { e.freq = sel.value; });
      const pr = T.input('text', '0.5', e.priority);
      pr.inputMode = 'decimal';
      pr.style.width = '72px';
      pr.addEventListener('input', () => { e.priority = pr.value; });
      const del = T.btn('✕', () => { entries.splice(i, 1); paintList(); });
      del.setAttribute('aria-label', 'Hapus URL ' + e.loc);
      del.style.padding = '4px 10px';
      const ctl = T.el('<div style="display:flex;gap:8px;align-items:center"></div>');
      ctl.appendChild(T.el('<span class="hint" style="white-space:nowrap">Berubah</span>'));
      ctl.appendChild(sel);
      ctl.appendChild(T.el('<span class="hint" style="white-space:nowrap">Penting</span>'));
      ctl.appendChild(pr);
      ctl.appendChild(del);
      row.appendChild(urlLine);
      row.appendChild(ctl);
      listBox.appendChild(row);
    });
  };

  const build = () => {
    const lastmod = chkLastmod.checked ? new Date().toISOString().slice(0, 10) : '';
    return buildSitemap(entries.map((e) => ({ loc: e.loc, freq: e.freq, priority: e.priority, lastmod })));
  };

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Sitemap adalah daftar halaman situsmu untuk mesin pencari. Tempel semua URL, atur tiap halaman, lalu unduh file sitemap.xml dan taruh di folder utama situsmu.</p>'));
  root.appendChild(T.field('Daftar URL (satu per baris)', taUrls, 'URL tanpa https:// otomatis dilengkapi. Maksimal 50.000 URL per file sitemap.'));
  const lastmodLabel = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:13px;margin:4px 0 12px;cursor:pointer"></label>');
  lastmodLabel.appendChild(chkLastmod);
  lastmodLabel.appendChild(T.el('<span>Sertakan tanggal hari ini sebagai tanggal update tiap halaman</span>'));
  root.appendChild(lastmodLabel);
  root.appendChild(T.row(T.btn('Buat Daftar', () => {
    const { valid, invalid } = parseUrlList(taUrls.value);
    if (!valid.length) {
      T.show(outBox, errBox('Tidak ada URL yang valid. Periksa lagi daftarnya, satu URL per baris.'));
      return;
    }
    if (valid.length > 50000) {
      T.show(outBox, errBox('Daftarnya ' + T.fmt(valid.length) + ' URL, melebihi batas 50.000 URL per file sitemap. Bagi jadi beberapa file.'));
      return;
    }
    entries = valid.map((loc) => ({ loc, freq: 'weekly', priority: '0.5' }));
    paintList();
    T.hide(outBox);
    if (invalid.length) {
      T.show(outBox, '<div style="font-size:13px;line-height:1.6;color:#fbbf24">' + T.fmt(invalid.length) + ' baris dilewati karena bukan URL yang valid: ' + esc(invalid.slice(0, 5).join(', ')) + (invalid.length > 5 ? ' dan ' + (invalid.length - 5) + ' lagi.' : '.') + '</div>');
    }
  }, true)));
  root.appendChild(T.grid2(T.field('Frekuensi untuk semua', fFreqAll), T.field('Prioritas untuk semua (0.0 sampai 1.0)', fPrioAll, '0.5 artinya biasa saja, 1.0 artinya paling penting.')));
  root.appendChild(T.row(T.btn('Terapkan ke Semua', () => {
    if (!entries.length) { T.show(outBox, errBox('Buat daftar dulu sebelum menerapkan ke semua.')); return; }
    entries.forEach((e) => { e.freq = fFreqAll.value; e.priority = fPrioAll.value; });
    paintList();
    T.hide(outBox);
  })));
  root.appendChild(listBox);
  root.appendChild(T.row(
    T.btn('Generate XML', () => {
      if (!entries.length) { T.show(outBox, errBox('Buat daftar dulu, minimal satu URL.')); return; }
      T.show(outBox, preHtml(build()));
    }, true),
    T.copyBtn(() => (entries.length ? build() : ''), 'Salin XML'),
    T.dlBtn('sitemap.xml', () => (entries.length ? build() : ''), 'application/xml', 'Unduh sitemap.xml')
  ));
  root.appendChild(outBox);
  paintList();
}
