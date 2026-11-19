import { h as T, utils, kv } from '../../core.js';

export const meta = {"id": "kalkulator-capm-beta", "name": "Kalkulator CAPM & Beta Saham", "cat": "bisnis", "icon": "📊", "desc": "Berapa hasil wajar saham dari risikonya (beta), dan berapa beta saham dari data pasar.", "keywords": "capm,beta,saham,imbal hasil wajar,risiko pasar,rf,return pasar,investasi", "since": "6.19.0"};

const nol = (x) => (x === 0 ? 0 : x);
const fmtP = (x, d) => nol(x).toFixed(d == null ? 2 : d).replace('.', ',') + '%';

/* CAPM: hasil wajar = Rf + beta x (Rm - Rf). Semua persen dalam satuan persen
   (bukan desimal). Null bila input tidak valid. */
export function hitungCapm(rfPersen, beta, rmPersen) {
  const rf = Number(rfPersen), b = Number(beta), rm = Number(rmPersen);
  if (![rf, b, rm].every(isFinite)) return null;
  const r = rf + b * (rm - rf);
  return Number.isFinite(r) ? r : null;
}

/* Beta = kovarians saham-pasar / varians pasar. */
export function hitungBeta(kovarians, variansPasar) {
  const c = Number(kovarians), v = Number(variansPasar);
  if (![c, v].every(isFinite) || v <= 0) return null;
  const b = c / v;
  return Number.isFinite(b) ? b : null;
}
utils.capm = hitungCapm;
utils.betaSaham = hitungBeta;

export function render(root) {
  const rfI = T.input('text', 'cth: 6', '6');
  const betaI = T.input('text', 'cth: 1,2', '');
  const rmI = T.input('text', 'cth: 12', '');
  const kovI = T.input('text', 'cth: 0,0012', '');
  const varI = T.input('text', 'cth: 0,001', '');
  const box = T.out();

  const hitung = () => {
    const rf = T.num(rfI.value);
    const rm = T.num(rmI.value);
    let beta = T.num(betaI.value);
    let betaDari = '';
    if (!isFinite(beta) && kovI.value.trim() !== '' && varI.value.trim() !== '') {
      const b = hitungBeta(T.num(kovI.value), T.num(varI.value));
      if (b != null) { beta = b; betaDari = ' (dihitung dari kovarians dan varians di bawah)'; }
    }
    if (!isFinite(rf)) { T.show(box, '<div class="err">Isi dulu hasil investasi aman (misal bunga deposito) dengan angka.</div>'); return; }
    if (!isFinite(beta)) { T.show(box, '<div class="err">Isi beta sahamnya, atau isi kovarians dan varians pasar di bawah supaya beta bisa dihitung.</div>'); return; }
    if (!isFinite(rm)) { T.show(box, '<div class="err">Isi dulu perkiraan hasil pasar (misal IHSG) dengan angka.</div>'); return; }
    const hasil = hitungCapm(rf, beta, rm);
    if (hasil === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    const premi = rm - rf;
    const arti = beta > 1
      ? 'Beta di atas 1 artinya saham ini bergerak lebih kencang dari pasar: naiknya bisa lebih tinggi, turunnya juga bisa lebih dalam.'
      : beta < 1
        ? 'Beta di bawah 1 artinya saham ini bergerak lebih pelan dari pasar: lebih tenang saat pasar turun, tapi juga lebih lambat saat pasar naik.'
        : 'Beta 1 artinya saham ini bergerak seirama dengan pasar.';
    T.show(box,
      '<div class="big center">' + fmtP(hasil) + '</div>' +
      '<p class="center">hasil wajar per tahun menurut CAPM</p>' +
      kv('Hasil investasi aman (Rf)', fmtP(rf)) +
      kv('Beta saham', utils.r4(beta).replace('.', ',') + betaDari) +
      kv('Perkiraan hasil pasar (Rm)', fmtP(rm)) +
      kv('Premi risiko pasar (Rm - Rf)', fmtP(premi)) +
      '<p class="info">' + arti + '</p>' +
      '<p class="hint">Rumusnya: hasil wajar = hasil aman + beta x (hasil pasar - hasil aman). Ini perkiraan teori, bukan jaminan: hasil nyata saham bisa beda jauh.</p>');
  };

  root.appendChild(T.el('<p class="note">CAPM memperkirakan berapa hasil yang wajar diminta dari sebuah saham, berdasarkan seberapa berisiko saham itu dibanding pasar. Beta mengukur risiko itu: beta 1,2 artinya saham naik-turun 20% lebih kencang dari pasar.</p>'));
  root.appendChild(T.field('Hasil investasi aman (% per tahun)', rfI, 'Misal bunga deposito atau obligasi negara. Default 6%.'));
  root.appendChild(T.field('Beta saham', betaI, 'Bisa dilihat di aplikasi sekuritas atau situs data saham. Kosongkan bila mau dihitung dari data di bawah.'));
  root.appendChild(T.field('Perkiraan hasil pasar (% per tahun)', rmI, 'Misal perkiraan hasil IHSG per tahun.'));
  root.appendChild(T.field('Kovarians saham-pasar (opsional)', kovI, 'Hanya bila beta tidak diisi. Dari data historis harga saham dan pasar.'));
  root.appendChild(T.field('Varians pasar (opsional)', varI, 'Hanya bila beta tidak diisi. Harus lebih dari 0.'));
  root.appendChild(T.row(T.btn('Hitung Hasil Wajar', hitung, true)));
  root.appendChild(box);
}
