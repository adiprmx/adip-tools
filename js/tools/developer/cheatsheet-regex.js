import { h as T, utils } from '../../core.js?v=6.7.0';

/* Diekspor supaya pola bisa diuji otomatis dari node. */
export const POLA = [
  { nama: 'Email', pola: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
    jelas: 'Satu @, ada teks sebelum & sesudahnya, dan ada titik di domain. Contoh: nama@mail.com' },
  { nama: 'URL', pola: '^https?:\\/\\/[^\\s\\/$.?#].[^\\s]*$',
    jelas: 'Diawali http:// atau https://, sisanya tanpa spasi. Contoh: https://adipmusic.my.id' },
  { nama: 'Tanggal (DD/MM/YYYY)', pola: '^(0[1-9]|[12][0-9]|3[01])\\/(0[1-9]|1[0-2])\\/\\d{4}$',
    jelas: 'Tanggal 01–31, bulan 01–12, tahun 4 digit. Contoh: 01/10/2026' },
  { nama: 'Nomor HP Indonesia', pola: '^(?:\\+?62|0)8\\d{7,11}$',
    jelas: 'Diawali 08 / 628 / +628, total 10–14 digit. Contoh: 081234567890' },
  { nama: 'Username', pola: '^[a-zA-Z0-9_]{3,16}$',
    jelas: 'Huruf, angka, underscore — 3 sampai 16 karakter. Contoh: adip_rmx' },
  { nama: 'Warna Hex', pola: '^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$',
    jelas: 'Diawali #, lalu 3 atau 6 digit hex. Contoh: #ffffff, #1a2' },
  { nama: 'Alamat IPv4', pola: '^(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)$',
    jelas: 'Empat oktet 0–255 dipisah titik. Contoh: 192.168.1.1' },
  { nama: 'Slug', pola: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
    jelas: 'Huruf kecil, angka, strip di tengah — tanpa spasi. Contoh: judul-artikel-baru' },
];

export const meta = {"id": "cheatsheet-regex", "name": "Cheatsheet Regex", "cat": "developer", "icon": "📜", "desc": "8 pola regex umum + tester mini tiap kartu.", "keywords": "regex,regular expression,validasi,pola,email,url"};

export function render(root) {

    root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Pola-pola regex yang paling sering dipakai, siap salin. Ketuk polanya buat nyalin, terus coba langsung di tester mini tiap kartu.</p>'));

    const bungkus = T.el('<div style="display:grid;gap:10px"></div>');
    root.appendChild(bungkus);

    POLA.forEach((p) => {
      const kartu = T.el('<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px"></div>');
      kartu.appendChild(T.el('<b style="font-size:14px">' + T.esc(p.nama) + '</b>'));
      kartu.appendChild(T.el('<div class="dim" style="font-size:12.5px;margin:4px 0 8px;line-height:1.5">' + T.esc(p.jelas) + '</div>'));

      const kode = T.el('<code style="display:block;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:9px 10px;font-size:12.5px;word-break:break-all;cursor:pointer" title="Ketuk untuk menyalin">' + T.esc(p.pola) + '</code>');
      kode.addEventListener('click', () => T.copy(p.pola));
      kartu.appendChild(kode);
      kartu.appendChild(T.el('<div class="hint" style="margin:4px 0 8px">👆 ketuk pola buat menyalin</div>'));

      const uji = T.input('text', 'Coba teks di sini…');
      const hasil = T.out();
      const re = new RegExp(p.pola);
      uji.addEventListener('input', () => {
        const v = uji.value;
        if (!v) { T.hide(hasil); return; }
        if (re.test(v)) {
          T.show(hasil, '<span class="ok">✅ Cocok! <mark style="background:#3f6212;color:#fff;border-radius:4px;padding:1px 4px">' + T.esc(v) + '</mark></span>');
        } else {
          T.show(hasil, '<span class="err">❌ Nggak cocok sama pola di atas.</span>');
        }
      });
      kartu.appendChild(T.row(uji));
      kartu.appendChild(hasil);
      bungkus.appendChild(kartu);
    });
}
