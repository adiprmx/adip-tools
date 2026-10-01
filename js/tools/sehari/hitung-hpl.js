import { h as T, kv } from '../../core.js?v=6.5.0';

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const fmtTgl = (d) => HARI[d.getUTCDay()] + ', ' + d.getUTCDate() + ' ' + BULAN[d.getUTCMonth()] + ' ' + d.getUTCFullYear();

export const meta = {"id": "hitung-hpl", "name": "Hitung HPL", "cat": "sehari", "icon": "🤰", "desc": "Perkiraan hari lahir (HPL) + usia kehamilan dari HPHT.", "keywords": "hpl,hari lahir,kehamilan,hpht,naegele,trimester,usg"};
export function render(root) {

    const tgl = T.input('date');
    const box = T.out();

    const calc = () => {
      if (!tgl.value) { T.toast('Pilih tanggal HPHT dulu'); return; }
      const [y, mo, d] = tgl.value.split('-').map(Number);
      const hpht = new Date(Date.UTC(y, mo - 1, d));
      if (isNaN(hpht.getTime())) { T.toast('Tanggal HPHT nggak valid'); return; }

      // Rumus Naegele: HPHT + 7 hari, − 3 bulan, + 1 tahun
      const hpl = new Date(hpht.getTime());
      hpl.setUTCDate(hpl.getUTCDate() + 7);
      hpl.setUTCMonth(hpl.getUTCMonth() - 3);
      hpl.setUTCFullYear(hpl.getUTCFullYear() + 1);

      const now = new Date();
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const diffHari = Math.round((today - hpht) / 86400000);

      let usiaHtml = '', trimesterHtml = '';
      if (diffHari < 0) {
        usiaHtml = '<p class="warn">HPHT-nya masih di masa depan — kehamilannya belum mulai dihitung.</p>';
      } else if (diffHari > 294) {
        usiaHtml = '<p class="err">Sudah lewat 42 minggu dari HPHT. Segera konsultasi ke dokter atau bidan ya.</p>';
      } else {
        const minggu = Math.floor(diffHari / 7);
        const sisa = diffHari % 7;
        const tri = minggu < 14 ? 1 : minggu <= 27 ? 2 : 3;
        usiaHtml = kv('Usia kehamilan', minggu + ' minggu ' + sisa + ' hari');
        trimesterHtml = kv('Trimester', 'Trimester ' + tri + (tri === 1 ? ' — masa pembentukan organ, jaga asupan & hindari yang berisiko' : tri === 2 ? ' — biasanya paling nyaman, janin tumbuh pesat' : ' — persiapan persalinan, kontrol makin rutin'));
      }

      T.show(box,
        '<div class="big center">' + fmtTgl(hpl) + '</div>' +
        '<p class="center">Hari Perkiraan Lahir (HPL)</p>' +
        usiaHtml + trimesterHtml +
        kv('HPHT', fmtTgl(hpht)) +
        '<p class="hint">Dihitung pakai rumus Naegele: HPHT + 7 hari, − 3 bulan, + 1 tahun. Ini cuma perkiraan kasar — HPL bisa maju atau mundur. Hasil USG trimester pertama biasanya lebih akurat.</p>');
    };
    tgl.addEventListener('change', calc);

    root.appendChild(T.el('<p class="note">HPHT = <b>Hari Pertama Haid Terakhir</b>. Dari situ bisa diperkirain kapan si kecil lahir & usia kehamilan sekarang.</p>'));
    root.appendChild(T.field('HPHT', tgl));
    root.appendChild(T.row(T.btn('Hitung HPL', calc, true)));
    root.appendChild(box);

}
