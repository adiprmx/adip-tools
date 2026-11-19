import { h as T, fmtBytes, errBox } from '../../core.js';

// Penampil file HAR (HTTP Archive): tabel semua request, filter request
// gagal/lambat/tidak terkompres, detail per request + ekspor cURL.
// 100% client-side: file HAR dibaca di browser, tidak diunggah.
export const AMBANG_LAMBAT_MS = 1000;
export const AMBANG_KOMPRES_BYTE = 10 * 1024;

function headerDi(headers, nama) {
  if (!Array.isArray(headers)) return '';
  const cari = String(nama).toLowerCase();
  for (const h of headers) {
    if (h && String(h.name || '').toLowerCase() === cari) return String(h.value || '');
  }
  return '';
}

function ukuranRespon(entry) {
  const r = (entry && entry.response) || {};
  const isi = r.content || {};
  if (typeof r.bodySize === 'number' && r.bodySize >= 0) return r.bodySize;
  if (typeof isi.size === 'number' && isi.size >= 0) return isi.size;
  if (typeof isi.text === 'string') return isi.text.length;
  return 0;
}

// Ringkas satu entry HAR jadi baris tabel. Murni, bisa diuji di Node.
export function ringkasEntry(entry) {
  const req = (entry && entry.request) || {};
  const res = (entry && entry.response) || {};
  const url = String(req.url || '');
  const metode = String(req.method || '').toUpperCase();
  const status = typeof res.status === 'number' ? res.status : 0;
  const waktu = typeof entry.time === 'number' ? entry.time : 0;
  const ukuran = ukuranRespon(entry);
  const mime = String((res.content && res.content.mimeType) || '');
  const encoding = headerDi(res.headers, 'content-encoding').toLowerCase();
  const terkompres = /(gzip|br|deflate|zstd)/.test(encoding);
  const mulai = entry.startedDateTime ? Date.parse(entry.startedDateTime) : NaN;
  return {
    metode, url, status, waktu, ukuran, mime,
    terkompres,
    gagal: status === 0 || status >= 400,
    lambat: waktu > AMBANG_LAMBAT_MS,
    takTerkompres: !terkompres && ukuran > AMBANG_KOMPRES_BYTE,
    mulai: isNaN(mulai) ? null : mulai,
  };
}

export function parseHar(teks) {
  let data;
  try {
    data = JSON.parse(String(teks == null ? '' : teks));
  } catch (e) {
    throw new Error('File ini bukan JSON yang benar.');
  }
  const log = data && data.log;
  if (!log || !Array.isArray(log.entries)) throw new Error('File ini bukan HAR yang benar (tidak ada log.entries).');
  return log.entries;
}

export function ringkasHar(entries) {
  const baris = (entries || []).map(ringkasEntry);
  let totalWaktu = 0, totalUkuran = 0, gagal = 0, lambat = 0, takTerkompres = 0;
  for (const b of baris) {
    totalWaktu += b.waktu;
    totalUkuran += b.ukuran;
    if (b.gagal) gagal++;
    if (b.lambat) lambat++;
    if (b.takTerkompres) takTerkompres++;
  }
  return { baris, jumlah: baris.length, totalWaktu, totalUkuran, gagal, lambat, takTerkompres };
}

export function saringBaris(baris, filter) {
  if (filter === 'gagal') return baris.filter((b) => b.gagal);
  if (filter === 'lambat') return baris.filter((b) => b.lambat);
  if (filter === 'kompres') return baris.filter((b) => b.takTerkompres);
  return baris;
}

// Escape untuk shell single-quote: ' jadi '\''.
function shellQuote(s) {
  return "'" + String(s).replace(/'/g, "'\\''") + "'";
}

export function buatCurl(entry) {
  const req = (entry && entry.request) || {};
  const url = String(req.url || '');
  if (!url) return '';
  const bagian = ['curl ' + shellQuote(url)];
  const metode = String(req.method || 'GET').toUpperCase();
  if (metode !== 'GET') bagian.push('-X ' + metode);
  if (Array.isArray(req.headers)) {
    for (const h of req.headers) {
      if (!h || !h.name) continue;
      bagian.push('-H ' + shellQuote(h.name + ': ' + (h.value || '')));
    }
  }
  const post = req.postData;
  if (post && typeof post.text === 'string' && post.text !== '') {
    bagian.push('--data ' + shellQuote(post.text));
  }
  return bagian.join(' ');
}

export function fmtWaktu(ms) {
  if (ms < 1000) return Math.round(ms) + ' mdtk';
  return (ms / 1000).toFixed(2).replace('.', ',') + ' dtk';
}

export const meta = { id: 'penampil-har', name: 'Penampil HAR', cat: 'developer', icon: '🌊', desc: 'Buka file HAR: lihat semua request, temukan yang gagal, lambat, atau tidak terkompres, lalu ekspor sebagai cURL.', keywords: 'har,http archive,request,waterfall,network,curl,debug,analisis', since: '6.19.0' };

export function render(root) {
  const fileI = document.createElement('input');
  fileI.type = 'file';
  fileI.accept = '.har,application/json';
  fileI.className = 'inp';
  const ta = T.ta(6, 'Atau tempel isi file .har di sini…');
  ta.style.fontFamily = 'ui-monospace,monospace';
  const filterSel = T.select([['semua', 'Semua request'], ['gagal', 'Yang gagal saja'], ['lambat', 'Yang lambat saja (>1 dtk)'], ['kompres', 'Yang tidak terkompres saja']], 'semua');
  const box = T.out();
  const tabelWrap = T.el('<div style="margin-top:12px"></div>');
  const detailBox = T.out();

  let entries = null; // entry HAR mentah
  let ringkasan = null;

  const kvBaris = (k, v) => '<div class="kv"><span class="k">' + T.esc(k) + '</span><span class="v">' + v + '</span></div>';

  const gambarTabel = () => {
    if (!ringkasan) return;
    const tampil = saringBaris(ringkasan.baris, filterSel.value);
    const awal = ringkasan.baris.reduce((m, b) => (b.mulai != null && (m == null || b.mulai < m) ? b.mulai : m), null);
    const akhir = ringkasan.baris.reduce((m, b) => (b.mulai != null && b.mulai + b.waktu > m ? b.mulai + b.waktu : m), 0);
    const rentang = awal != null && akhir > awal ? akhir - awal : 0;
    let html = '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12.5px;line-height:1.5;min-width:560px"><thead><tr>' +
      '<th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--line)">#</th>' +
      '<th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--line)">Metode</th>' +
      '<th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--line)">URL</th>' +
      '<th style="text-align:right;padding:6px 8px;border-bottom:1px solid var(--line)">Status</th>' +
      '<th style="text-align:right;padding:6px 8px;border-bottom:1px solid var(--line)">Ukuran</th>' +
      '<th style="text-align:right;padding:6px 8px;border-bottom:1px solid var(--line)">Waktu</th>' +
      '<th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--line)">Waterfall</th></tr></thead><tbody>';
    tampil.forEach((b) => {
      const idx = ringkasan.baris.indexOf(b);
      const kiri = rentang && b.mulai != null ? ((b.mulai - awal) / rentang) * 100 : 0;
      const lebar = rentang ? Math.max(1, (b.waktu / rentang) * 100) : 0;
      const warna = b.gagal ? 'var(--err)' : (b.lambat ? '#f5a623' : 'var(--acc, #fff)');
      const urlTampil = b.url.length > 60 ? b.url.slice(0, 57) + '...' : b.url;
      html += '<tr data-idx="' + idx + '" style="cursor:pointer;border-bottom:1px solid var(--line)">' +
        '<td style="padding:6px 8px;color:var(--dim)">' + (idx + 1) + '</td>' +
        '<td style="padding:6px 8px">' + T.esc(b.metode) + '</td>' +
        '<td style="padding:6px 8px;word-break:break-all" title="' + T.esc(b.url) + '">' + T.esc(urlTampil) + '</td>' +
        '<td style="padding:6px 8px;text-align:right;color:' + (b.gagal ? 'var(--err)' : 'inherit') + '">' + (b.status || 'tanpa respons') + '</td>' +
        '<td style="padding:6px 8px;text-align:right">' + fmtBytes(b.ukuran) + '</td>' +
        '<td style="padding:6px 8px;text-align:right">' + fmtWaktu(b.waktu) + '</td>' +
        '<td style="padding:6px 8px;min-width:90px"><div style="position:relative;height:10px;background:var(--line);border-radius:5px"><div style="position:absolute;left:' + kiri.toFixed(1) + '%;width:' + lebar.toFixed(1) + '%;height:100%;background:' + warna + ';border-radius:5px"></div></div></td></tr>';
    });
    html += '</tbody></table></div>';
    if (!tampil.length) html += '<p class="hint">Tidak ada request yang cocok dengan filter ini.</p>';
    tabelWrap.innerHTML = html;
    tabelWrap.querySelectorAll('tr[data-idx]').forEach((tr) => {
      tr.addEventListener('click', () => tampilkanDetail(+tr.getAttribute('data-idx')));
    });
  };

  const tampilkanDetail = (idx) => {
    const entry = entries[idx];
    const b = ringkasan.baris[idx];
    if (!entry || !b) return;
    const req = entry.request || {};
    const res = entry.response || {};
    const headerHtml = (headers) => {
      if (!Array.isArray(headers) || !headers.length) return '<p class="hint">Tidak ada header.</p>';
      return '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12.5px;line-height:1.5"><tbody>' +
        headers.map((h) => '<tr style="border-bottom:1px solid var(--line)"><td style="padding:4px 8px;vertical-align:top;white-space:nowrap;color:var(--dim)">' + T.esc(h.name || '') + '</td><td style="padding:4px 8px;word-break:break-all">' + T.esc(String(h.value || '')) + '</td></tr>').join('') +
        '</tbody></table></div>';
    };
    const timings = entry.timings || {};
    const waktuHtml = Object.keys(timings).filter((k) => typeof timings[k] === 'number' && timings[k] >= 0).map((k) => kvBaris(k, fmtWaktu(timings[k]))).join('');
    T.show(detailBox,
      '<h3 style="font-size:15px;margin:0 0 8px;word-break:break-all">' + T.esc(b.metode) + ' ' + T.esc(b.url) + '</h3>' +
      kvBaris('Status', (b.status || 'tanpa respons') + (res.statusText ? ' ' + T.esc(res.statusText) : '')) +
      kvBaris('Waktu', fmtWaktu(b.waktu)) +
      kvBaris('Ukuran', fmtBytes(b.ukuran)) +
      kvBaris('Jenis isi', T.esc(b.mime || 'tidak diketahui')) +
      kvBaris('Kompresi', b.terkompres ? 'Ya (' + T.esc(headerDi(res.headers, 'content-encoding')) + ')' : 'Tidak') +
      (waktuHtml ? '<p class="hint" style="margin-top:10px">Rincian waktu:</p>' + waktuHtml : '') +
      '<p class="hint" style="margin-top:10px">Header request:</p>' + headerHtml(req.headers) +
      '<p class="hint" style="margin-top:10px">Header respons:</p>' + headerHtml(res.headers));
    const aksi = T.el('<div class="row" style="flex-wrap:wrap;margin-top:10px"></div>');
    aksi.appendChild(T.copyBtn(() => buatCurl(entry), 'Salin sebagai cURL'));
    detailBox.appendChild(aksi);
    detailBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const muat = (teks) => {
    let parsed;
    try {
      parsed = parseHar(teks);
    } catch (e) {
      T.show(box, errBox(e.message));
      tabelWrap.innerHTML = '';
      return;
    }
    entries = parsed;
    ringkasan = ringkasHar(entries);
    T.hide(detailBox);
    T.show(box,
      kvBaris('Total request', T.fmt(ringkasan.jumlah)) +
      kvBaris('Total waktu', fmtWaktu(ringkasan.totalWaktu)) +
      kvBaris('Total ukuran', fmtBytes(ringkasan.totalUkuran)) +
      kvBaris('Gagal', T.fmt(ringkasan.gagal)) +
      kvBaris('Lambat (>1 dtk)', T.fmt(ringkasan.lambat)) +
      kvBaris('Tidak terkompres (>10 KB)', T.fmt(ringkasan.takTerkompres)));
    gambarTabel();
  };

  filterSel.addEventListener('change', gambarTabel);

  fileI.addEventListener('change', async () => {
    const f = fileI.files && fileI.files[0];
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) { T.toast('Filenya terlalu besar (maksimal 20 MB)'); return; }
    muat(await f.text());
  });

  root.appendChild(T.el('<p class="hint">File HAR bisa diekspor dari tab Network di DevTools browser (klik kanan daftar request, lalu Save all as HAR). Di sini kamu bisa melihat semua request, mencari yang gagal atau lambat, dan menyalin salah satunya sebagai perintah cURL.</p>'));
  root.appendChild(T.field('Pilih file .har', fileI));
  root.appendChild(T.field('Atau tempel isi HAR', ta));
  root.appendChild(T.row(T.btn('Tampilkan', () => {
    if (!ta.value.trim()) { T.show(box, errBox('Tempel dulu isi file HAR-nya, atau pilih file .har di atas.')); return; }
    muat(ta.value);
  }, true)));
  root.appendChild(T.field('Filter', filterSel));
  root.appendChild(box);
  root.appendChild(tabelWrap);
  root.appendChild(detailBox);
  root.appendChild(T.el('<p class="hint" style="margin-top:12px">File HAR dibaca di browser saja, tidak diunggah ke mana-mana. Klik baris mana pun untuk melihat detail request itu.</p>'));
}
