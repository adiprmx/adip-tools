import { h as T, utils } from '../../core.js';

export const meta = {"id": "kalkulator-preorder", "name": "Kalkulator Pre-Order", "cat": "bisnis", "icon": "📦", "desc": "Tentukan harga jual per slot & estimasi laba pre-order batch.", "keywords": "preorder,pre-order,harga jual,margin,laba,bisnis,batch,markup"};

// Hitung harga jual pre-order dari modal batch.
// - markupPct: tambahan dari modal (markup, BUKAN margin — dihitung dari
//   modal, bukan dari harga jual). Misal modal 10rb + markup 30% = 13rb.
// - Harga jual DIBULATKAN ke Rp500 terdekat, dan SEMUA angka turunan
//   (laba per slot, omzet, total laba, margin sebenarnya) memakai harga
//   bulat itu — sama dengan yang dibayar pembeli.
// Logika murni (bisa di-test di Node).
export function hitungPreorder(modal, markupPct, peserta) {
  const m = Number(modal), p = Math.floor(Number(peserta));
  const mg = Number(markupPct);
  if (![m, mg].every(isFinite) || m <= 0 || mg < 0 || !isFinite(p) || p <= 0) return null;
  const hpp = m / p;
  const jualPas = hpp * (1 + mg / 100);
  const jual = Math.ceil(jualPas / 500) * 500;
  const labaPer = jual - hpp;
  const labaTotal = labaPer * p;
  const omzet = jual * p;
  const marginSebenarnya = jual > 0 ? (labaPer / jual) * 100 : 0;
  if (![hpp, jualPas, jual, labaPer, labaTotal, omzet].every(isFinite)) return null;
  return { hpp, jualPas, jual, labaPer, labaTotal, omzet, marginSebenarnya, peserta: p };
}
utils.hitungPreorder = hitungPreorder;

export function render(root) {
  const K = 'tool:kalkulator-preorder';
  const load = () => { try { return JSON.parse(localStorage.getItem(K) || '{}'); } catch (e) { return {}; } };
  const sv = load();
  const save = () => { try { localStorage.setItem(K, JSON.stringify({ m: modalI.value, r: marginI.value, p: pesertaI.value })); } catch (e) {} };

  root.appendChild(T.el('<p class="hint">Lagi buka pre-order makanan, merchandise, atau jastip batch-an? Masukkan modalmu, biar harga per slot dan untungnya ketahuan jelas.</p>'));

  const modalI = T.input('text', 'Contoh: 2000000', sv.m || '');
  const marginI = T.input('text', 'Contoh: 30', sv.r || '30');
  const pesertaI = T.input('text', 'Contoh: 50', sv.p || '');

  root.appendChild(T.field('Modal per batch (Rp)', modalI, 'Total modal: bahan, kemasan, ongkir, dll.'));
  root.appendChild(T.grid2(
    T.field('Tambahan dari modal (%)', marginI, 'Ini markup: dihitung dari modal. Misal modal Rp10.000 + 30% = jual Rp13.000.'),
    T.field('Estimasi peserta (slot)', pesertaI, 'Kira-kira berapa slot yang laku.')
  ));

  const box = T.out();
  root.appendChild(box);

  const hitung = () => {
    save();
    const modal = T.num(modalI.value);
    const margin = T.num(marginI.value);
    const peserta = Math.floor(T.num(pesertaI.value));
    if (isNaN(modal) || modal <= 0) { T.show(box, '<p class="mut center">Isi dulu modal per batch-nya.</p>'); return; }
    if (isNaN(peserta) || peserta <= 0) { T.show(box, '<p class="mut center">Estimasi pesertanya juga diisi ya.</p>'); return; }
    const mg = isNaN(margin) ? 0 : margin;
    const h = hitungPreorder(modal, mg, peserta);
    if (!h) { T.show(box, '<p class="err">Angkanya tidak bisa dihitung. Periksa lagi isianmu.</p>'); return; }
    T.show(box,
      '<div class="big center">' + T.rp(h.jual) + '</div>' +
      '<p class="center mut">harga jual per slot (dibulatkan ke 500 terdekat)</p>' +
      '<div class="kv"><span class="k">Modal per slot (HPP)</span><span class="v">' + T.rp(h.hpp) + '</span></div>' +
      '<div class="kv"><span class="k">Harga jual per slot</span><span class="v">' + T.rp(h.jual) + ' (' + mg + '% dari modal)</span></div>' +
      '<div class="kv"><span class="k">Laba per slot</span><span class="v">' + T.rp(h.labaPer) + '</span></div>' +
      '<div class="kv"><span class="k">Total omzet ' + peserta + ' slot</span><span class="v">' + T.rp(h.omzet) + '</span></div>' +
      '<div class="kv"><span class="k">Total laba kotor</span><span class="v">' + T.rp(h.labaTotal) + '</span></div>' +
      '<div class="kv"><span class="k">Margin sebenarnya</span><span class="v">' + h.marginSebenarnya.toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '% dari harga jual</span></div>' +
      '<p class="hint">Rincian: modal ' + T.rp(modal) + ' dibagi ' + peserta + ' slot = HPP ' + T.rp(h.hpp) + '/slot. Tambah ' + mg + '% dari modal jadi ' + T.rp(h.jualPas) + '/slot, dibulatkan jadi ' + T.rp(h.jual) + '. Semua angka laba di atas memakai harga bulat yang sama dengan yang dibayar pembeli, jadi tidak ada selisih. Margin sebenarnya (' + h.marginSebenarnya.toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '%) dihitung dari harga jual, makanya angkanya beda dari tambahan modal ' + mg + '%.</p>'
    );
  };
  [modalI, marginI, pesertaI].forEach((i) => i.addEventListener('input', hitung));
  hitung();
}
