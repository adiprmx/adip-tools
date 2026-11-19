import { h as T, esc, errBox } from '../../core.js';

// Cari uji klinis medis di seluruh dunia, lewat ClinicalTrials.gov, tanpa key.
// Terverifikasi 19 Nov 2026: /api/v2/studies?query.cond=cancer&pageSize=1
// -> JSON hidup (studi NCT00083720). Endpoint sama, parameter query.cond
// diisi kata kunci pengguna dan pageSize=5.
export const meta = {"id":"uji-klinis","name":"Uji Klinis","cat":"liveapi","icon":"🔬","desc":"Cari uji klinis medis di seluruh dunia berdasarkan penyakit atau obat.","keywords":"uji klinis,clinical trial,penelitian medis,obat,penyakit,kanker","since":"6.19.0"};

const STATUS = {
  RECRUITING: 'Merekrut peserta',
  NOT_YET_RECRUITING: 'Belum merekrut',
  ACTIVE_NOT_RECRUITING: 'Berjalan, tidak merekrut',
  COMPLETED: 'Selesai',
  TERMINATED: 'Dihentikan',
  WITHDRAWN: 'Dibatalkan',
  SUSPENDED: 'Ditunda',
  UNKNOWN: 'Tidak diketahui',
};

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 20000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

const potong = (s, n) => s.length > n ? s.slice(0, n).trimEnd() + '…' : s;

export function render(root) {
  const inp = T.input('text', 'Penyakit atau obat dalam bahasa Inggris, mis. diabetes…', '');
  const box = T.out();

  const cari = async () => {
    const q = (inp.value || '').trim();
    if (!q) {
      T.show(box, errBox('Ketik dulu penyakit atau obat yang dicari, dalam bahasa Inggris.'));
      return;
    }
    T.show(box, '<p class="mut">Mencari uji klinis…</p>');
    try {
      const j = await getJSON('https://clinicaltrials.gov/api/v2/studies?query.cond=' + encodeURIComponent(q) + '&pageSize=5');
      const daftar = j && Array.isArray(j.studies) ? j.studies : [];
      if (!daftar.length) {
        T.show(box, '<p>Tidak ada uji klinis yang cocok dengan “' + esc(q) + '”. Coba kata kunci lain dalam bahasa Inggris.</p>');
        return;
      }
      let html = '<p class="hint">Menampilkan ' + daftar.length + ' hasil untuk “' + esc(q) + '”.</p>';
      daftar.forEach((s) => {
        const p = (s && s.protocolSection) || {};
        const id = (p.identificationModule) || {};
        const st = (p.statusModule) || {};
        const sponsor = ((p.sponsorCollaboratorsModule || {}).leadSponsor || {}).name;
        const fase = ((p.designModule || {}).phases || []).join(', ');
        const ringkas = ((p.descriptionModule || {}).briefSummary) || '';
        const nct = id.nctId || '';
        html += '<div style="border-top:1px solid var(--line,#e5e5e5);padding:10px 0">' +
          '<p style="font-weight:600;line-height:1.5;margin:0 0 4px">' + esc(id.briefTitle || 'Tanpa judul') + '</p>' +
          '<p class="hint" style="margin:0 0 4px">' + (nct ? esc(nct) + ' · ' : '') + esc(STATUS[st.overallStatus] || st.overallStatus || 'Status tidak diketahui') +
          (fase ? ' · ' + esc(fase) : '') + (sponsor ? ' · ' + esc(sponsor) : '') + '</p>' +
          (ringkas ? '<p style="line-height:1.6;font-size:13.5px;margin:0 0 4px">' + esc(potong(ringkas, 300)) + '</p>' : '') +
          (nct ? '<p style="margin:0"><a href="https://clinicaltrials.gov/study/' + esc(nct) + '" target="_blank" rel="noopener" style="font-size:12.5px">Lihat detail di ClinicalTrials.gov</a></p>' : '') +
          '</div>';
      });
      html += '<p class="hint">Sumber: ClinicalTrials.gov.</p>';
      T.show(box, html);
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server tidak merespons dalam 20 detik.'
        : 'Gagal mencari uji klinis. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wr);
    }
  };

  root.appendChild(T.el('<p class="note">Ketik penyakit atau obat dalam bahasa Inggris, lalu ketuk Cari. Hasilnya uji klinis dari seluruh dunia.</p>'));
  root.appendChild(T.el('<p class="note">Informasi ini hanya untuk dibaca, bukan saran medis. Tanya dokter untuk keputusan soal pengobatan.</p>'));
  root.appendChild(T.field('Penyakit atau obat', inp));
  root.appendChild(T.row(T.btn('🔍 Cari', cari, true)));
  root.appendChild(box);
}
