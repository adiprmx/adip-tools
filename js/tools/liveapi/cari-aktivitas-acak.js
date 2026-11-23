import { h as T, esc, errBox } from '../../core.js';

// Ide kegiatan acak lewat Bored API (tanpa key).
// Terverifikasi 18 Nov 2026: www.boredapi.com/api/activity 200, CORS *.
const API = 'https://www.boredapi.com/api/activity';

const TIPE = [
  ['', 'Acak saja'], ['education', 'Belajar'], ['recreational', 'Rekreasi'],
  ['social', 'Bersama orang lain'], ['diy', 'Buat sendiri (DIY)'], ['charity', 'Berbagi'],
  ['cooking', 'Masak'], ['relaxation', 'Santai'], ['music', 'Musik'], ['busywork', 'Sibuk-sibuk'],
];

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

function labelBiaya(p) {
  const n = Number(p);
  if (!isFinite(n)) return '';
  if (n === 0) return 'Gratis';
  if (n <= 0.3) return 'Murah';
  if (n <= 0.7) return 'Biaya sedang';
  return 'Biaya besar';
}

const tautanAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

export const meta = {"id": "cari-aktivitas-acak", "name": "Cari Aktivitas Acak", "cat": "liveapi", "icon": "🎲", "desc": "Bingung mau ngapain? Dapat ide kegiatan acak, bisa difilter jenis dan jumlah orang.", "keywords": "aktivitas,acak,bosan,ide,kegiatan,bored,hiburan,ngapain", "since": "6.17.0", "online": true};

export function render(root) {
  const box = T.out();
  const tipeS = T.select(TIPE, '');
  const orangI = T.input('number', 'Jumlah orang, contoh: 2 (boleh kosong)');

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', cari));
    box.appendChild(w);
  };

  const cari = async () => {
    const jml = String(orangI.value || '').trim();
    if (jml && (!/^\d+$/.test(jml) || +jml < 1 || +jml > 8)) {
      T.show(box, errBox('Jumlah orang diisi angka 1 sampai 8, atau dikosongkan saja.'));
      return;
    }
    T.show(box, '<p class="mut">Mencari ide kegiatan…</p>');
    try {
      let url = API + '?';
      if (tipeS.value) url += 'type=' + encodeURIComponent(tipeS.value) + '&';
      if (jml) url += 'participants=' + encodeURIComponent(jml);
      const j = await getJSON(url);
      if (!j || !j.activity) {
        T.show(box, '<p class="center dim">Tidak ada ide untuk kombinasi itu. Coba ubah jenis atau jumlah orangnya.</p>');
        return;
      }
      const tipeNama = (TIPE.find((t) => t[0] === j.type) || [])[1] || String(j.type || '');
      T.show(box, '<div class="center"><div style="font-weight:800;font-size:17px;line-height:1.4">' + esc(String(j.activity)) + '</div>' +
        '<div class="dim" style="font-size:12.5px;margin-top:8px">' +
        (tipeNama ? 'Jenis: ' + esc(tipeNama) : '') +
        (j.participants != null ? ' · ' + (Number(j.participants) || 0) + ' orang' : '') +
        (j.price != null ? ' · ' + esc(labelBiaya(j.price)) : '') + '</div>' +
        (tautanAman(j.link) ? '<div style="margin-top:8px"><a href="' + esc(j.link) + '" target="_blank" rel="noopener">Buka tautan terkait</a></div>' : '') +
        '</div><p class="hint">Ide ditampilkan dalam bahasa Inggris apa adanya dari Bored API. Tekan tombol di bawah untuk ide lain.</p>');
      const w = T.el('<div class="center" style="margin-top:10px"></div>');
      w.appendChild(T.btn('Cari ide lain', cari, true));
      box.appendChild(w);
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server ide tidak bisa dihubungi dalam 15 detik.'
        : 'Ide gagal diambil. Cek koneksi internet, lalu coba lagi.');
    }
  };

  root.appendChild(T.el('<p class="note">Bosan dan bingung mau ngapain? Tool ini memberi satu ide kegiatan acak setiap kali ditekan.</p>'));
  root.appendChild(T.field('Jenis kegiatan', tipeS));
  root.appendChild(T.field('Jumlah orang (opsional)', orangI, 'Kosongkan kalau untuk sendiri atau berapa pun'));
  root.appendChild(T.row(T.btn('Cari ide', cari, true)));
  root.appendChild(box);
}
