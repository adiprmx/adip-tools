import { h as T, esc, errBox } from '../../core.js';

// Pemenang Hadiah Nobel lewat API resmi Nobel Prize, tanpa key.
// Terverifikasi 17 Nov 2026: /2.1/nobelPrizes?nobelPrizeYear=2024&limit=1 -> 200, CORS *.
export const meta = {"id":"pemenang-nobel","name":"Pemenang Nobel","cat":"liveapi","icon":"🏅","desc":"Lihat siapa saja pemenang Hadiah Nobel di tahun yang kamu pilih.","keywords":"nobel,hadiah nobel,pemenang nobel,fisika,kimia,sastra,perdamaian","since":"6.17.0"};

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

const KATEGORI = {
  physics: 'Fisika', chemistry: 'Kimia', 'physiology or medicine': 'Kedokteran',
  literature: 'Sastra', peace: 'Perdamaian', 'economic sciences': 'Ekonomi',
};

export function render(root) {
  const box = T.out();
  const tahunIni = new Date().getFullYear();
  const inp = T.input('number', 'Contoh: 2024', String(tahunIni - 1));
  inp.setAttribute('min', '1901');
  inp.setAttribute('max', String(tahunIni));

  const cari = async () => {
    const thn = Number(inp.value);
    if (!Number.isInteger(thn) || thn < 1901 || thn > tahunIni) {
      T.show(box, errBox('Tulis tahun antara 1901 dan ' + tahunIni + '.'));
      return;
    }
    T.show(box, '<p class="mut">Mengambil pemenang Nobel tahun ' + thn + '…</p>');
    try {
      const j = await getJSON('https://api.nobelprize.org/2.1/nobelPrizes?nobelPrizeYear=' + thn + '&limit=20');
      const list = (j && j.nobelPrizes) || [];
      if (!list.length) {
        T.show(box, '<p class="center dim">Tidak ada hadiah Nobel yang diberikan pada tahun itu.</p>');
        return;
      }
      T.show(box, '<p class="hint">Hadiah Nobel ' + thn + '</p>' + list.map((p) => {
        const katEn = (p.category && p.category.en) || '';
        const kat = KATEGORI[katEn.toLowerCase()] || katEn;
        const pemenang = p.laureates || [];
        return '<div style="border-top:1px solid #ffffff14;padding:12px 0">' +
          '<div style="font-weight:700;font-size:15px">' + esc(kat) + '</div>' +
          pemenang.map((l) => {
            const nama = (l.fullName && l.fullName.en) || (l.knownName && l.knownName.en) || 'Tanpa nama';
            const alasan = l.motivation && l.motivation.en;
            return '<div style="margin-top:8px"><b>' + esc(nama) + '</b>' +
              (alasan ? '<p class="hint" style="margin-top:2px">' + esc(alasan) + '</p>' : '') + '</div>';
          }).join('') + '</div>';
      }).join('') + '<p class="hint">Sumber: nobelprize.org, situs resmi Hadiah Nobel. Alasan pemberian hadiah tampil dalam bahasa Inggris apa adanya.</p>');
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server Nobel tidak merespons dalam 15 detik.'
        : 'Gagal mengambil daftar pemenang. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wr);
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Pilih tahun untuk melihat pemenang Hadiah Nobel beserta bidang dan alasannya.</p>'));
  root.appendChild(T.field('Tahun', inp, 'Hadiah Nobel pertama diberikan tahun 1901'));
  root.appendChild(T.row(T.btn('🔍 Lihat pemenang', cari, true)));
  root.appendChild(box);
}
