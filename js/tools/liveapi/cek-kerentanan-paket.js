import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id":"cek-kerentanan-paket","name":"Cek Kerentanan Paket","cat":"liveapi","icon":"🛡️","desc":"Cek apakah versi paket software yang kamu pakai punya celah keamanan yang sudah diketahui.","keywords":"kerentanan,vulnerability,osv,cve,paket,npm,pypi,keamanan,cve","since":"6.16.0"};

const API = 'https://api.osv.dev/v1/query';

const EKOSISTEM = [
  ['npm', 'npm (JavaScript)'],
  ['PyPI', 'PyPI (Python)'],
  ['Go', 'Go'],
  ['Maven', 'Maven (Java)'],
  ['crates.io', 'crates.io (Rust)'],
  ['RubyGems', 'RubyGems (Ruby)'],
  ['Packagist', 'Packagist (PHP)'],
  ['NuGet', 'NuGet (.NET)'],
];

function versiPerbaiki(v) {
  const hasil = [];
  (v.affected || []).forEach((a) => {
    (a.ranges || []).forEach((rg) => {
      (rg.events || []).forEach((ev) => { if (ev.fixed) hasil.push(ev.fixed); });
    });
  });
  return [...new Set(hasil)];
}

function skorParah(v) {
  let skor = null;
  (v.severity || []).forEach((s) => {
    if (s && s.score && (s.type || '').indexOf('CVSS') === 0) {
      const n = parseFloat(s.score);
      if (!isNaN(n) && (skor === null || n > skor)) skor = n;
    }
  });
  return skor;
}

export function render(root) {
  const box = T.out();
  const selEco = T.select(EKOSISTEM, 'npm');
  const inpNama = T.input('text', 'Contoh: lodash, requests, serde');
  inpNama.setAttribute('autocomplete', 'off');
  const inpVersi = T.input('text', 'Contoh: 4.17.20 (boleh dikosongkan)');
  inpVersi.setAttribute('autocomplete', 'off');

  const cek = async () => {
    const nama = inpNama.value.trim();
    const versi = inpVersi.value.trim();
    const eco = selEco.value;
    if (!nama) { T.show(box, errBox('Tulis nama paket dulu.')); return; }
    T.show(box, '<p class="mut">Mengecek ' + esc(nama) + ' di database OSV…</p>');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      const body = { package: { name: nama, ecosystem: eco } };
      if (versi) body.version = versi;
      const r = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      const vulns = Array.isArray(j.vulns) ? j.vulns : [];
      if (!vulns.length) {
        T.show(box, '<p class="center" style="font-size:18px">✅ <b>Tidak ada masalah keamanan yang diketahui</b></p>' +
          '<p class="center dim">Untuk ' + esc(nama) + (versi ? ' versi ' + esc(versi) : '') + ' di ' + esc(selEco.options[selEco.selectedIndex].textContent) + ', database OSV tidak mencatat celah apa pun. Bukan jaminan 100% aman, tapi sejauh ini belum ada laporan.</p>');
        return;
      }
      let html = '<p class="center" style="font-size:16px">⚠️ <b>Ditemukan ' + vulns.length + ' masalah keamanan</b></p>' +
        '<p class="hint center">Perbarui ke versi yang sudah diperbaiki bila tersedia.</p>';
      vulns.forEach((v) => {
        const skor = skorParah(v);
        const perbaiki = versiPerbaiki(v);
        const ringkas = v.summary || v.details || v.id;
        html += '<div style="border:1px solid #2e2823;border-radius:10px;padding:10px 12px;margin-bottom:8px">' +
          '<div style="font-weight:700"><a href="https://osv.dev/vulnerability/' + esc(v.id) + '" target="_blank" rel="noopener">' + esc(v.id) + '</a>' +
          (skor !== null ? ' <span style="color:#ef4444">· skor ' + esc(String(skor)) + '/10</span>' : '') + '</div>' +
          '<div style="font-size:13.5px;line-height:1.5;margin-top:4px">' + esc(String(ringkas).slice(0, 500)) + '</div>' +
          (perbaiki.length ? '<div class="dim" style="font-size:12.5px;margin-top:6px">Sudah diperbaiki di versi: ' + esc(perbaiki.join(', ')) + '</div>' : '') +
          '</div>';
      });
      html += '<p class="hint">Sumber: OSV, database celah keamanan open source.</p>';
      T.show(box, html);
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server OSV tidak merespons dalam 20 detik.'
        : 'Gagal mengecek paket. Cek koneksi internet dan ejaan nama paket, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cek));
      box.appendChild(wr);
    } finally { clearTimeout(timer); }
  };

  const enter = (e) => { if (e.key === 'Enter') cek(); };
  inpNama.addEventListener('keydown', enter);
  inpVersi.addEventListener('keydown', enter);
  root.appendChild(T.field('Jenis paket', selEco));
  root.appendChild(T.field('Nama paket', inpNama, 'Nama persis seperti di repositori paketnya.'));
  root.appendChild(T.field('Versi (opsional)', inpVersi, 'Kosongkan untuk melihat semua celah yang pernah tercatat.'));
  root.appendChild(T.row(T.btn('🔍 Cek sekarang', cek, true)));
  root.appendChild(box);
}
