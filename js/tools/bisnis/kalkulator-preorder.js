import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id": "kalkulator-preorder", "name": "Kalkulator Pre-Order", "cat": "bisnis", "icon": "📦", "desc": "Tentukan harga jual per slot & estimasi laba pre-order batch.", "keywords": "preorder,pre-order,harga jual,margin,laba,bisnis,batch"};

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
    T.field('Target margin (%)', marginI, 'Laba yang kamu mau dari modal.'),
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
    const hpp = modal / peserta;
    const jual = hpp * (1 + mg / 100);
    const labaPer = jual - hpp;
    const labaTotal = labaPer * peserta;
    T.show(box,
      '<div class="big center">' + T.rp(Math.ceil(jual / 500) * 500) + '</div>' +
      '<p class="center mut">harga jual per slot (dibulatkan ke 500 terdekat)</p>' +
      '<div class="kv"><span class="k">Modal per slot (HPP)</span><span class="v">' + T.rp(hpp) + '</span></div>' +
      '<div class="kv"><span class="k">Harga jual per slot</span><span class="v">' + T.rp(jual) + ' (' + mg + '%)</span></div>' +
      '<div class="kv"><span class="k">Laba per slot</span><span class="v">' + T.rp(labaPer) + '</span></div>' +
      '<div class="kv"><span class="k">Total omzet ' + peserta + ' slot</span><span class="v">' + T.rp(jual * peserta) + '</span></div>' +
      '<div class="kv"><span class="k">Total laba kotor</span><span class="v">' + T.rp(labaTotal) + '</span></div>' +
      '<p class="hint">Rincian: modal ' + T.rp(modal) + ' dibagi ' + peserta + ' slot = HPP ' + T.rp(hpp) + '/slot. Tambah margin ' + mg + '% jadi ' + T.rp(jual) + '/slot. Laba kotor = ' + T.rp(labaPer) + ' x ' + peserta + ' = ' + T.rp(labaTotal) + '.</p>'
    );
  };
  [modalI, marginI, pesertaI].forEach((i) => i.addEventListener('input', hitung));
  hitung();
}
