import { h as T, kv } from '../../core.js?v=6.12.1';

export const meta = {"id": "roas-iklan", "name": "ROAS Iklan", "cat": "bisnis", "icon": "📣", "desc": "Cek apakah uang iklan balik modal: ROAS, untung iklan, dan berapa penjualan supaya iklan impas.", "keywords": "roas,iklan,ads,bep iklan,balik modal,facebook ads,tiktok ads,meta ads", "since": "6.11.0"};
export function render(root) {

    const biayaI = T.input('text', 'cth: 500000', '');
    biayaI.inputMode = 'decimal';
    const omzetI = T.input('text', 'cth: 2000000', '');
    omzetI.inputMode = 'decimal';
    const marginI = T.input('text', 'cth: 40', '40');
    marginI.inputMode = 'decimal';
    const hargaI = T.input('text', 'cth: 50000 (kosongkan bila tidak perlu)', '');
    hargaI.inputMode = 'decimal';
    const box = T.out();

    const fmtX = (n) => n.toLocaleString('id-ID', { maximumFractionDigits: 2 }) + 'x';

    const calc = () => {
      const biaya = T.num(biayaI.value);
      const omzet = T.num(omzetI.value);
      const margin = T.num(marginI.value);
      const harga = T.num(hargaI.value);
      if (!isFinite(biaya) || biaya <= 0 || !isFinite(omzet) || omzet < 0 ||
          !isFinite(margin) || margin <= 0 || margin >= 100 ||
          (hargaI.value.trim() !== '' && (!isFinite(harga) || harga <= 0))) {
        T.toast('Isi semua kolom dengan angka yang benar ya (margin 0 sampai 100%).'); return;
      }
      const roas = omzet / biaya;
      const bepRoas = 100 / margin;
      const labaKotor = omzet * margin / 100;
      const untungIklan = labaKotor - biaya;
      const omzetImpas = biaya / (margin / 100);
      const untung = untungIklan >= 0;
      const warna = untung ? '#22c55e' : '#ef4444';
      const status = untung
        ? 'iklan sudah balik modal dan untung'
        : 'iklan belum balik modal';
      let unitRow = '';
      if (hargaI.value.trim() !== '') {
        const unitImpas = Math.ceil(omzetImpas / harga);
        unitRow = kv('Penjualan supaya iklan impas', unitImpas.toLocaleString('id-ID') + ' unit (di harga ' + T.rp(harga) + ' per unit)');
      }
      T.show(box,
        '<div class="big center" style="color:' + warna + '">' + fmtX(roas) + '</div>' +
        '<p class="center">ROAS, ' + status + ' (tiap Rp1 iklan balik jadi ' + T.rp(roas) + ' omzet)</p>' +
        kv('Biaya iklan', T.rp(biaya)) +
        kv('Omzet dari iklan', T.rp(omzet)) +
        kv('Laba kotor dari omzet iklan (' + margin + '%)', T.rp(labaKotor)) +
        kv('Untung/rugi iklan', T.rp(untungIklan)) +
        kv('ROAS impas (BEP)', fmtX(bepRoas)) +
        kv('Omzet supaya iklan impas', T.rp(omzetImpas)) +
        unitRow +
        '<p class="hint">Rumus: ROAS = omzet dari iklan ÷ biaya iklan. Iklan baru untung bila laba kotornya menutup biaya iklan, jadi ROAS impas = 100 ÷ margin kotor. Contoh dari angka di atas: omzet ' + T.rp(omzet) + ' dibagi biaya ' + T.rp(biaya) + ' = ' + fmtX(roas) + '. Margin ' + margin + '% berarti ROAS impas ' + fmtX(bepRoas) + ', dan omzet impas ' + T.rp(biaya) + ' ÷ ' + margin + '% = ' + T.rp(omzetImpas) + '. Asumsi: margin kotor sudah memotong HPP tapi belum memotong biaya tetap seperti sewa dan gaji.</p>');
    };

    root.appendChild(T.el('<p class="note">Omzet besar dari iklan belum tentu untung. Yang menentukan itu margin: kalau margin tipis, ROAS harus tinggi supaya iklan tidak boncos.</p>'));
    root.appendChild(T.field('Biaya iklan (Rp)', biayaI, 'Total uang yang dihabiskan untuk iklan di periode ini.'));
    root.appendChild(T.field('Omzet dari iklan (Rp)', omzetI, 'Total penjualan yang datang dari iklan itu.'));
    root.appendChild(T.field('Margin kotor (%)', marginI, 'Persen untung kotor dari harga jual, setelah HPP. Contoh: jual 50 ribu, HPP 30 ribu, margin 40%.'));
    root.appendChild(T.field('Harga jual rata-rata per unit (Rp, opsional)', hargaI, 'Diisi bila mau tahu berapa unit yang harus terjual supaya iklan impas.'));
    root.appendChild(T.row(T.btn('Hitung ROAS', calc, true)));
    root.appendChild(box);

}
