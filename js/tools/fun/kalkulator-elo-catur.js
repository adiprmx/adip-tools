import { h as T, utils } from '../../core.js';

// Kalkulator Rating Elo Catur (sistem FIDE): skor harapan
// E = 1 / (1 + 10^((R_lawan - R_kamu)/400)), rating baru
// R' = R + K x (hasil - E). Faktor K FIDE: 40 untuk pemain baru
// (sampai 30 partai), 20 untuk rating di bawah 2400, 10 untuk rating
// 2400 ke atas. Mode turnamen: total perubahan dari daftar lawan +
// rating performa (pendekatan linier, dilabeli perkiraan).
export const meta = {"id": "kalkulator-elo-catur", "name": "Kalkulator Rating Elo Catur", "cat": "fun", "icon": "♟️", "desc": "Hitung perubahan rating Elo setelah main catur: satu partai atau satu turnamen, plus rating performamu.", "keywords": "elo,catur,rating,fide,peringkat,turnamen,skor,rating performa", "since": "6.19.0"};

// Skor harapan (0-1) melawan lawan. Murni.
export function skorHarapan(ratingKamu, ratingLawan) {
  return 1 / (1 + Math.pow(10, (ratingLawan - ratingKamu) / 400));
}

// Faktor K FIDE. Murni.
export function faktorK(rating, jumlahPartai) {
  if (jumlahPartai != null && jumlahPartai < 30) return 40;
  if (rating >= 2400) return 10;
  return 20;
}

// Rating baru setelah satu partai. hasil: 1 menang, 0,5 seri, 0 kalah.
export function ratingBaru(ratingKamu, ratingLawan, hasil, k) {
  const e = skorHarapan(ratingKamu, ratingLawan);
  return ratingKamu + k * (hasil - e);
}

// Rating performa, pendekatan linier: rata-rata lawan +
// 400 x (menang - kalah) / jumlah partai. Murni.
export function ratingPerforma(lawan, hasil) {
  if (!lawan.length || lawan.length !== hasil.length) return NaN;
  const rata = lawan.reduce((s, x) => s + x, 0) / lawan.length;
  const menang = hasil.filter((h) => h === 1).length;
  const kalah = hasil.filter((h) => h === 0).length;
  return rata + (400 * (menang - kalah)) / lawan.length;
}

function fmtPerubahan(n) {
  const r = Math.round(n * 10) / 10;
  const bersih = Object.is(r, -0) ? 0 : r;
  if (bersih === 0) return '0';
  return (bersih > 0 ? '+' : '') + utils.r4(bersih);
}

export function render(root) {
  const box = T.out();
  const modeS = T.select([['satu', 'Satu partai'], ['turnamen', 'Satu turnamen']], 'satu');
  const ratingI = T.input('number', 'cth: 1500');
  const lawanI = T.input('number', 'cth: 1600');
  const hasilS = T.select([['1', 'Menang'], ['0.5', 'Seri'], ['0', 'Kalah']], '1');
  const partaiI = T.input('number', 'cth: 45 (boleh kosong)');
  const kI = T.input('number', 'cth: 20 (boleh kosong)');
  const daftarI = T.ta(6, 'Satu lawan per baris: rating:hasil\ncth:\n1500:1\n1600:0,5\n1700:0', '');

  const panelSatu = T.el('<div></div>');
  panelSatu.appendChild(T.field('Rating lawan', lawanI));
  panelSatu.appendChild(T.field('Hasil partaimu', hasilS));
  panelSatu.appendChild(T.field('Jumlah partai yang sudah kamu mainkan (opsional)', partaiI, 'Untuk faktor K otomatis: di bawah 30 partai, K = 40.'));
  panelSatu.appendChild(T.field('Faktor K manual (opsional)', kI, 'Kosongkan untuk memakai aturan FIDE otomatis.'));
  const panelTurnamen = T.el('<div></div>');
  panelTurnamen.appendChild(T.field('Daftar lawan (rating:hasil)', daftarI, 'Hasil: 1 = menang, 0,5 = seri, 0 = kalah. Pisahkan rating dan hasil dengan titik dua (:), karena koma dipakai untuk desimal.'));
  panelTurnamen.style.display = 'none';

  modeS.onchange = () => {
    panelSatu.style.display = modeS.value === 'satu' ? '' : 'none';
    panelTurnamen.style.display = modeS.value === 'turnamen' ? '' : 'none';
  };

  const hitung = () => {
    const rating = T.num(ratingI.value);
    if (!isFinite(rating)) { T.toast('Isi ratingmu dengan angka'); return; }
    const kManual = T.num(kI.value);
    const partai = T.num(partaiI.value);
    const k = isFinite(kManual) && kManual > 0 ? kManual : faktorK(rating, isFinite(partai) ? partai : null);
    if (modeS.value === 'satu') {
      const lawan = T.num(lawanI.value);
      const hasil = Number(hasilS.value);
      if (!isFinite(lawan)) { T.toast('Isi rating lawan dengan angka'); return; }
      const e = skorHarapan(rating, lawan);
      const baru = ratingBaru(rating, lawan, hasil, k);
      const ubah = baru - rating;
      T.show(box,
        '<div class="big center">' + T.fmt(Math.round(baru)) + '<span class="mut" style="font-size:15px"> (' + fmtPerubahan(ubah) + ')</span></div>' +
        '<p class="center hint">rating barumu dari ' + T.fmt(rating) + '</p>' +
        '<div style="margin-top:12px">' +
        '<div class="kv"><span class="k">Peluang menangmu (harapan)</span><span class="v">' + utils.r4(e * 100) + '%</span></div>' +
        '<div class="kv"><span class="k">Faktor K yang dipakai</span><span class="v">' + k + '</span></div>' +
        '</div>' +
        '<p class="hint" style="margin-top:10px">Menang melawan lawan yang lebih kuat menaikkan rating lebih banyak, karena skor harapanmu kecil.</p>');
    } else {
      const baris = daftarI.value.split('\n').map((s) => s.trim()).filter(Boolean);
      const lawan = [], hasil = [];
      for (const b of baris) {
        // Pemisah titik dua, BUKAN koma: "1600:0,5" harus jadi [1600, 0,5],
        // sedangkan koma adalah pemisah desimal Indonesia.
        const p = b.split(/[:;]+/).map((s) => s.trim());
        const r = T.num(p[0]);
        const h = p.length > 1 ? T.num(p[1]) : NaN;
        if (!isFinite(r) || (h !== 0 && h !== 0.5 && h !== 1)) { T.toast('Baris tidak valid: "' + b + '". Format: rating:hasil (hasil 1, 0,5, atau 0)'); return; }
        lawan.push(r); hasil.push(h);
      }
      if (!lawan.length) { T.toast('Isi dulu daftar lawanmu'); return; }
      let total = 0;
      let detail = '';
      for (let i = 0; i < lawan.length; i++) {
        const e = skorHarapan(rating, lawan[i]);
        const ubah = k * (hasil[i] - e);
        total += ubah;
        detail += '<div class="kv"><span class="k">Lawan ' + T.fmt(lawan[i]) + ' (' + (hasil[i] === 1 ? 'menang' : hasil[i] === 0.5 ? 'seri' : 'kalah') + ')</span><span class="v">' + fmtPerubahan(ubah) + '</span></div>';
      }
      const rp = ratingPerforma(lawan, hasil);
      T.show(box,
        '<div class="big center">' + T.fmt(Math.round(rating + total)) + '<span class="mut" style="font-size:15px"> (' + fmtPerubahan(total) + ')</span></div>' +
        '<p class="center hint">rating baru setelah ' + lawan.length + ' partai</p>' +
        '<div style="margin-top:12px">' + detail +
        '<div class="kv"><span class="k">Rating performa (perkiraan)</span><span class="v">' + T.fmt(Math.round(rp)) + '</span></div>' +
        '<div class="kv"><span class="k">Faktor K yang dipakai</span><span class="v">' + k + '</span></div></div>' +
        '<p class="hint" style="margin-top:10px">Rating performa dihitung dengan pendekatan linier dari rata-rata rating lawan dan selisih menang-kalahmu, jadi ini perkiraan, bukan angka resmi FIDE.</p>');
    }
  };

  root.appendChild(T.el('<p class="hint">Kalah dari lawan yang ratingnya jauh di atasmu hampir tidak mengurangi rating. Menang melawannya menaikkan banyak. Itu cara kerja Elo.</p>'));
  root.appendChild(T.field('Mode', modeS));
  root.appendChild(T.field('Ratingmu sekarang', ratingI));
  root.appendChild(panelSatu);
  root.appendChild(panelTurnamen);
  root.appendChild(T.row(T.btn('Hitung Elo', hitung, true)));
  root.appendChild(box);
}
