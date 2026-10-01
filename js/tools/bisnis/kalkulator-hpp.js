import { h as T, kv } from '../../core.js?v=6.5.0';

export const meta = {"id": "kalkulator-hpp", "name": "Kalkulator HPP", "cat": "bisnis", "icon": "🏭", "desc": "Hitung biaya pokok per unit + saran harga jual.", "keywords": "hpp,harga pokok,produksi,biaya,unit,modal"};
export function render(root) {

    const matI = T.input('text', 'cth: 2000000', '');
    const kerjaI = T.input('text', 'cth: 1500000', '');
    const ovI = T.input('text', 'cth: 500000', '');
    const unitI = T.input('text', 'cth: 100', '');
    const marginI = T.input('text', 'cth: 30', '');
    const box = T.out();

    const calc = () => {
      const mat = T.num(matI.value), kerja = T.num(kerjaI.value), ov = T.num(ovI.value);
      const unit = T.num(unitI.value), mp = T.num(marginI.value);
      if (![mat, kerja, ov, unit, mp].every(isFinite) || mat < 0 || kerja < 0 || ov < 0 || unit <= 0 || mp < 0 || mp >= 100) {
        T.toast('Isi semua kolom dengan valid (margin < 100%)'); return;
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

    root.appendChild(T.el('<p class="note">Jangan asal tebak harga — hitung dulu <b>biaya pokok</b> tiap unitnya, baru tentuin mau ambil margin berapa.</p>'));
    root.appendChild(T.field('Biaya material (Rp)', matI, 'Bahan baku satu batch produksi.'));
    root.appendChild(T.field('Biaya tenaga kerja (Rp)', kerjaI, 'Upah yang bikin satu batch ini.'));
    root.appendChild(T.field('Biaya overhead (Rp)', ovI, 'Listrik, sewa, packaging, dll.'));
    root.appendChild(T.field('Jumlah unit produksi', unitI, 'Satu batch jadi berapa pcs?'));
    root.appendChild(T.field('Target margin (%)', marginI, 'Mau ambil untung berapa persen dari harga jual.'));
    root.appendChild(T.row(T.btn('Hitung HPP', calc, true)));
    root.appendChild(box);

}
