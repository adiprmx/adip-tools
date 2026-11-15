import { h as T, utils, kv } from '../../core.js?v=6.12.0';

const parseRp = (s) => { s = String(s||'').trim().replace(/\s/g,''); if (!s) return NaN; if (s.includes(',')) return Number(s.replace(/\./g,'').replace(',','.')); if (/^\d{1,3}(\.\d{3})+$/.test(s)) return Number(s.replace(/\./g,'')); return Number(s); };

const JENIS = {
  'super': { label: 'KUR Super Mikro', maks: 10000000, bunga: 3, ket: 'Plafon s.d. Rp10 jt · bunga 3%/tahun' },
  'mikro': { label: 'KUR Mikro', maks: 100000000, bunga: 6, ket: 'Plafon Rp10–100 jt · bunga 6%/tahun' },
  'kecil': { label: 'KUR Kecil', maks: 500000000, bunga: 6, ket: 'Plafon Rp100–500 jt · bunga 6%/tahun' },
};

export const meta = {"id": "simulasi-kur", "name": "Simulasi Cicilan KUR", "cat": "bisnis", "icon": "🏦", "desc": "Hitung cicilan KUR per bulan dari plafon, jenis KUR, dan tenor — sebelum ke bank.", "keywords": "kur,cicilan,kredit usaha rakyat,bunga,anuitas,simulasi,plafon"};
export function render(root) {

    const jenisI = T.select([['super','KUR Super Mikro (s.d. Rp10 jt)'],['mikro','KUR Mikro (Rp10–100 jt)'],['kecil','KUR Kecil (Rp100–500 jt)']], 'mikro');
    const plafonI = T.input('text', 'cth: 50.000.000', '');
    const bungaI = T.input('text', 'cth: 6', '6');
    const tenorI = T.input('number', 'cth: 12', '12');
    const ketI = T.el('<p class="hint"></p>');
    const box = T.out();

    const isiJenis = () => {
      const j = JENIS[jenisI.value];
      bungaI.value = String(j.bunga);
      ketI.textContent = j.ket + ' · tanpa agunan tambahan s.d. Rp100 jt.';
    };
    jenisI.addEventListener('change', isiJenis);
    isiJenis();

    const calc = () => {
      const P = parseRp(plafonI.value);
      const b = parseRp(bungaI.value);
      const n = Math.round(parseRp(tenorI.value));
      if (!isFinite(P) || P <= 0 || !isFinite(b) || b < 0 || b >= 100 || !isFinite(n) || n < 1 || n > 120) {
        T.toast('Isi plafon, bunga, dan tenor dengan benar ya (tenor maks 120 bulan).'); return;
      }
      const j = JENIS[jenisI.value];
      const r = b / 100 / 12;
      const cicilan = r > 0 ? (P * r) / (1 - Math.pow(1 + r, -n)) : P / n;
      const totalBayar = cicilan * n;
      const totalBunga = totalBayar - P;

      let rows = '';
      let sisa = P;
      for (let i = 1; i <= n; i++) {
        const bungaBln = sisa * r;
        let pokokBln = cicilan - bungaBln;
        if (i === n) pokokBln = sisa;
        sisa = Math.max(0, sisa - pokokBln);
        rows += '<tr><td>' + i + '</td><td>' + T.rp(cicilan) + '</td><td>' + T.rp(pokokBln) + '</td><td>' + T.rp(bungaBln) + '</td><td>' + T.rp(sisa) + '</td></tr>';
      }

      let warn = '';
      if (P > j.maks) {
        warn = '<p class="warn">⚠️ Plafon melebihi batas ' + j.label + ' (' + T.rp(j.maks) + '). Pilih jenis KUR yang plafonnya lebih besar, atau kecilkan plafonnya.</p>';
      }

      T.show(box,
        '<div class="big center">' + T.rp(cicilan) + ' <span class="mut" style="font-size:15px">/ bulan</span></div>' +
        '<p class="center">cicilan ' + j.label + ' · ' + n + ' bulan</p>' +
        warn +
        kv('Total yang dibayar', T.rp(totalBayar)) +
        kv('Total bunga', T.rp(totalBunga)) +
        kv('Pokok pinjaman', T.rp(P)) +
        '<div style="overflow-x:auto"><table class="tbl"><tr><th>Bulan</th><th>Cicilan</th><th>Pokok</th><th>Bunga</th><th>Sisa</th></tr>' + rows + '</table></div>' +
        '<p class="hint">Bunga dihitung menurun (efektif): porsi bunga menyusut tiap bulan, porsi pokok membesar — bukan bunga flat. Aturan per 12 Nov 2026 (Permenko 1/2026, berlaku 13 Jan 2026). Angka akhir tetap mengikuti bank penyalur — bunga di atas bisa diubah.</p>');
    };

    root.appendChild(T.el('<p class="note">KUR adalah kredit usaha dengan bunga subsidi pemerintah. Pilih jenisnya, isi plafon dan tenor, langsung ketahuan cicilannya.</p>'));
    root.appendChild(T.field('Jenis KUR', jenisI));
    root.appendChild(ketI);
    root.appendChild(T.field('Plafon pinjaman (Rp)', plafonI, 'Jumlah yang mau dipinjam.'));
    root.appendChild(T.grid2(
      T.field('Bunga (%/tahun)', bungaI, 'Otomatis sesuai jenis KUR, bisa diubah.'),
      T.field('Tenor (bulan)', tenorI, 'Berapa lama mau mencicil.')
    ));
    root.appendChild(T.row(T.btn('Hitung Cicilan', calc, true)));
    root.appendChild(box);

}
