import { h as T, utils } from '../../core.js';

export const meta = { id: 'kalkulator-waktu-paruh', name: 'Kalkulator Waktu Paruh', cat: 'sains', icon: '☢️', desc: 'Sisa zat setelah sekian waktu paruh, waktu yang dibutuhkan sampai sisa tertentu, atau waktu paruhnya sendiri dari dua pengukuran.', keywords: 'waktu paruh,half-life,peluruhan,radioaktif,obat,sisa zat', since: '6.18.0' };

// Sisa setelah waktu t: N = N0 * (1/2)^(t / t½).
export function sisaParuh(n0, waktuParuh, t) {
  if (!(n0 >= 0) || !(waktuParuh > 0) || !(t >= 0)) return null;
  return n0 * Math.pow(0.5, t / waktuParuh);
}

// Waktu yang dibutuhkan agar sisa tinggal nt: t = t½ * log2(N0/Nt).
export function waktuUntukSisa(n0, nt, waktuParuh) {
  if (!(n0 > 0) || !(nt > 0) || !(waktuParuh > 0) || nt >= n0) return null;
  return waktuParuh * (Math.log(n0 / nt) / Math.log(2));
}

// Waktu paruh dari dua pengukuran: t½ = t * log(2) / log(N0/Nt).
export function cariWaktuParuh(n0, nt, t) {
  if (!(n0 > 0) || !(nt > 0) || !(t > 0) || nt >= n0) return null;
  return t * Math.log(2) / Math.log(n0 / nt);
}

// fmtDes kanonis tinggal di utils (core.js).

export function render(root) {
  root.appendChild(T.el('<p class="hint">Waktu paruh itu waktu yang dibutuhkan sampai jumlah zat tinggal separuhnya. Setelah satu waktu paruh tinggal 50%, setelah dua waktu paruh tinggal 25%, dan seterusnya.</p>'));

  const mode = T.select([
    ['sisa', 'Cari sisa zat setelah waktu tertentu'],
    ['waktu', 'Cari waktu sampai sisa tertentu'],
    ['paruh', 'Cari waktu paruh dari dua pengukuran'],
  ], 'sisa');
  const n0I = T.input('text', 'cth: 100', '100'); n0I.inputMode = 'decimal';
  const thI = T.input('text', 'cth: 5', '5'); thI.inputMode = 'decimal';
  const tI = T.input('text', 'cth: 15', '15'); tI.inputMode = 'decimal';
  const ntI = T.input('text', 'cth: 12,5', '12.5'); ntI.inputMode = 'decimal';
  const box = T.out();

  const wrapTh = T.el('<div></div>');
  wrapTh.appendChild(T.field('Waktu paruh', thI, 'Satuan waktunya bebas, asal sama dengan satuan waktu di bawah.'));
  const wrapT = T.el('<div></div>');
  wrapT.appendChild(T.field('Waktu yang berlalu', tI));
  const wrapNt = T.el('<div></div>');
  wrapNt.appendChild(T.field('Sisa zat yang dituju', ntI));

  function aturTampil() {
    const m = mode.value;
    wrapTh.hidden = m === 'paruh';
    wrapT.hidden = m === 'waktu';
    wrapNt.hidden = m === 'sisa';
  }
  mode.addEventListener('change', aturTampil);
  aturTampil();

  function hitung() {
    const n0 = T.num(n0I.value);
    if (!isFinite(n0) || n0 <= 0) { T.toast('Isi jumlah awalnya dulu dengan angka lebih dari 0'); return; }
    if (mode.value === 'sisa') {
      const th = T.num(thI.value), t = T.num(tI.value);
      if (!isFinite(th) || th <= 0) { T.toast('Isi waktu paruhnya dulu dengan angka lebih dari 0'); return; }
      if (!isFinite(t) || t < 0) { T.toast('Isi waktunya dulu dengan angka 0 atau lebih'); return; }
      const sisa = sisaParuh(n0, th, t);
      const paruhLewat = t / th;
      let baris = '';
      for (let i = 0; i <= Math.min(10, Math.ceil(paruhLewat)); i++) {
        baris += '<tr><td style="padding:5px 8px">' + i + ' × waktu paruh (' + utils.fmtDes(i * th) + ')</td><td style="text-align:right;padding:5px 8px">' + utils.fmtDes(sisaParuh(n0, th, i * th)) + ' (' + utils.fmtDes(100 * Math.pow(0.5, i), 2) + '%)</td></tr>';
      }
      T.show(box,
        '<p class="big">Sisa: ' + utils.fmtDes(sisa) + '</p>' +
        '<p>Dari ' + utils.fmtDes(n0) + ' setelah ' + utils.fmtDes(t) + ' satuan waktu (' + utils.fmtDes(paruhLewat) + ' kali waktu paruh), tinggal ' + utils.fmtDes(sisa) + ' atau ' + utils.fmtDes(100 * sisa / n0, 2) + '%.</p>' +
        '<table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:13px"><thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.15)">Setelah</th><th style="text-align:right;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.15)">Sisa</th></tr></thead><tbody>' + baris + '</tbody></table>');
    } else if (mode.value === 'waktu') {
      const th = T.num(thI.value), nt = T.num(ntI.value);
      if (!isFinite(th) || th <= 0) { T.toast('Isi waktu paruhnya dulu dengan angka lebih dari 0'); return; }
      if (!isFinite(nt) || nt <= 0) { T.toast('Isi sisa yang dituju dulu dengan angka lebih dari 0'); return; }
      if (nt >= n0) { T.toast('Sisa yang dituju harus lebih kecil dari jumlah awal'); return; }
      const t = waktuUntukSisa(n0, nt, th);
      T.show(box,
        '<p class="big">' + utils.fmtDes(t) + ' satuan waktu</p>' +
        '<p>Dari ' + utils.fmtDes(n0) + ' menjadi ' + utils.fmtDes(nt) + ' butuh ' + utils.fmtDes(t) + ' satuan waktu, atau ' + utils.fmtDes(t / th) + ' kali waktu paruh.</p>');
    } else {
      const nt = T.num(ntI.value), t = T.num(tI.value);
      if (!isFinite(nt) || nt <= 0) { T.toast('Isi sisa yang terukur dulu dengan angka lebih dari 0'); return; }
      if (nt >= n0) { T.toast('Sisa yang terukur harus lebih kecil dari jumlah awal'); return; }
      if (!isFinite(t) || t <= 0) { T.toast('Isi selang waktunya dulu dengan angka lebih dari 0'); return; }
      const th = cariWaktuParuh(n0, nt, t);
      T.show(box,
        '<p class="big">Waktu paruh: ' + utils.fmtDes(th) + ' satuan waktu</p>' +
        '<p>Dari ' + utils.fmtDes(n0) + ' menjadi ' + utils.fmtDes(nt) + ' dalam ' + utils.fmtDes(t) + ' satuan waktu, waktu paruhnya ' + utils.fmtDes(th) + ' satuan waktu.</p>');
    }
  }

  root.append(
    T.field('Yang mau dicari', mode),
    T.field('Jumlah awal zat', n0I),
    wrapTh,
    wrapT,
    wrapNt,
    T.btn('Hitung', hitung, true),
    box,
  );
}
