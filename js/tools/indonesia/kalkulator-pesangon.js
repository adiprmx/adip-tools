import { h as T, utils, kv } from '../../core.js?v=6.4.0';

const upX = (th) => th < 1 ? 1 : th < 2 ? 2 : th < 3 ? 3 : th < 4 ? 4 : th < 5 ? 5 : th < 6 ? 6 : th < 7 ? 7 : th < 8 ? 8 : 9;
const upmkX = (th) => th < 3 ? 0 : th < 6 ? 2 : th < 9 ? 3 : th < 12 ? 4 : th < 15 ? 5 : th < 18 ? 6 : th < 21 ? 7 : th < 24 ? 8 : 10;

export const meta = {"id": "kalkulator-pesangon", "name": "Kalkulator Pesangon", "cat": "indonesia", "icon": "💼", "desc": "Estimasi uang pesangon (UP + UPMK + UPH) ala PP 35/2021.", "keywords": "pesangon,phk,up,upmk,uph,pp 35,karyawan,kerja,gaji"};
export function render(root) {

    const inGaji = T.input('text', 'Gaji/upah per bulan (Rp)', '');
    const inTh = T.input('number', 'Masa kerja (tahun, cth: 5.5)', '1');
    inTh.setAttribute('step', '0.5');
    inTh.setAttribute('min', '0');
    const inAlasan = T.select([
      ['biasa', 'PHK biasa'],
      ['efisiensi', 'Efisiensi perusahaan'],
      ['pensiun', 'Pensiun'],
      ['meninggal', 'Meninggal dunia'],
    ], 'biasa');
    const R = { biasa: 1, efisiensi: 0.5, pensiun: 1.75, meninggal: 2 };
    const box = T.out();
    const hitung = () => {
      const gaji = T.num(inGaji.value), th = Number(inTh.value);
      if (!(gaji > 0) || !(th >= 0)) { T.show(box, '<p class="warn">Isi gaji dan masa kerja dengan angka yang benar ya.</p>'); return; }
      const r = R[inAlasan.value] || 1;
      const upEff = upX(th) * r;
      const up = gaji * upEff;
      const upmkEff = upmkX(th);
      const upmk = gaji * upmkEff;
      const uph = 0.15 * (up + upmk);
      const total = up + upmk + uph;
      const alasanTxt = inAlasan.options && inAlasan.options[inAlasan.selectedIndex]
        ? inAlasan.options[inAlasan.selectedIndex].textContent
        : inAlasan.value;
      T.show(box,
        kv('Uang Pesangon (UP)', T.rp(up) + ' <span class="mut">(' + upEff + '× upah)</span>') +
        kv('Uang Penghargaan Masa Kerja (UPMK)', T.rp(upmk) + ' <span class="mut">(' + upmkEff + '× upah)</span>') +
        kv('Uang Penggantian Hak (UPH)', T.rp(uph) + ' <span class="mut">(±15%)</span>') +
        '<div class="big center" style="margin-top:10px">' + T.rp(total) + '</div>' +
        '<p class="center hint">Total estimasi pesangon</p>' +
        '<p class="hint">Versi sederhana dari PP 35/2021 — alasan: ' + T.esc(alasanTxt) + '. Angka ini ilustrasi, konsultasikan ke HRD atau serikat pekerja untuk angka pastinya.</p>');
    };
    root.appendChild(T.grid2(T.field('Gaji / upah per bulan (Rp)', inGaji), T.field('Masa kerja (tahun)', inTh)));
    root.appendChild(T.field('Alasan PHK', inAlasan));
    root.appendChild(T.row(T.btn('Hitung pesangon', hitung, true)));
    root.appendChild(box);

}
