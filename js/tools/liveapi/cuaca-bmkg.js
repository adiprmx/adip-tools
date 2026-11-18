import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id":"cuaca-bmkg","name":"Cuaca BMKG","cat":"liveapi","icon":"🌤️","desc":"Prakiraan cuaca resmi BMKG per desa dan kelurahan, 3 hari ke depan.","keywords":"cuaca,bmkg,prakiraan,hujan,cerah,suhu,desa,kelurahan","since":"6.16.0"};

const API = 'https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=';

/* Kode adm4 Kemendagri — masing-masing sudah dicek langsung ke API BMKG
   (18 Nov 2026) dan lokasi yang dikembalikan cocok dengan labelnya. */
const PRESET = [
  ['31.71.01.1001', 'Jakarta Pusat, Gambir'],
  ['31.74.07.1001', 'Jakarta Selatan, Kebayoran Baru'],
  ['31.75.01.1001', 'Jakarta Timur, Matraman'],
  ['32.73.09.1001', 'Bandung, Bandung Wetan'],
  ['35.78.07.1001', 'Surabaya, Genteng'],
  ['12.71.01.1001', 'Medan, Medan Kota'],
  ['33.74.01.1001', 'Semarang, Semarang Tengah'],
  ['34.71.10.1001', 'Yogyakarta, Gondomanan'],
  ['73.71.03.1001', 'Makassar, Makassar'],
  ['51.71.03.1005', 'Denpasar, Denpasar Barat'],
  ['16.71.01.1001', 'Palembang, Ilir Barat Dua'],
  ['35.07.01.2001', 'Malang (Kabupaten), Donomulyo'],
];

function tanggalId(iso) {
  const d = new Date(String(iso || '').replace(' ', 'T'));
  if (isNaN(d)) return String(iso || '');
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
}

function jamSingkat(iso) {
  const s = String(iso || '');
  const m = s.match(/(\d{2}):(\d{2})/);
  return m ? m[1] + '.' + m[2] : s;
}

export function render(root) {
  const box = T.out();
  const selWilayah = T.select(PRESET.concat([['manual', 'Kode wilayah lain (ketik manual)']]), PRESET[0][0]);
  const inpKode = T.input('text', 'Contoh: 31.71.01.1001');
  inpKode.setAttribute('autocomplete', 'off');
  const wadahKode = T.field('Kode wilayah (adm4)', inpKode, 'Kode 4 tingkat dari Kemendagri, contoh 31.71.01.1001. Cari kode desamu di situs wilayah.id.');
  wadahKode.style.display = 'none';

  selWilayah.addEventListener('change', () => {
    wadahKode.style.display = selWilayah.value === 'manual' ? '' : 'none';
  });

  const lihat = async () => {
    let kode = selWilayah.value;
    if (kode === 'manual') {
      kode = inpKode.value.trim();
      if (!/^\d{2}\.\d{2}\.\d{2}\.\d{4}$/.test(kode)) {
        T.show(box, errBox('Kode wilayah harus berformat seperti 31.71.01.1001: dua angka, titik, dua angka, titik, dua angka, titik, empat angka.'));
        return;
      }
    }
    T.show(box, '<p class="mut">Mengambil prakiraan cuaca dari BMKG…</p>');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      const r = await fetch(API + encodeURIComponent(kode), { signal: ctrl.signal });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      const d0 = j && Array.isArray(j.data) && j.data[0];
      if (!d0 || !d0.lokasi) throw new Error('bad-data');
      const lok = d0.lokasi;
      const hari = Array.isArray(d0.cuaca) ? d0.cuaca : [];
      const semuaJam = hari.flat().filter(Boolean);
      if (!semuaJam.length) {
        T.show(box, '<p class="center dim">BMKG belum punya prakiraan untuk wilayah ini.</p><p class="hint center">Coba wilayah lain atau cek lagi nanti.</p>');
        return;
      }
      let html = '<div class="center"><div style="font-weight:800;font-size:18px">' + esc([lok.desa, lok.kecamatan].filter(Boolean).join(', ') || '-') + '</div>' +
        '<div class="dim">' + esc([lok.kotkab, lok.provinsi].filter(Boolean).join(', ') || '') + '</div></div>';
      hari.forEach((daftar) => {
        if (!Array.isArray(daftar) || !daftar.length) return;
        const pertama = daftar[0];
        html += '<div style="font-weight:700;margin:14px 0 6px">' + esc(tanggalId(pertama.local_datetime || pertama.datetime)) + '</div>';
        daftar.forEach((c) => {
          html += '<div style="border:1px solid #2e2823;border-radius:10px;padding:8px 12px;margin-bottom:6px;display:flex;gap:10px;align-items:center">' +
            (c.image ? '<img src="' + esc(c.image) + '" alt="" loading="lazy" style="width:36px;height:36px;flex:none">' : '') +
            '<div style="flex:1;min-width:0"><div style="font-weight:700">' + esc(jamSingkat(c.local_datetime || c.datetime)) + ' · ' + esc(c.weather_desc || '-') + '</div>' +
            '<div class="dim" style="font-size:12.5px;margin-top:1px">' +
            (c.t != null ? esc(String(c.t)) + '°C' : '') +
            (c.hu != null ? ' · Lembap ' + esc(String(c.hu)) + '%' : '') +
            (c.ws != null ? ' · Angin ' + esc(String(c.ws)) + ' km/jam' + (c.wd ? ' ' + esc(c.wd) : '') : '') +
            (c.tp != null && parseFloat(c.tp) > 0 ? ' · Hujan ' + esc(String(c.tp)) + ' mm' : '') + '</div></div></div>';
        });
      });
      html += '<p class="hint">Sumber: BMKG, api.bmkg.go.id</p>';
      T.show(box, html);
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server BMKG tidak merespons dalam 20 detik.'
        : 'Gagal ambil prakiraan cuaca. Cek koneksi internet dan kode wilayah, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', lihat));
      box.appendChild(wr);
    } finally { clearTimeout(timer); }
  };

  root.appendChild(T.field('Wilayah', selWilayah));
  root.appendChild(wadahKode);
  root.appendChild(T.row(T.btn('🌤️ Lihat cuaca', lihat, true)));
  root.appendChild(box);
}
