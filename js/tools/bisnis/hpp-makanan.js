import { h as T, kv } from '../../core.js?v=6.13.0';

export const meta = {"id": "hpp-makanan", "name": "HPP Makanan per Porsi", "cat": "bisnis", "icon": "🍜", "desc": "Hitung modal tiap porsi dari resep satu batch: bahan, kemasan, gas, listrik, dan tenaga.", "keywords": "hpp makanan,hpp minuman,modal per porsi,resep,batch,food cost,kuliner,warung", "since": "6.11.0"};
export function render(root) {

    const box = T.out();
    const rows = [];
    const listEl = T.el('<div></div>');

    const addRow = () => {
      const r = T.el('<div style="display:flex;gap:6px;margin-bottom:6px"></div>');
      const namaI = T.input('text', 'cth: Ayam 1 kg', '');
      namaI.style.flex = '1';
      const biayaI = T.input('text', 'Rp', '');
      biayaI.style.width = '110px';
      biayaI.style.flexShrink = '0';
      biayaI.inputMode = 'decimal';
      rows.push(biayaI);
      const del = T.btn('✕', () => {
        r.remove();
        rows.splice(rows.indexOf(biayaI), 1);
      });
      del.setAttribute('aria-label', 'Hapus bahan');
      del.style.flexShrink = '0';
      r.appendChild(namaI);
      r.appendChild(biayaI);
      r.appendChild(del);
      listEl.appendChild(r);
      namaI.focus();
    };

    const kemasanI = T.input('text', 'cth: 15000', '');
    kemasanI.inputMode = 'decimal';
    const gasI = T.input('text', 'cth: 20000', '');
    gasI.inputMode = 'decimal';
    const tenagaI = T.input('text', 'cth: 50000', '');
    tenagaI.inputMode = 'decimal';
    const porsiI = T.input('text', 'cth: 20', '');
    porsiI.inputMode = 'decimal';
    const marginI = T.input('text', 'cth: 30', '30');
    marginI.inputMode = 'decimal';

    const calc = () => {
      const bahan = rows.reduce((a, i) => {
        const n = T.num(i.value);
        return a + (n > 0 ? n : 0);
      }, 0);
      const kemasan = T.num(kemasanI.value) || 0;
      const gas = T.num(gasI.value) || 0;
      const tenaga = T.num(tenagaI.value) || 0;
      const porsi = T.num(porsiI.value);
      const margin = T.num(marginI.value);
      if (!isFinite(kemasan) || kemasan < 0 || !isFinite(gas) || gas < 0 || !isFinite(tenaga) || tenaga < 0 ||
          !isFinite(porsi) || porsi <= 0 || !isFinite(margin) || margin < 0 || margin >= 100) {
        T.toast('Isi semua kolom dengan angka yang benar ya (margin di bawah 100%).'); return;
      }
      if (bahan <= 0) { T.toast('Isi dulu minimal satu bahan dengan biayanya.'); return; }
      const total = bahan + kemasan + gas + tenaga;
      const hpp = total / porsi;
      const saran = hpp / (1 - margin / 100);
      const saranBulat = Math.ceil(saran / 100) * 100;
      T.show(box,
        '<div class="big center">' + T.rp(hpp) + ' <span class="mut" style="font-size:15px">/ porsi</span></div>' +
        '<p class="center">modal pokok tiap porsi (HPP)</p>' +
        kv('Total bahan satu batch', T.rp(bahan)) +
        kv('Kemasan', T.rp(kemasan)) +
        kv('Gas + listrik', T.rp(gas)) +
        kv('Tenaga', T.rp(tenaga)) +
        kv('Total biaya satu batch (' + porsi + ' porsi)', T.rp(total)) +
        kv('Saran harga jual (margin ' + margin + '%)', T.rp(saranBulat)) +
        kv('Laba per porsi di harga saran', T.rp(saranBulat - hpp)) +
        '<p class="hint">Rumus: HPP per porsi = total biaya satu batch ÷ jumlah porsi. Saran harga jual = HPP ÷ (1 − margin). Contoh dari angka di atas: total biaya ' + T.rp(total) + ' dibagi ' + porsi + ' porsi = ' + T.rp(hpp) + ' per porsi. Harga saran dibulatkan ke atas per Rp100 supaya mudah dikembalikan. Asumsi: semua bahan habis dalam satu batch dan tidak ada sisa yang terbuang.</p>');
    };

    root.appendChild(T.el('<p class="note">Satu resep jadi banyak porsi. Masukkan semua bahan dan biayanya, nanti ketahuan modal tiap porsinya.</p>'));
    root.appendChild(T.el('<div style="font-weight:600;margin-bottom:8px">Bahan per batch</div>'));
    root.appendChild(listEl);
    root.appendChild(T.row(T.btn('+ Tambah bahan', addRow)));
    root.appendChild(T.field('Biaya kemasan satu batch (Rp)', kemasanI, 'Box, cup, sendok, plastik, dan sejenisnya. Kosongkan bila tidak ada.'));
    root.appendChild(T.field('Biaya gas + listrik satu batch (Rp)', gasI, 'Perkiraan gas dan listrik untuk masak satu batch ini.'));
    root.appendChild(T.field('Biaya tenaga satu batch (Rp)', tenagaI, 'Upah yang masak dan yang bantu, untuk satu batch ini.'));
    root.appendChild(T.grid2(
      T.field('Jadi berapa porsi?', porsiI, 'Satu batch menghasilkan berapa porsi.'),
      T.field('Target margin (%)', marginI, 'Mau ambil untung berapa persen dari harga jual.')
    ));
    root.appendChild(T.row(T.btn('Hitung HPP per Porsi', calc, true)));
    root.appendChild(box);
    addRow();
    addRow();
    addRow();

}
