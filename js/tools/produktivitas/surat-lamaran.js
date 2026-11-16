import { h as T, utils } from '../../core.js?v=6.13.0';

export const meta = {"id": "surat-lamaran", "name": "Pembuat Surat Lamaran", "cat": "produktivitas", "icon": "✉️", "desc": "Bikin surat lamaran kerja formal Bahasa Indonesia dari form singkat, siap salin atau cetak.", "keywords": "surat lamaran,lamaran kerja,lamar kerja,contoh surat lamaran,fresh graduate"};

/* <style> print disimpan referensinya supaya bisa DIHAPUS saat tool
   ditinggal (T.onLeave di render). Kalau menetap di <head>, aturan
   body *{visibility:hidden} bikin cetakan tool lain jadi blank. */
let _printCss = null;

function ensurePrintCss() {
  if (_printCss) return;
  const st = document.createElement('style');
  st.textContent =
    '@page{size:A4;margin:18mm 20mm}' +
    '@media print{' +
    'body *{visibility:hidden !important}' +
    '#surat-print,#surat-print *{visibility:visible !important}' +
    '#surat-print{position:absolute;inset:0;background:#fff;color:#000;padding:0}' +
    '#surat-print .surat-page{box-shadow:none !important;border:none !important;margin:0 !important;width:100% !important}' +
    '}';
  document.head.appendChild(st);
  _printCss = st;
}

function hapusPrintCss() {
  if (_printCss) { _printCss.remove(); _printCss = null; }
}

const LAMPIRAN_DEFAULT = [
  'Daftar Riwayat Hidup (CV)',
  'Fotokopi Ijazah terakhir',
  'Fotokopi Transkrip Nilai',
  'Fotokopi KTP',
  'Pas foto terbaru',
  'Sertifikat pendukung'
];

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export function render(root) {

    ensurePrintCss();
    T.onLeave(hapusPrintCss);

    const namaI = T.input('text', 'Nama lengkap', '');
    const tempatI = T.input('text', 'Tempat (untuk tanggal surat)', '');
    const alamatI = T.ta(2, 'Alamat lengkap', '');
    const telpI = T.input('text', 'Nomor HP / WhatsApp', '');
    const emailI = T.input('text', 'Email', '');
    const pendI = T.input('text', 'Pendidikan terakhir', '');
    const posisiI = T.input('text', 'Posisi yang dilamar', '');
    const perusahaanI = T.input('text', 'Nama perusahaan', '');
    const kotaPerI = T.input('text', 'Kota perusahaan (boleh kosong)', '');
    const sumberI = T.input('text', 'Dari mana tahu lowongan ini (boleh kosong)', '');
    const nadaI = T.select([['formal', 'Formal umum'], ['fresh', 'Fresh graduate (baru lulus)']], 'formal');
    const lampBox = T.el('<div></div>');
    const previewBox = T.out();
    const lampiran = LAMPIRAN_DEFAULT.map((nama) => ({ nama, on: true }));

    const esc = (s) => T.esc(String(s == null ? '' : s));
    const v = (el) => el.value.trim();

    const gambarLampiran = () => {
      lampBox.innerHTML = '';
      lampiran.forEach((l, i) => {
        const lbl = T.el('<label style="display:flex;align-items:center;gap:10px;font-size:14px;padding:6px 0;cursor:pointer"><input type="checkbox"' + (l.on ? ' checked' : '') + '> <span>' + esc(l.nama) + '</span></label>');
        lbl.querySelector('input').addEventListener('change', (e) => { l.on = e.target.checked; perbarui(); });
        lampBox.appendChild(lbl);
      });
      const tambah = T.row(
        T.input('text', 'Lampiran lain…', ''),
        T.btn('＋ Tambah', () => {
          const inp = tambah.querySelector('input');
          if (inp.value.trim()) { lampiran.push({ nama: inp.value.trim(), on: true }); gambarLampiran(); perbarui(); }
        })
      );
      lampBox.appendChild(tambah);
    };

    function tanggalSurat() {
      const d = new Date();
      return (v(tempatI) ? v(tempatI) + ', ' : '') + d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear();
    }

    function suratHtml() {
      const nama = v(namaI) || '(Nama lengkap)';
      const posisi = v(posisiI) || '(posisi yang dilamar)';
      const perus = v(perusahaanI) || '(nama perusahaan)';
      const pend = v(pendI) || '(pendidikan terakhir)';
      const fresh = nadaI.value === 'fresh';
      const lamp = lampiran.filter((l) => l.on).map((l) => l.nama);
      const sumber = v(sumberI);

      const pembuka = fresh
        ? 'Saya yang bertanda tangan di bawah ini, lulusan ' + pend + ', bermaksud mengajukan lamaran pekerjaan untuk posisi ' + posisi + ' di ' + perus + '.' +
          (sumber ? ' Informasi lowongan ini saya peroleh dari ' + sumber + '.' : '') +
          ' Sebagai lulusan baru, saya siap belajar, bekerja keras, dan mengikuti seluruh aturan perusahaan.'
        : 'Saya yang bertanda tangan di bawah ini bermaksud mengajukan lamaran pekerjaan untuk posisi ' + posisi + ' di ' + perus + '.' +
          (sumber ? ' Informasi lowongan ini saya peroleh dari ' + sumber + '.' : '');

      const isi2 = fresh
        ? 'Selama menempuh pendidikan, saya terbiasa bekerja dalam tim, disiplin terhadap tenggat waktu, dan aktif dalam kegiatan organisasi. Saya percaya bekal tersebut dapat menjadi dasar yang baik untuk berkontribusi di ' + perus + '.'
        : 'Saya memiliki latar belakang pendidikan ' + pend + ' dan siap memberikan kontribusi terbaik bagi ' + perus + '. Saya terbiasa bekerja dengan target, mampu bekerja sama dalam tim, serta disiplin dan bertanggung jawab dalam menyelesaikan pekerjaan.';

      return (
        '<div style="font-size:14px;line-height:1.7">' +
        '<div style="text-align:right">' + esc(tanggalSurat()) + '</div>' +
        '<div style="margin-top:16px">Hal: Lamaran Pekerjaan<br/>Lampiran: ' + (lamp.length || 0) + ' berkas</div>' +
        '<div style="margin-top:16px">Yth. HRD ' + esc(perus) + (v(kotaPerI) ? '<br/>di ' + esc(kotaPerI) : '') + '</div>' +
        '<div style="margin-top:16px">Dengan hormat,</div>' +
        '<p style="text-align:justify">' + esc(pembuka) + '</p>' +
        '<p style="text-align:justify">' + esc(isi2) + '</p>' +
        '<p style="text-align:justify">Sebagai bahan pertimbangan, bersama surat ini saya lampirkan:</p>' +
        '<ol style="margin:0 0 0 18px;padding:0">' +
        (lamp.length ? lamp.map((l) => '<li>' + esc(l) + '</li>').join('') : '<li>(belum ada lampiran dipilih)</li>') +
        '</ol>' +
        '<p style="text-align:justify">Demikian surat lamaran ini saya sampaikan. Besar harapan saya untuk diberi kesempatan mengikuti proses seleksi selanjutnya. Atas perhatian Bapak/Ibu, saya ucapkan terima kasih.</p>' +
        '<div style="margin-top:24px">Hormat saya,</div>' +
        '<div style="margin-top:48px"><b>' + esc(nama) + '</b>' +
        (v(alamatI) ? '<br/>' + esc(alamatI) : '') +
        (v(telpI) ? '<br/>Telp: ' + esc(telpI) : '') +
        (v(emailI) ? '<br/>Email: ' + esc(emailI) : '') +
        '</div></div>'
      );
    }

    function suratTeks() {
      const tmp = document.createElement('div');
      tmp.innerHTML = suratHtml();
      return tmp.innerText || tmp.textContent;
    }

    function perbarui() {
      T.show(previewBox,
        '<div id="surat-print"><div class="surat-page" style="background:#fff;color:#111;border:1px solid rgba(255,255,255,.15);border-radius:12px;max-width:720px;margin:0 auto;padding:28px 32px;font-family:Arial,Helvetica,sans-serif">' +
        suratHtml() +
        '</div></div>' +
        '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">' +
        '<button class="btn primary" data-act="print">🖨️ Cetak / Simpan PDF</button>' +
        '<button class="btn" data-act="copy">📋 Salin surat</button></div>');
      previewBox.querySelector('[data-act="print"]').addEventListener('click', () => window.print());
      previewBox.querySelector('[data-act="copy"]').addEventListener('click', () => T.copy(suratTeks()));
    }

    [namaI, tempatI, alamatI, telpI, emailI, pendI, posisiI, perusahaanI, kotaPerI, sumberI].forEach((el) => el.addEventListener('input', perbarui));
    nadaI.addEventListener('change', perbarui);

    root.appendChild(T.el('<p class="note">Isi form di bawah, surat lamaran formal langsung jadi. Periksa lagi sebelum dikirim — sesuaikan kalimatnya dengan keadaan kamu.</p>'));
    root.appendChild(T.field('Nada surat', nadaI));
    root.appendChild(T.grid2(T.field('Nama lengkap', namaI), T.field('Tempat (tanggal surat)', tempatI)));
    root.appendChild(T.field('Alamat', alamatI));
    root.appendChild(T.grid2(T.field('Nomor HP / WhatsApp', telpI), T.field('Email', emailI)));
    root.appendChild(T.grid2(T.field('Pendidikan terakhir', pendI), T.field('Posisi yang dilamar', posisiI)));
    root.appendChild(T.grid2(T.field('Nama perusahaan', perusahaanI), T.field('Kota perusahaan', kotaPerI)));
    root.appendChild(T.field('Sumber lowongan (boleh kosong)', sumberI, 'Contoh: Instagram perusahaan, Jobstreet, teman'));
    root.appendChild(T.el('<p class="dim" style="margin-top:12px">Lampiran yang disertakan</p>'));
    root.appendChild(lampBox);
    root.appendChild(T.el('<p class="dim" style="margin-top:16px">Hasil surat</p>'));
    root.appendChild(previewBox);
    gambarLampiran();
    perbarui();

}
