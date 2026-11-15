import { h as T, utils, dlNodePng } from '../../core.js?v=6.12.0';

const parseRp = (s) => { s = String(s||'').trim().replace(/\s/g,''); if (!s) return NaN; if (s.includes(',')) return Number(s.replace(/\./g,'').replace(',','.')); if (/^\d{1,3}(\.\d{3})+$/.test(s)) return Number(s.replace(/\./g,'')); return Number(s); };

const SATUAN = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
function terbilang(n) {
  n = Math.floor(Math.abs(n));
  if (n === 0) return 'nol';
  if (n < 12) return SATUAN[n];
  if (n < 20) return terbilang(n - 10) + ' belas';
  if (n < 100) return terbilang(Math.floor(n / 10)) + ' puluh' + (n % 10 ? ' ' + terbilang(n % 10) : '');
  if (n < 200) return 'seratus' + (n % 100 ? ' ' + terbilang(n % 100) : '');
  if (n < 1000) return terbilang(Math.floor(n / 100)) + ' ratus' + (n % 100 ? ' ' + terbilang(n % 100) : '');
  if (n < 2000) return 'seribu' + (n % 1000 ? ' ' + terbilang(n % 1000) : '');
  if (n < 1e6) return terbilang(Math.floor(n / 1000)) + ' ribu' + (n % 1000 ? ' ' + terbilang(n % 1000) : '');
  if (n < 1e9) return terbilang(Math.floor(n / 1e6)) + ' juta' + (n % 1e6 ? ' ' + terbilang(n % 1e6) : '');
  if (n < 1e12) return terbilang(Math.floor(n / 1e9)) + ' miliar' + (n % 1e9 ? ' ' + terbilang(n % 1e9) : '');
  if (n < 1e15) return terbilang(Math.floor(n / 1e12)) + ' triliun' + (n % 1e12 ? ' ' + terbilang(n % 1e12) : '');
  return 'angka terlalu besar';
}
const kapital = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const tglIndo = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return iso || '-';
  return (+m[3]) + ' ' + BULAN[+m[2] - 1] + ' ' + m[1];
};

export const meta = {"id": "kwitansi", "name": "Pembuat Kwitansi", "cat": "bisnis", "icon": "🧾", "desc": "Bikin kwitansi pembayaran yang rapi dengan terbilang otomatis, siap cetak atau dibagikan.", "keywords": "kwitansi,pembayaran,bukti bayar,terbilang,cetak,struk"};
export function render(root) {

    const now = new Date();
    const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    const nomorI = T.input('text', 'cth: 001/XI/2026 (boleh dikosongkan)', '');
    const dariI = T.input('text', 'cth: Budi Santoso', '');
    const untukI = T.ta(2, 'cth: Pembayaran sewa kos bulan November 2026', '');
    const jumlahI = T.input('text', 'cth: 1.500.000', '');
    const tglI = T.input('date', '', today);
    const kotaI = T.input('text', 'cth: Depok', '');
    const penerimaI = T.input('text', 'cth: Siti Aminah', '');
    const box = T.out();
    let teksKwitansi = '';

    const buat = () => {
      const jumlah = parseRp(jumlahI.value);
      const dari = dariI.value.trim();
      const untuk = untukI.value.trim();
      const penerima = penerimaI.value.trim();
      if (!dari || !untuk || !penerima || !isFinite(jumlah) || jumlah <= 0) {
        T.toast('Isi dulu: diterima dari, untuk pembayaran, jumlah, dan nama penerima.'); return;
      }
      const nomor = nomorI.value.trim();
      const kota = kotaI.value.trim();
      const tb = kapital(terbilang(jumlah)) + ' rupiah';
      const tgl = tglIndo(tglI.value);
      const tempatTgl = (kota ? kota + ', ' : '') + tgl;

      teksKwitansi =
        'KWITANSI' + (nomor ? '\nNo: ' + nomor : '') + '\n\n' +
        'Telah diterima dari: ' + dari + '\n' +
        'Uang sejumlah: ' + tb + '\n' +
        'Untuk pembayaran: ' + untuk + '\n\n' +
        'Jumlah: ' + T.rp(jumlah) + '\n\n' +
        tempatTgl + '\n' +
        'Diterima oleh,\n\n\n' +
        '( ' + penerima + ' )';

      const kwitansiHtml =
        '<div id="kwitansi-cetak" style="background:#fff;color:#111;border:2px solid #111;border-radius:10px;padding:22px 20px;font-family:Georgia,serif;line-height:1.6">' +
        '<div style="text-align:center"><div style="font-size:22px;font-weight:bold;letter-spacing:3px">KWITANSI</div>' +
        (nomor ? '<div style="font-size:13px">No. ' + T.esc(nomor) + '</div>' : '') + '</div>' +
        '<hr style="border:none;border-top:1px solid #111;margin:14px 0">' +
        '<table style="width:100%;font-size:14px;border-collapse:collapse">' +
        '<tr><td style="width:150px;vertical-align:top;padding:4px 0">Telah diterima dari</td><td style="padding:4px 0">: <b>' + T.esc(dari) + '</b></td></tr>' +
        '<tr><td style="vertical-align:top;padding:4px 0">Uang sejumlah</td><td style="padding:4px 0">: <i>' + T.esc(tb) + '</i></td></tr>' +
        '<tr><td style="vertical-align:top;padding:4px 0">Untuk pembayaran</td><td style="padding:4px 0">: ' + T.esc(untuk) + '</td></tr>' +
        '</table>' +
        '<div style="margin:14px 0;padding:10px 14px;border:1px solid #111;border-radius:6px;font-size:18px;font-weight:bold">' + T.rp(jumlah) + '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-end;font-size:14px">' +
        '<div>' + T.esc(tempatTgl) + '</div>' +
        '<div style="text-align:center">Diterima oleh,<br><br><br><b>( ' + T.esc(penerima) + ' )</b></div>' +
        '</div></div>';

      T.show(box, kwitansiHtml +
        '<div class="row" style="margin-top:12px">' +
        '<button class="btn primary" data-aksi="cetak">Cetak</button>' +
        '<button class="btn" data-aksi="salin">Salin Teks</button>' +
        '<button class="btn" data-aksi="png">Unduh PNG</button>' +
        '</div>' +
        '<p class="hint">Tombol Cetak membuka dialog cetak browser — pilih "Simpan sebagai PDF" bila mau versi PDF.</p>');
      box.querySelector('[data-aksi="cetak"]').addEventListener('click', () => window.print());
      box.querySelector('[data-aksi="salin"]').addEventListener('click', () => T.copy(teksKwitansi));
      box.querySelector('[data-aksi="png"]').addEventListener('click', () => {
        const node = box.querySelector('#kwitansi-cetak');
        if (node) dlNodePng(node, 'kwitansi.png');
      });
    };

    root.appendChild(T.el('<p class="note">Isi form di bawah, kwitansi rapi langsung jadi — terbilangnya ditulis otomatis, tinggal cetak atau bagikan. Untuk usaha sendiri.</p>'));
    root.appendChild(T.field('Nomor kwitansi (opsional)', nomorI));
    root.appendChild(T.field('Telah diterima dari', dariI, 'Nama orang yang membayar.'));
    root.appendChild(T.field('Untuk pembayaran', untukI, 'Pembayaran apa — cth: sewa kos, DP pesanan, les privat.'));
    root.appendChild(T.grid2(
      T.field('Jumlah (Rp)', jumlahI),
      T.field('Tanggal', tglI)
    ));
    root.appendChild(T.grid2(
      T.field('Kota (opsional)', kotaI, 'Muncul di samping tanggal.'),
      T.field('Nama penerima', penerimaI, 'Nama yang tanda tangan di kwitansi.')
    ));
    root.appendChild(T.row(T.btn('Buat Kwitansi', buat, true)));
    root.appendChild(box);

}
