import { h as T, kv } from '../../core.js?v=6.5.0';

export const meta = {"id": "break-even-point", "name": "Break-Even Point", "cat": "bisnis", "icon": "⚖️", "desc": "Jual berapa unit biar modal balik? Cari titik impasmu.", "keywords": "bep,break even,titik impas,modal balik,unit,usaha"};
export function render(root) {

    const fixedI = T.input('text', 'cth: 5000000', '');
    const variI = T.input('text', 'cth: 20000', '');
    const hargaI = T.input('text', 'cth: 50000', '');
    const box = T.out();

    const calc = () => {
      const fixed = T.num(fixedI.value), vari = T.num(variI.value), harga = T.num(hargaI.value);
      if (![fixed, vari, harga].every(isFinite) || fixed < 0 || vari < 0 || harga <= 0) {
        T.toast('Isi ketiga angka dengan valid dulu'); return;
      }
      if (harga <= vari) {
        T.show(box, '<p class="err">Harga jual (' + T.rp(harga) + ') harus lebih besar dari biaya variabel (' + T.rp(vari) + ') — kalau nggak, tiap unit yang kejual malah nombok.</p>');
        return;
      }
      const margin = harga - vari;
      const bepUnit = Math.ceil(fixed / margin);
      const bepRp = (fixed / margin) * harga;
      T.show(box,
        '<div class="big center">' + bepUnit + ' <span class="mut" style="font-size:15px">unit</span></div>' +
        '<p class="center">itu titik impasmu — di bawah ini kamu rugi, di atas ini kamu untung.</p>' +
        kv('Margin kontribusi / unit', T.rp(margin)) +
        kv('BEP dalam rupiah', T.rp(bepRp)) +
        kv('Profit tiap unit setelah BEP', T.rp(margin)) +
        '<p class="hint">Margin kontribusi = harga jual − biaya variabel. Setelah lewat ' + bepUnit + ' unit, tiap 1 unit tambahan nyumbang ' + T.rp(margin) + ' ke profit.</p>');
    };

    root.appendChild(T.el('<p class="note">Titik impas = jualanmu <b>balik modal</b>, belum untung belum rugi. Isi biayanya di bawah.</p>'));
    root.appendChild(T.field('Biaya tetap / fixed cost (Rp)', fixedI, 'Sewa, gaji, langganan — yang keluar walau nggak jualan.'));
    root.appendChild(T.field('Biaya variabel per unit (Rp)', variI, 'Bahan & ongkir per pcs — yang nambah tiap ada yang beli.'));
    root.appendChild(T.field('Harga jual per unit (Rp)', hargaI));
    root.appendChild(T.row(T.btn('Hitung BEP', calc, true)));
    root.appendChild(box);

}
