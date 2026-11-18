import { h as T } from '../../core.js';

export const meta = { id: 'kalkulator-probabilitas', name: 'Kalkulator Probabilitas', cat: 'pelajar', icon: '🎲', desc: 'Peluang gabungan, bersyarat, komplemen, dan distribusi binomial. Tulis peluangnya, langsung ketahuan hasilnya.', keywords: 'probabilitas,peluang,binomial,kombinasi,peluang gabungan,peluang bersyarat,bayes,statistik', since: '6.17.0' };

export function lgamma(z) {
  const p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
  z -= 1;
  let x = p[0];
  for (let i = 1; i < 9; i++) x += p[i] / (z + i);
  const t = z + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

// Kombinasi C(n,k) via log-gamma (aman untuk n besar).
export function kombinasi(n, k) {
  if (k < 0 || k > n) return 0;
  return Math.round(Math.exp(lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1)));
}

// Peluang binomial: tepat k berhasil dari n percobaan dengan peluang p.
export function binomialPMF(n, k, p) {
  if (p === 0) return k === 0 ? 1 : 0;
  if (p === 1) return k === n ? 1 : 0;
  return kombinasi(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

// Peluang binomial kumulatif: paling banyak k berhasil.
export function binomialCDF(n, k, p) {
  let s = 0;
  for (let i = 0; i <= k; i++) s += binomialPMF(n, i, p);
  return s;
}

function fmtP(p) {
  if (!isFinite(p)) return 'di luar jangkauan';
  const persen = Math.round(p * 10000) / 100;
  return String(persen).replace('.', ',') + '%';
}
function fmtDes(v) {
  if (!isFinite(v)) return 'di luar jangkauan';
  return String(Math.round(v * 10000) / 10000).replace('.', ',');
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Peluang ditulis sebagai angka 0 sampai 1, atau persen. Contoh: peluang 25% ditulis 0,25.</p>'));

  const mode = T.select([
    ['gabung', 'Peluang gabungan (A dan B, A atau B)'],
    ['bersyarat', 'Peluang bersyarat (A kalau B sudah terjadi)'],
    ['komplemen', 'Komplemen (peluang tidak terjadi)'],
    ['binomial', 'Binomial (tepat k berhasil dari n percobaan)'],
  ], 'gabung');

  // Tiap panel punya input sendiri: satu elemen input tidak bisa tinggal di dua panel sekaligus.
  const paG = T.input('number', 'mis. 0,5', '0.5');
  const pbG = T.input('number', 'mis. 0,3', '0.3');
  const pabG = T.input('number', 'mis. 0,2', '0.2');
  const pabS = T.input('number', 'mis. 0,2', '0.2');
  const pbS = T.input('number', 'mis. 0,3', '0.3');
  const paK = T.input('number', 'mis. 0,5', '0.5');
  const nI = T.input('number', 'mis. 10', '10');
  const kI = T.input('number', 'mis. 3', '3');
  const pI = T.input('number', 'mis. 0,5', '0.5');

  const panelGabung = T.el('<div></div>');
  panelGabung.append(T.field('Peluang A', paG), T.field('Peluang B', pbG), T.field('Peluang A dan B sekaligus', pabG, 'Kalau A dan B saling bebas, isi dengan peluang A dikali peluang B.'));
  const panelSyarat = T.el('<div></div>');
  panelSyarat.append(T.field('Peluang A dan B sekaligus', pabS), T.field('Peluang B', pbS));
  const panelKomp = T.el('<div></div>');
  panelKomp.append(T.field('Peluang kejadian', paK));
  const panelBinom = T.el('<div></div>');
  panelBinom.append(T.field('Jumlah percobaan (n)', nI), T.field('Jumlah berhasil yang dicari (k)', kI), T.field('Peluang berhasil tiap percobaan (p)', pI));

  const panels = { gabung: panelGabung, bersyarat: panelSyarat, komplemen: panelKomp, binomial: panelBinom };
  function aturPanel() {
    Object.entries(panels).forEach(([k, el]) => { el.hidden = k !== mode.value; });
  }
  mode.addEventListener('change', aturPanel);

  const box = T.out();

  function bacaPeluang(inp, nama) {
    let v = T.num(inp.value);
    if (!isFinite(v)) { T.toast('Isi ' + nama + ' dulu'); return null; }
    if (v > 1 && v <= 100) v = v / 100; // terima persen juga
    if (v < 0 || v > 1) { T.toast(nama + ' harus antara 0 dan 1 (atau 0% sampai 100%)'); return null; }
    return v;
  }

  function hitung() {
    if (mode.value === 'gabung') {
      const pa = bacaPeluang(paG, 'peluang A');
      const pb = bacaPeluang(pbG, 'peluang B');
      const pab = bacaPeluang(pabG, 'peluang A dan B');
      if (pa == null || pb == null || pab == null) return;
      if (pab > Math.min(pa, pb) + 1e-9) { T.toast('Peluang A dan B tidak boleh lebih besar dari peluang A atau B sendiri'); return; }
      const atau = pa + pb - pab;
      const bebas = Math.abs(pab - pa * pb) < 1e-9;
      T.show(box,
        '<p class="big">A dan B: ' + fmtP(pab) + ' · A atau B: ' + fmtP(atau) + '</p>' +
        '<p>Peluang A atau B terjadi = ' + fmtP(pa) + ' + ' + fmtP(pb) + ' − ' + fmtP(pab) + ' = ' + fmtP(atau) + '.</p>' +
        '<p class="hint">' + (bebas ? 'A dan B saling bebas: peluang keduanya sama dengan hasil kali peluang masing-masing.' : 'A dan B tidak saling bebas: peluang keduanya (' + fmtP(pab) + ') berbeda dari hasil kali peluangnya (' + fmtP(pa * pb) + ').') + '</p>');
    } else if (mode.value === 'bersyarat') {
      const pab = bacaPeluang(pabS, 'peluang A dan B');
      const pb = bacaPeluang(pbS, 'peluang B');
      if (pab == null || pb == null) return;
      if (pb === 0) { T.toast('Peluang B harus lebih dari 0'); return; }
      if (pab > pb + 1e-9) { T.toast('Peluang A dan B tidak boleh lebih besar dari peluang B'); return; }
      const hasil = pab / pb;
      T.show(box,
        '<p class="big">Peluang A kalau B terjadi: ' + fmtP(hasil) + '</p>' +
        '<p class="hint">Cara hitungnya: peluang A dan B (' + fmtP(pab) + ') ÷ peluang B (' + fmtP(pb) + ').</p>');
    } else if (mode.value === 'komplemen') {
      const pa = bacaPeluang(paK, 'peluang kejadian');
      if (pa == null) return;
      T.show(box,
        '<p class="big">Peluang tidak terjadi: ' + fmtP(1 - pa) + '</p>' +
        '<p class="hint">Cara hitungnya: 1 − ' + fmtP(pa) + ' = ' + fmtP(1 - pa) + '.</p>');
    } else {
      const n = T.num(nI.value), k = T.num(kI.value);
      const p = bacaPeluang(pI, 'peluang berhasil');
      if (!Number.isInteger(n) || n < 1 || n > 1000) { T.toast('Jumlah percobaan harus bilangan bulat 1 sampai 1000'); return; }
      if (!Number.isInteger(k) || k < 0 || k > n) { T.toast('Jumlah berhasil harus bilangan bulat 0 sampai ' + n); return; }
      if (p == null) return;
      const tepat = binomialPMF(n, k, p);
      const palingBanyak = binomialCDF(n, k, p);
      const palingSedikit = 1 - binomialCDF(n, k - 1, p);
      const rata = n * p;
      T.show(box,
        '<p class="big">Tepat ' + k + ' berhasil: ' + fmtP(tepat) + '</p>' +
        '<p>Paling banyak ' + k + ' berhasil: ' + fmtP(palingBanyak) + '. Paling sedikit ' + k + ' berhasil: ' + fmtP(palingSedikit) + '.</p>' +
        '<p class="hint">Rata-rata berhasil yang diharapkan: ' + fmtDes(rata) + ' dari ' + n + ' percobaan. Kombinasi C(' + n + ',' + k + ') = ' + T.fmt(kombinasi(n, k)) + '.</p>');
    }
  }

  root.append(
    T.field('Yang mau dihitung', mode),
    panelGabung, panelSyarat, panelKomp, panelBinom,
    T.btn('Hitung peluang', hitung, true),
    box,
  );
  aturPanel();
}
