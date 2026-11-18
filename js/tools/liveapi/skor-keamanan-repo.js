import { h as T, esc, errBox } from '../../core.js';

// Skor keamanan repo open-source lewat OpenSSF Scorecard, tanpa key.
// Terverifikasi 17 Nov 2026: /projects/github.com/lodash/lodash -> 200, CORS *.
// Skor 0 sampai 10. Semakin tinggi, semakin baik praktik keamanannya.
// Skor -1 pada satu pemeriksaan berarti pemeriksaan itu tidak bisa dinilai.
export const meta = {"id":"skor-keamanan-repo","name":"Skor Keamanan Repo","cat":"liveapi","icon":"🛡️","desc":"Nilai keamanan rantai pasok repo GitHub: skor 0 sampai 10 beserta penjelasan tiap pemeriksaannya.","keywords":"scorecard,openssf,keamanan repo,github,security score,supply chain,rantai pasok","since":"6.17.0"};

const ARTI = {
  'Binary-Artifacts': 'Tidak ada file hasil kompilasi yang tersimpan di repo',
  'Branch-Protection': 'Cabang utama dilindungi dari perubahan sembarangan',
  'CI-Tests': 'Ada tes otomatis yang jalan tiap perubahan',
  'CII-Best-Practices': 'Mengikuti panduan praktik baik CII',
  'Code-Review': 'Perubahan kode diperiksa orang lain dulu',
  Contributors: 'Banyak orang ikut merawat proyek ini',
  'Dangerous-Workflow': 'Alur otomatis tidak punya pola berbahaya',
  'Dependency-Update-Tool': 'Ada alat yang memperbarui dependensi otomatis',
  Fuzzing: 'Kode diuji dengan masukan acak untuk mencari bug',
  License: 'Ada lisensi yang jelas',
  Maintained: 'Proyek masih aktif dirawat',
  'Pinned-Dependencies': 'Dependensi dikunci ke versi tertentu',
  SAST: 'Kode dipindai otomatis untuk mencari celah',
  SBOM: 'Ada daftar isi perangkat lunak (SBOM)',
  'Security-Policy': 'Ada cara resmi melaporkan celah keamanan',
  'Signed-Releases': 'Rilis ditandatangani agar tidak bisa dipalsukan',
  'Token-Permissions': 'Izin token alur otomatis dibatasi seminimal mungkin',
  Vulnerabilities: 'Tidak ada celah keamanan yang belum diperbaiki',
};

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (r.status === 404) throw new Error('not-found');
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: lodash/lodash atau facebook/react');
  inp.setAttribute('autocomplete', 'off');
  inp.setAttribute('autocapitalize', 'off');

  const cari = async () => {
    const q = String(inp.value || '').trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
    if (!q || q.split('/').length !== 2) {
      T.show(box, errBox('Tulis alamat repo dengan format pemilik/nama, contoh: lodash/lodash'));
      return;
    }
    T.show(box, '<p class="mut">Mengambil skor keamanan ' + esc(q) + '…</p>');
    try {
      // Kodekan pemilik dan nama repo TERPISAH — mengkodekan "pemilik/nama"
      // sekaligus mengubah "/" jadi "%2F" dan API menjawab 404 (QA-G2 §5e).
      const [pemilik, namaRepo] = q.split('/');
      const j = await getJSON('https://api.securityscorecards.dev/projects/github.com/' + encodeURIComponent(pemilik) + '/' + encodeURIComponent(namaRepo));
      // Bentuk respons API (terverifikasi live 19 Nov 2026): skor + checks
      // ada di TINGKAT ATAS (j.score, j.checks); j.scorecard hanya berisi
      // {commit, version} — tanpa aggregateScore. Fallback ke bentuk
      // bersarang lama dipertahankan bila API berubah lagi.
      const skor = typeof j.score === 'number' ? j.score : (j.scorecard && j.scorecard.aggregateScore);
      if (typeof skor !== 'number') throw new Error('bad-data');
      const nilai = skor >= 7 ? 'Baik' : skor >= 4 ? 'Sedang' : 'Rendah';
      const cek = ((j.checks || (j.scorecard && j.scorecard.checks)) || []).slice().sort((a, b) => (b.score || 0) - (a.score || 0));
      T.show(box,
        '<div class="center"><div class="dim">Skor keamanan ' + esc(q) + '</div>' +
        '<div style="font-weight:800;font-size:34px;margin:4px 0">' + esc(skor.toFixed(1)) + ' <span style="font-size:16px;color:#c9bda9">dari 10</span></div>' +
        '<div class="dim" style="font-size:13px">Penilaian: ' + esc(nilai) + '. Skor dihitung OpenSSF dari 18 pemeriksaan praktik keamanan.</div></div>' +
        '<div style="margin-top:12px">' + cek.map((c) => {
          const s = Number(c.score);
          const label = s < 0 ? 'Tidak bisa dinilai' : s + ' / 10';
          return '<div class="kv"><span class="k"><b>' + esc(c.name || '') + '</b><br><span class="hint">' +
            esc(ARTI[c.name] || (c.reason ? String(c.reason).slice(0, 120) : '')) + '</span></span>' +
            '<span class="v">' + esc(label) + '</span></div>';
        }).join('') + '</div>' +
        '<p class="hint">Sumber: OpenSSF Scorecard. Skor ini menilai praktik keamanan rantai pasok, bukan berarti kode bebas bug. Repo yang belum pernah dinilai tidak akan muncul di sini.</p>');
    } catch (e) {
      if (e.message === 'not-found') {
        T.show(box, '<p class="center dim">Repo tidak ditemukan di Scorecard. Mungkin repo belum pernah dinilai, atau alamatnya salah.</p>');
        return;
      }
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server Scorecard tidak merespons dalam 15 detik.'
        : 'Gagal mengambil skor. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wr);
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Tulis alamat repo GitHub untuk melihat skor keamanannya dari 0 sampai 10. Semakin tinggi skornya, semakin baik praktik keamanan repo itu.</p>'));
  root.appendChild(T.field('Alamat repo', inp, 'Format: pemilik/nama, contoh: lodash/lodash'));
  root.appendChild(T.row(T.btn('🔍 Cek skor', cari, true)));
  root.appendChild(box);
}
