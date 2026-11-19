import { h as T, utils } from '../../core.js';

export const meta = { id: 'kalkulator-penurunan-tegangan', name: 'Kalkulator Penurunan Tegangan', cat: 'sains', icon: '🔌', desc: 'Tegangan yang hilang di sepanjang kabel dari panjang, arus, dan penampangnya. Cek apakah masih dalam batas aman 5%.', keywords: 'penurunan tegangan,jatuh tegangan,voltage drop,kabel,arus,penampang,tembaga,aluminium', since: '6.19.0' };

// Hambatan jenis (ohm mm2/m) pada 20 C.
export const RHO = { tembaga: 0.0175, aluminium: 0.0282 };

// Penurunan tegangan (volt). L = panjang satu arah (m), A = penampang (mm2).
// 1 fasa: dV = 2 I L rho / A (pergi-pulang). 3 fasa: dV = sqrt(3) I L rho / A.
export function jatuhTegangan(I, L, A, rho, fasa) {
  if (!(I > 0) || !(L > 0) || !(A > 0) || !(rho > 0)) return NaN;
  const k = fasa === 3 ? Math.sqrt(3) : 2;
  return (k * I * L * rho) / A;
}

// Panjang kabel maksimum (m) agar penurunan tegangan tidak melebihi dVBoleh.
export function panjangMaks(dVBoleh, I, A, rho, fasa) {
  if (!(dVBoleh > 0) || !(I > 0) || !(A > 0) || !(rho > 0)) return NaN;
  const k = fasa === 3 ? Math.sqrt(3) : 2;
  return (dVBoleh * A) / (k * I * rho);
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Arus yang mengalir di kabel selalu kehilangan sebagian tegangan di jalan. Makin panjang kabelnya, makin besar arusnya, atau makin kecil penampangnya, makin besar tegangannya yang hilang.</p>'));

  const arusI = T.input('number', 'mis. 10', '10');
  const panjangI = T.input('number', 'mis. 50', '50');
  const tampangSel = T.select([
    ['1.5', '1,5 mm²'],
    ['2.5', '2,5 mm²'],
    ['4', '4 mm²'],
    ['6', '6 mm²'],
    ['10', '10 mm²'],
    ['16', '16 mm²'],
    ['25', '25 mm²'],
    ['35', '35 mm²'],
  ], '2.5');
  const bahanSel = T.select([
    ['tembaga', 'Tembaga'],
    ['aluminium', 'Aluminium'],
  ], 'tembaga');
  const fasaSel = T.select([
    ['1', '1 fasa (220 V)'],
    ['3', '3 fasa (380 V)'],
  ], '1');
  const voltI = T.input('number', 'mis. 220', '220');
  const box = T.out();

  fasaSel.addEventListener('change', () => {
    voltI.value = fasaSel.value === '3' ? '380' : '220';
  });

  function hitung() {
    const I = T.num(arusI.value), L = T.num(panjangI.value);
    const A = Number(tampangSel.value);
    const rho = RHO[bahanSel.value];
    const fasa = Number(fasaSel.value);
    const V = T.num(voltI.value);
    if (!isFinite(I) || I <= 0) { T.toast('Arusnya harus lebih dari 0'); return; }
    if (!isFinite(L) || L <= 0) { T.toast('Panjang kabelnya harus lebih dari 0'); return; }
    if (!isFinite(V) || V <= 0) { T.toast('Tegangan nominal harus lebih dari 0'); return; }
    const dV = jatuhTegangan(I, L, A, rho, fasa);
    const persen = (dV / V) * 100;
    const lMax = panjangMaks(V * 0.05, I, A, rho, fasa);
    const aman = persen <= 5;
    T.show(box,
      '<p class="big">Tegangan yang hilang: ' + utils.fmtDes(dV, 2) + ' volt (' + utils.fmtDes(persen, 2) + '%)</p>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0">' +
      '<div class="kv"><span class="k">Tegangan di ujung kabel</span><span class="v">' + utils.fmtDes(V - dV, 2) + ' V</span></div>' +
      '<div class="kv"><span class="k">Batas aman 5%</span><span class="v">' + (aman ? 'Masih aman' : 'Melewati batas') + '</span></div>' +
      '<div class="kv"><span class="k">Panjang maks (batas 5%)</span><span class="v">' + utils.fmtDes(lMax, 1) + ' m</span></div>' +
      '<div class="kv"><span class="k">Daya yang hilang jadi panas</span><span class="v">' + utils.fmtDes(dV * I, 1) + ' watt</span></div>' +
      '</div>' +
      '<p class="hint">' + (aman
        ? 'Penurunan di bawah 5% masih wajar untuk instalasi rumah. Bila kabelnya diperpanjang sampai ' + utils.fmtDes(lMax, 1) + ' m, penurunannya pas menyentuh batas 5%.'
        : 'Penurunan di atas 5% bikin peralatan di ujung bekerja di bawah tegangan seharusnya. Solusinya: pakai kabel berpenampang lebih besar atau pendekkan jalurnya.') +
      ' Hitungan ini memakai hambatan jenis pada 20°C; kabel yang panas hambatannya naik sedikit, jadi penurunan sebenarnya bisa sedikit lebih besar.</p>');
  }

  root.append(
    T.grid2(T.field('Arus yang mengalir (ampere)', arusI), T.field('Panjang kabel satu arah (meter)', panjangI)),
    T.grid2(T.field('Penampang kabel', tampangSel), T.field('Bahan kabel', bahanSel)),
    T.grid2(T.field('Sistem', fasaSel), T.field('Tegangan nominal (volt)', voltI)),
    T.btn('Hitung penurunan tegangannya', hitung, true),
    box,
  );
}
