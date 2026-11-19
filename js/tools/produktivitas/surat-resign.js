import { h as T, utils, todayISO } from '../../core.js';

export const meta = {"id": "surat-resign", "name": "Pembuat Surat Pengunduran Diri", "cat": "produktivitas", "icon": "📝", "desc": "Bikin surat resign formal dari form singkat: jabatan, tanggal terakhir kerja, dan ucapan terima kasih, siap salin atau cetak.", "keywords": "surat resign,surat pengunduran diri,resign,keluar kerja,contoh surat resign", "since": "6.11.0"};

/* <style> print disimpan referensinya supaya bisa DIHAPUS saat tool
   ditinggal (T.onLeave di render). Kalau menetap di <head>, aturan
   body *{visibility:hidden} bikin cetakan tool lain jadi blank. */
// CSS cetak kanonis: utils.ensurePrintCss / utils.removePrintCss (core.js).



// BULAN kanonis tinggal di core.js (dipakai utils.fmtTanggal).

// isoHariIni -> todayISO dari core.js.

function isoPlusHari(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// fmtTanggal kanonis tinggal di utils (core.js).

export function render(root) {

    utils.ensurePrintCss('surat-resign-print', { page: '@page{size:A4;margin:18mm 20mm}', extra: '#surat-resign-print .surat-page{box-shadow:none !important;border:none !important;margin:0 !important;width:100% !important}' });
    T.onLeave(() => utils.removePrintCss('surat-resign-print'));

    const namaI = T.input('text', 'Nama lengkap', '');
    const jabatanI = T.input('text', 'Jabatan saat ini', '');
    const deptI = T.input('text', 'Departemen / divisi (boleh kosong)', '');
    const perusahaanI = T.input('text', 'Nama perusahaan', '');
    const kotaPerI = T.input('text', 'Kota perusahaan (boleh kosong)', '');
    const tempatI = T.input('text', 'Tempat (untuk tanggal surat)', '');
    const tglSuratI = T.input('date', '', todayISO());
    const tglAkhirI = T.input('date', '', isoPlusHari(30));
    const alasanI = T.ta(2, 'Alasan mengundurkan diri (boleh kosong)', '');
    const terimaI = T.ta(2, 'Pesan terima kasih (boleh kosong, pakai kalimat standar)', '');
    const previewBox = T.out();
    const peringatanBox = T.out();

    const esc = (s) => T.esc(String(s == null ? '' : s));
    const v = (el) => el.value.trim();

    const TERIMA_STANDAR = (perus) =>
      'Saya mengucapkan terima kasih atas kesempatan, bimbingan, dan pengalaman yang saya peroleh selama bekerja di ' + perus + '. ' +
      'Saya berharap perusahaan terus maju dan sukses ke depannya.';

    function tanggalSurat() {
      const tgl = utils.fmtTanggal(v(tglSuratI)) || utils.fmtTanggal(todayISO());
      return (v(tempatI) ? v(tempatI) + ', ' : '') + tgl;
    }

    function suratHtml() {
      const nama = v(namaI) || '(Nama lengkap)';
      const jabatan = v(jabatanI) || '(jabatan)';
      const dept = v(deptI);
      const perus = v(perusahaanI) || '(nama perusahaan)';
      const tglAkhir = utils.fmtTanggal(v(tglAkhirI)) || '(tanggal terakhir kerja)';
      const alasan = v(alasanI);
      const terima = v(terimaI) || TERIMA_STANDAR(perus);

      const pAlasan = alasan
        ? '<p style="text-align:justify">Keputusan ini saya ambil karena ' + esc(alasan) + '</p>'
        : '';

      return (
        '<div style="font-size:14px;line-height:1.7">' +
        '<div style="text-align:right">' + esc(tanggalSurat()) + '</div>' +
        '<div style="margin-top:16px">Hal: Pengunduran Diri</div>' +
        '<div style="margin-top:16px">Yth. HRD ' + esc(perus) + (v(kotaPerI) ? '<br/>di ' + esc(kotaPerI) : '') + '</div>' +
        '<div style="margin-top:16px">Dengan hormat,</div>' +
        '<p style="text-align:justify">Melalui surat ini, saya ' + esc(nama) + ', karyawan ' + esc(perus) + ' dengan jabatan ' + esc(jabatan) +
        (dept ? ' di ' + esc(dept) : '') + ', bermaksud mengajukan pengunduran diri dari perusahaan.</p>' +
        pAlasan +
        '<p style="text-align:justify">Adapun hari terakhir saya bekerja adalah ' + esc(tglAkhir) + '. Selama masa pemberitahuan ini, saya bersedia membantu proses serah terima tugas agar berjalan lancar.</p>' +
        '<p style="text-align:justify">' + esc(terima) + '</p>' +
        '<p style="text-align:justify">Demikian surat pengunduran diri ini saya sampaikan. Atas perhatian dan pengertian Bapak/Ibu, saya ucapkan terima kasih.</p>' +
        '<div style="margin-top:24px">Hormat saya,</div>' +
        '<div style="margin-top:48px"><b>' + esc(nama) + '</b>' +
        '<br/>' + esc(jabatan) + (dept ? ' - ' + esc(dept) : '') +
        '</div></div>'
      );
    }

    function suratTeks() {
      const tmp = document.createElement('div');
      tmp.innerHTML = suratHtml();
      return tmp.innerText || tmp.textContent;
    }

    function perbarui() {
      const kurang = [];
      if (!v(namaI)) kurang.push('nama');
      if (!v(jabatanI)) kurang.push('jabatan');
      if (!v(perusahaanI)) kurang.push('perusahaan');
      const tglMundur = v(tglAkhirI) && v(tglSuratI) && v(tglAkhirI) < v(tglSuratI);
      const tglLewat = v(tglAkhirI) && v(tglAkhirI) < todayISO();

      let peringatan = '';
      if (tglMundur) peringatan = 'Tanggal terakhir kerja lebih awal dari tanggal surat. Periksa lagi tanggalnya.';
      else if (tglLewat) peringatan = 'Tanggal terakhir kerja sudah lewat. Periksa lagi tanggalnya.';
      else if (kurang.length) peringatan = 'Lengkapi ' + kurang.join(', ') + ' supaya surat siap dipakai.';

      if (peringatan) {
        T.show(peringatanBox, '<p style="font-size:13px;color:' + (tglMundur || tglLewat ? '#ef4444' : '#a1a1aa') + '">' + esc(peringatan) + '</p>');
      } else {
        T.hide(peringatanBox);
      }

      T.show(previewBox,
        '<div id="surat-resign-print"><div class="surat-page" style="background:#fff;color:#111;border:1px solid rgba(255,255,255,.15);border-radius:12px;max-width:720px;margin:0 auto;padding:28px 32px;font-family:Arial,Helvetica,sans-serif">' +
        suratHtml() +
        '</div></div>' +
        '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">' +
        '<button class="btn primary" data-act="print">🖨️ Cetak / Simpan PDF</button>' +
        '<button class="btn" data-act="copy">📋 Salin surat</button></div>' +
        '<p class="hint">Tanggal terakhir kerja terisi 30 hari dari hari ini. Sesuaikan dengan aturan perusahaan atau isi kontrak kerja kamu.</p>');
      previewBox.querySelector('[data-act="print"]').addEventListener('click', () => window.print());
      previewBox.querySelector('[data-act="copy"]').addEventListener('click', () => T.copy(suratTeks()));
    }

    [namaI, jabatanI, deptI, perusahaanI, kotaPerI, tempatI, alasanI, terimaI].forEach((el) => el.addEventListener('input', perbarui));
    [tglSuratI, tglAkhirI].forEach((el) => el.addEventListener('change', perbarui));

    root.appendChild(T.el('<p class="note">Isi form di bawah, surat pengunduran diri langsung jadi. Baca lagi sebelum dikirim, dan sampaikan secara baik-baik ke atasan kamu.</p>'));
    root.appendChild(T.grid2(T.field('Nama lengkap', namaI), T.field('Jabatan saat ini', jabatanI)));
    root.appendChild(T.grid2(T.field('Departemen / divisi (boleh kosong)', deptI), T.field('Nama perusahaan', perusahaanI)));
    root.appendChild(T.grid2(T.field('Kota perusahaan (boleh kosong)', kotaPerI), T.field('Tempat (tanggal surat)', tempatI)));
    root.appendChild(T.grid2(T.field('Tanggal surat', tglSuratI), T.field('Tanggal terakhir kerja', tglAkhirI, 'Umumnya 1 bulan setelah surat diajukan')));
    root.appendChild(T.field('Alasan mengundurkan diri (boleh kosong)', alasanI, 'Satu kalimat cukup. Kosongkan bila tidak ingin menulis alasan'));
    root.appendChild(T.field('Pesan terima kasih (boleh kosong)', terimaI, 'Kosongkan untuk memakai kalimat standar'));
    root.appendChild(T.el('<p class="dim" style="margin-top:16px">Hasil surat</p>'));
    root.appendChild(peringatanBox);
    root.appendChild(previewBox);
    perbarui();

}
