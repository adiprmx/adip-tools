import { h as T } from '../../core.js';

export const meta = { id: 'kalkulator-lumen-ke-watt', name: 'Kalkulator Lumen ke Watt', cat: 'sehari', icon: '💡', desc: 'Berapa watt lampu yang kamu butuhkan untuk terang tertentu, atau sebaliknya, sesuai jenis lampunya.', keywords: 'lumen,watt,lampu,led,terang,cahaya,hemat listrik', since: '6.18.0' };

// Efisiensi umum tiap jenis lampu (lumen per watt). Nilai ini perkiraan
// rata-rata produk yang beredar; angka pasti tiap lampu ada di kemasannya.
export const EFIKASI = {
  led: ['LED', 100],
  cfl: ['Lampu hemat energi (CFL)', 60],
  halogen: ['Halogen', 20],
  pijar: ['Pijar (bohlam biasa)', 15],
};

// Watt yang dibutuhkan untuk menghasilkan sekian lumen.
export function lumenKeWatt(lumen, jenis) {
  if (!(lumen >= 0) || !(jenis in EFIKASI)) return null;
  return lumen / EFIKASI[jenis][1];
}

// Lumen yang dihasilkan lampu sekian watt.
export function wattKeLumen(watt, jenis) {
  if (!(watt >= 0) || !(jenis in EFIKASI)) return null;
  return watt * EFIKASI[jenis][1];
}

function fmtDes(v, des) {
  if (!isFinite(v)) return 'di luar jangkauan';
  const d = des == null ? 1 : des;
  const r = Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
  return String(r).replace('.', ',');
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Lumen itu seberapa terang cahayanya, watt itu seberapa besar listriknya. Lampu LED butuh watt jauh lebih kecil daripada bohlam pijar untuk terang yang sama.</p>'));

  const mode = T.select([
    ['lumenWatt', 'Lumen ke watt (cari wattnya)'],
    ['wattLumen', 'Watt ke lumen (cari terangnya)'],
  ], 'lumenWatt');
  const nilaiI = T.input('text', 'cth: 800', '800'); nilaiI.inputMode = 'decimal';
  const jenis = T.select([
    ['led', 'LED (sekitar 100 lumen per watt)'],
    ['cfl', 'Lampu hemat energi / CFL (sekitar 60)'],
    ['halogen', 'Halogen (sekitar 20)'],
    ['pijar', 'Pijar / bohlam biasa (sekitar 15)'],
  ], 'led');
  const box = T.out();

  const labelNilai = T.el('<div></div>');

  function aturTampil() {
    labelNilai.innerHTML = '';
    labelNilai.appendChild(T.field(mode.value === 'lumenWatt' ? 'Terang yang dibutuhkan (lumen)' : 'Daya lampu (watt)', nilaiI));
  }
  mode.addEventListener('change', aturTampil);
  aturTampil();

  function hitung() {
    const n = T.num(nilaiI.value);
    if (!isFinite(n) || n < 0) { T.toast('Isi angkanya dulu dengan angka 0 atau lebih'); return; }
    const nama = EFIKASI[jenis.value][0];
    if (mode.value === 'lumenWatt') {
      const w = lumenKeWatt(n, jenis.value);
      const banding = Object.keys(EFIKASI).map((j) =>
        '<tr' + (j === jenis.value ? ' style="background:rgba(255,111,97,.12)"' : '') + '><td style="padding:5px 8px">' + T.esc(EFIKASI[j][0]) + '</td><td style="text-align:right;padding:5px 8px">' + fmtDes(lumenKeWatt(n, j)) + ' watt</td></tr>').join('');
      T.show(box,
        '<p class="big">' + fmtDes(w) + ' watt</p>' +
        '<p>Untuk terang ' + T.fmt(n) + ' lumen, lampu ' + T.esc(nama) + ' butuh sekitar ' + fmtDes(w) + ' watt.</p>' +
        '<table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:13px"><thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.15)">Jenis lampu</th><th style="text-align:right;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.15)">Watt untuk ' + T.fmt(n) + ' lumen</th></tr></thead><tbody>' + banding + '</tbody></table>' +
        '<p class="hint">Angka ini perkiraan dari efisiensi umum tiap jenis lampu. Lumen dan watt pasti tiap lampu tertulis di kemasannya.</p>');
    } else {
      const l = wattKeLumen(n, jenis.value);
      T.show(box,
        '<p class="big">' + fmtDes(l, 0) + ' lumen</p>' +
        '<p>Lampu ' + T.esc(nama) + ' ' + fmtDes(n) + ' watt menghasilkan terang sekitar ' + fmtDes(l, 0) + ' lumen.</p>' +
        '<p class="hint">Angka ini perkiraan dari efisiensi umum tiap jenis lampu. Lumen dan watt pasti tiap lampu tertulis di kemasannya.</p>');
    }
  }

  root.append(
    T.field('Yang mau dihitung', mode),
    labelNilai,
    T.field('Jenis lampu', jenis),
    T.btn('Hitung', hitung, true),
    box,
  );
}
