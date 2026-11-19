import { h as T, utils, kv } from '../../core.js';

export const meta = {"id": "kalkulator-mirr", "name": "Kalkulator MIRR", "cat": "bisnis", "icon": "🔄", "desc": "Tingkat hasil proyek dengan asumsi realistis: uang masuk diinvestasikan lagi, uang keluar dibiayai pinjaman.", "keywords": "mirr,irr,investasi,arus kas,proyek,reinvestasi,tingkat hasil,balik modal", "since": "6.19.0"};

const nol = (x) => (x === 0 ? 0 : x);
const fmtP = (x, d) => nol(x).toFixed(d == null ? 2 : d).replace('.', ',') + '%';

/* Parse arus kas: satu angka per baris (atau dipisah koma/titik-koma).
   Balikan {nilai: number[]|null, salah: string|null}. */
export function parseArusKasMirr(teks) {
  const nilai = [];
  const baris = String(teks == null ? '' : teks).replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  for (const b of baris) {
    const potong = b.split(/[\t;]+|,(?=\s|\d[\d.]*\.)/);
    for (let tok of potong) {
      tok = tok.trim();
      if (!tok) continue;
      if (/\s/.test(tok)) {
        for (const sub of tok.split(/\s+/)) {
          if (!sub) continue;
          const v = T.num(sub);
          if (!isFinite(v)) return { nilai: null, salah: sub };
          nilai.push(v);
        }
      } else {
        const v = T.num(tok);
        if (!isFinite(v)) return { nilai: null, salah: tok };
        nilai.push(v);
      }
    }
  }
  return { nilai, salah: null };
}

/* MIRR = (nilai akhir arus masuk dengan bunga reinvestasi / nilai sekarang
   arus keluar dengan bunga pinjaman) ^ (1/n) - 1. arusKas[0] = tahun ke-0.
   bunga dalam desimal (0,10 = 10%). Null bila tidak ada arus masuk atau
   tidak ada arus keluar. */
export function hitungMirr(arusKas, bungaPinjam, bungaReinvest) {
  if (!Array.isArray(arusKas) || arusKas.length < 2) return null;
  const fin = Number(bungaPinjam), rei = Number(bungaReinvest);
  if (![fin, rei].every(isFinite) || fin <= -1 || rei <= -1) return null;
  const n = arusKas.length - 1;
  let fv = 0, pv = 0;
  for (let t = 0; t < arusKas.length; t++) {
    const c = Number(arusKas[t]);
    if (!isFinite(c)) return null;
    if (c > 0) fv += c * Math.pow(1 + rei, n - t);
    else if (c < 0) pv += c / Math.pow(1 + fin, t);
  }
  if (fv <= 0 || pv >= 0) return null;
  const m = Math.pow(fv / -pv, 1 / n) - 1;
  return Number.isFinite(m) ? m : null;
}
utils.mirr = hitungMirr;

export function render(root) {
  const cfI = T.ta(5, 'Satu baris per tahun, mulai tahun ke-0 (investasi awal negatif):\n-100000000\n30000000\n40000000\n50000000');
  const finI = T.input('text', 'cth: 10', '10');
  const reiI = T.input('text', 'cth: 12', '12');
  const box = T.out();

  const hitung = () => {
    const hasil = parseArusKasMirr(cfI.value);
    if (hasil.salah != null) { T.show(box, '<div class="err">Baris "' + T.esc(hasil.salah.slice(0, 20)) + '" bukan angka. Perbaiki dulu.</div>'); return; }
    if (hasil.nilai.length < 2) { T.show(box, '<div class="err">Isi minimal dua baris: investasi awal dan satu tahun arus kas.</div>'); return; }
    if (hasil.nilai.length > 30) { T.show(box, '<div class="err">Maksimal 30 tahun ya.</div>'); return; }
    const fin = T.num(finI.value);
    const rei = T.num(reiI.value);
    if (!isFinite(fin) || fin < 0 || fin >= 100) { T.show(box, '<div class="err">Isi bunga pinjaman antara 0 sampai di bawah 100 persen.</div>'); return; }
    if (!isFinite(rei) || rei < 0 || rei >= 100) { T.show(box, '<div class="err">Isi bunga reinvestasi antara 0 sampai di bawah 100 persen.</div>'); return; }
    const mirr = hitungMirr(hasil.nilai, fin / 100, rei / 100);
    if (mirr === null) { T.show(box, '<div class="err">MIRR tidak bisa dihitung: arus kas harus ada yang negatif (uang keluar) dan ada yang positif (uang masuk).</div>'); return; }
    const totalMasuk = hasil.nilai.filter((c) => c > 0).reduce((a, b) => a + b, 0);
    const totalKeluar = hasil.nilai.filter((c) => c < 0).reduce((a, b) => a + b, 0);
    const vonis = mirr > fin / 100
      ? 'MIRR di atas bunga pinjaman: proyek ini menghasilkan lebih dari biaya dananya.'
      : 'MIRR di bawah bunga pinjaman: proyek ini tidak menghasilkan cukup untuk menutup biaya dananya.';
    T.show(box,
      '<div class="big center">' + fmtP(mirr * 100) + '</div>' +
      '<p class="center">MIRR per tahun</p>' +
      kv('Total uang keluar', T.rp(totalKeluar)) +
      kv('Total uang masuk', T.rp(totalMasuk)) +
      kv('Bunga pinjaman', fmtP(fin)) +
      kv('Bunga reinvestasi', fmtP(rei)) +
      kv('Lama proyek', (hasil.nilai.length - 1) + ' tahun') +
      '<p class="' + (mirr > fin / 100 ? 'info' : 'err') + '">' + vonis + '</p>' +
      '<p class="hint">MIRR memperbaiki IRR biasa: IRR menganggap uang yang masuk bisa diinvestasikan lagi dengan hasil setinggi IRR itu sendiri, padahal itu sering tidak realistis. MIRR memakai bunga reinvestasi yang kamu isi sendiri. Ini hitungan bantu putuskan, bukan jaminan hasil.</p>');
  };

  root.appendChild(T.el('<p class="note">MIRR mengukur tingkat hasil proyek dengan asumsi yang lebih masuk akal dari IRR: uang yang masuk diinvestasikan lagi dengan bunga yang kamu tentukan, dan uang yang keluar dibiayai dengan bunga pinjaman.</p>'));
  root.appendChild(T.field('Arus kas per tahun (Rp)', cfI, 'Baris pertama tahun ke-0, biasanya negatif karena itu investasi awal. Baris berikutnya tahun ke-1, ke-2, dan seterusnya.'));
  root.appendChild(T.field('Bunga pinjaman (% per tahun)', finI, 'Biaya dana untuk membiayai proyek. Default 10%.'));
  root.appendChild(T.field('Bunga reinvestasi (% per tahun)', reiI, 'Hasil yang bisa didapat bila uang masuk diinvestasikan lagi. Default 12%.'));
  root.appendChild(T.row(T.btn('Hitung MIRR', hitung, true)));
  root.appendChild(box);
}
