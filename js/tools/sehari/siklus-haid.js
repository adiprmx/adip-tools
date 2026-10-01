import { h as T, kv } from '../../core.js?v=6.8.0';

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
const fmtTgl = (d) => HARI[d.getUTCDay()] + ', ' + d.getUTCDate() + ' ' + BULAN[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
const fmtTglShort = (d) => d.getUTCDate() + ' ' + BULAN[d.getUTCMonth()] + ' ' + d.getUTCFullYear();

export const meta = {"id": "siklus-haid", "name": "Siklus Haid & Masa Subur", "cat": "sehari", "icon": "🌸", "desc": "Prediksi haid berikut & jendela masa subur dari HPHT.", "keywords": "haid,mens,masa subur,ovulasi,hpht,siklus,kehamilan"};
export function render(root) {

    const tgl = T.input('date');
    const siklusI = T.input('text', 'cth: 28', '28');
    const box = T.out();

    const calc = () => {
      if (!tgl.value) { T.toast('Pilih tanggal HPHT dulu'); return; }
      const [y, mo, d] = tgl.value.split('-').map(Number);
      const hpht = new Date(Date.UTC(y, mo - 1, d));
      const siklus = T.num(siklusI.value);
      if (isNaN(hpht.getTime()) || !isFinite(siklus) || siklus < 15 || siklus > 45) {
        T.toast('Tanggal HPHT / panjang siklus nggak valid (siklus 15–45 hari)'); return;
      }
      const haidBerikut = addDays(hpht, siklus);
      const ovulasi = addDays(haidBerikut, -14);
      const suburAwal = addDays(ovulasi, -5);
      const suburAkhir = addDays(ovulasi, 1);
      T.show(box,
        '<div class="big center">' + fmtTglShort(haidBerikut) + '</div>' +
        '<p class="center">prediksi haid berikut (' + HARI[haidBerikut.getUTCDay()] + ')</p>' +
        kv('HPHT', fmtTgl(hpht)) +
        kv('Ovulasi (perkiraan)', fmtTgl(ovulasi)) +
        kv('Jendela masa subur', fmtTgl(suburAwal) + ' — ' + fmtTgl(suburAkhir)) +
        '<p class="warn"><b>Penting:</b> ini cuma prediksi kalender, <b>BUKAN alat kontrasepsi</b> — jangan dipakai buat nentuin "aman" atau nggaknya. Siklus tiap orang bisa berubah-ubah. Kalau butuh yang akurat, konsultasi ke dokter atau bidan ya.</p>');
    };
    tgl.addEventListener('change', calc);

    root.appendChild(T.el('<p class="note">HPHT = <b>Hari Pertama Haid Terakhir</b>. Dari situ bisa diperkirain kapan haid berikut & kapan masa subur.</p>'));
    root.appendChild(T.field('HPHT', tgl));
    root.appendChild(T.field('Panjang siklus (hari)', siklusI, 'Jarak dari haid ke haid. Rata-rata 28 hari.'));
    root.appendChild(T.row(T.btn('Hitung', calc, true)));
    root.appendChild(box);

}
