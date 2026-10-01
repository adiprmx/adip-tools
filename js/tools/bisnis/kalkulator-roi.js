import { h as T, kv } from '../../core.js?v=6.6.0';

export const meta = {"id": "kalkulator-roi", "name": "Kalkulator ROI", "cat": "bisnis", "icon": "📈", "desc": "Ukur balik modal: ROI %, profit, dan payback period.", "keywords": "roi,return,investasi,balik modal,payback,profit"};
export function render(root) {

    const invI = T.input('text', 'cth: 10000000', '');
    const backI = T.input('text', 'cth: 13500000', '');
    const durI = T.input('text', 'cth: 12', '');
    const box = T.out();

    const calc = () => {
      const inv = T.num(invI.value), back = T.num(backI.value), dur = T.num(durI.value);
      if (![inv, back, dur].every(isFinite) || inv <= 0 || back < 0 || dur <= 0) {
        T.toast('Isi ketiga angka dengan valid dulu'); return;
      }
      const profit = back - inv;
      const roi = (profit / inv) * 100;
      const profitBulan = profit / dur;
      const verdict = roi > 0
        ? 'Menguntungkan — modal balik plus profit ' + T.rp(profit) + '.'
        : roi === 0
          ? 'Impas — modal balik tapi nggak ada untungnya.'
          : 'Rugi — kamu kehilangan ' + T.rp(-profit) + ' dari investasi ini.';
      T.show(box,
        '<div class="big center">' + (roi > 0 ? '+' : '') + roi.toFixed(1) + ' <span class="mut" style="font-size:15px">%</span></div>' +
        '<p class="center">return on investment</p>' +
        kv('Total profit', T.rp(profit)) +
        kv('Profit rata-rata / bulan', T.rp(profitBulan)) +
        kv('Payback period', profit > 0 ? (inv / profitBulan).toFixed(1) + ' bulan' : 'nggak tercapai') +
        '<p class="' + (roi > 0 ? 'info' : roi === 0 ? 'warn' : 'err') + '">' + verdict + '</p>');
    };

    root.appendChild(T.el('<p class="note">Naro duit di usaha itu harus diukur — jangan cuma "kayaknya untung". Masukkin angkanya, biar jelas.</p>'));
    root.appendChild(T.field('Total investasi (Rp)', invI, 'Semua modal yang dikeluarin.'));
    root.appendChild(T.field('Total nilai kembali (Rp)', backI, 'Semua yang balik: hasil jualan, sisa aset, dll.'));
    root.appendChild(T.field('Durasi (bulan)', durI, 'Jangka waktu investasi berjalan.'));
    root.appendChild(T.row(T.btn('Hitung ROI', calc, true)));
    root.appendChild(box);

}
