import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-hpp", "name": "Kalkulator HPP", "cat": "bisnis", "icon": "🏭", "desc": "Hitung biaya pokok per unit + saran harga jual. Mode umum atau makanan per porsi.", "keywords": "hpp,harga pokok,produksi,biaya,unit,modal,hpp makanan,modal per porsi,resep,batch,food cost,kuliner,warung"};
export function render(root) {

    const modeSel = T.select([
      ['umum', 'Umum — material + tenaga + overhead'],
      ['makanan', 'Makanan — bahan per batch + kemasan + gas'],
    ], 'umum');
    const box = T.out();

    // --- Mode umum: 3 lump sum ---
    const matI = T.input('text', 'cth: 2000000', '');
    const kerjaI = T.input('text', 'cth: 1500000', '');
    const ovI = T.input('text', 'cth: 500000', '');
    const unitI = T.input('text', 'cth: 100', '');
    const marginI = T.input('text', 'cth: 30', '');

    const calcUmum = () => {
      const mat = T.num(matI.value), kerja = T.num(kerjaI.value), ov = T.num(ovI.value);
      const unit = T.num(unitI.value), mp = T.num(marginI.value);
      if (![mat, kerja, ov, unit, mp].every(isFinite) || mat < 0 || kerja < 0 || ov < 0 || unit <= 0 || mp < 0 || mp >= 100) {
        T.toast('Isi semua kolom dengan benar (margin < 100%)'); return;
      }
      const total = mat + kerja + ov;
      const hpp = total / unit;
      const saran = hpp / (1 - mp / 100);
      T.show(box,
        '<div class="big center">' + T.rp(hpp) + ' <span class="mut" style="font-size:15px">/ unit</span></div>' +
        '<p class="center">biaya pokok produksi per unit</p>' +
        kv('Total biaya produksi', T.rp(total)) +
        kv('↳ Material', T.rp(mat)) +
        kv('↳ Tenaga kerja', T.rp(kerja)) +
        kv('↳ Overhead', T.rp(ov)) +
        kv('Saran harga jual (margin ' + mp + '%)', T.rp(saran)) +
        kv('Estimasi profit / unit', T.rp(saran - hpp)) +
        '<p class="hint">HPP = total biaya ÷ jumlah unit. Saran harga jual = HPP ÷ (1 − margin).</p>');
    };

    // --- Mode makanan: baris bahan dinamis per batch ---
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
    const marginMI = T.input('text', 'cth: 30', '30');
    marginMI.inputMode = 'decimal';

    const calcMakanan = () => {
      const bahan = rows.reduce((a, i) => {
        const n = T.num(i.value);
        return a + (n > 0 ? n : 0);
      }, 0);
      const kemasan = T.num(kemasanI.value) || 0;
      const gas = T.num(gasI.value) || 0;
      const tenaga = T.num(tenagaI.value) || 0;
      const porsi = T.num(porsiI.value);
      const margin = T.num(marginMI.value);
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

    // --- Dua halaman mode ---
    const pageUmum = T.el('<div></div>');
    pageUmum.appendChild(T.field('Biaya material (Rp)', matI, 'Bahan baku satu batch produksi.'));
    pageUmum.appendChild(T.field('Biaya tenaga kerja (Rp)', kerjaI, 'Upah yang bikin satu batch ini.'));
    pageUmum.appendChild(T.field('Biaya overhead (Rp)', ovI, 'Listrik, sewa, packaging, dll.'));
    pageUmum.appendChild(T.field('Jumlah unit produksi', unitI, 'Satu batch jadi berapa pcs?'));
    pageUmum.appendChild(T.field('Target margin (%)', marginI, 'Mau ambil untung berapa persen dari harga jual.'));
    pageUmum.appendChild(T.row(T.btn('Hitung HPP', calcUmum, true)));

    const pageMakanan = T.el('<div></div>');
    pageMakanan.appendChild(T.el('<p class="note">Satu resep jadi banyak porsi. Masukkan semua bahan dan biayanya, nanti ketahuan modal tiap porsinya.</p>'));
    pageMakanan.appendChild(T.el('<div style="font-weight:600;margin-bottom:8px">Bahan per batch</div>'));
    pageMakanan.appendChild(listEl);
    pageMakanan.appendChild(T.row(T.btn('+ Tambah bahan', addRow)));
    pageMakanan.appendChild(T.field('Biaya kemasan satu batch (Rp)', kemasanI, 'Box, cup, sendok, plastik, dan sejenisnya. Kosongkan bila tidak ada.'));
    pageMakanan.appendChild(T.field('Biaya gas + listrik satu batch (Rp)', gasI, 'Perkiraan gas dan listrik untuk masak satu batch ini.'));
    pageMakanan.appendChild(T.field('Biaya tenaga satu batch (Rp)', tenagaI, 'Upah yang masak dan yang bantu, untuk satu batch ini.'));
    pageMakanan.appendChild(T.grid2(
      T.field('Jadi berapa porsi?', porsiI, 'Satu batch menghasilkan berapa porsi.'),
      T.field('Target margin (%)', marginMI, 'Mau ambil untung berapa persen dari harga jual.')
    ));
    pageMakanan.appendChild(T.row(T.btn('Hitung HPP per Porsi', calcMakanan, true)));

    const paintMode = () => {
      const m = modeSel.value === 'makanan';
      pageMakanan.hidden = !m;
      pageUmum.hidden = m;
      T.hide(box);
    };
    modeSel.addEventListener('change', paintMode);

    root.appendChild(T.el('<p class="note">Jangan asal tebak harga — hitung dulu <b>biaya pokok</b> tiap unitnya, baru tentuin mau ambil margin berapa.</p>'));
    root.appendChild(T.field('Jenis usaha', modeSel));
    root.appendChild(pageUmum);
    root.appendChild(pageMakanan);
    root.appendChild(box);
    addRow();
    addRow();
    addRow();
    paintMode();

}
