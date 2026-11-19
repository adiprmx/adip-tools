import { h as T, utils, todayISO } from '../../core.js';

export const meta = {"id": "surat-kuasa", "name": "Pembuat Surat Kuasa", "cat": "produktivitas", "icon": "🤝", "desc": "Bikin surat kuasa dari form singkat: pemberi dan penerima kuasa, keperluan, dan masa berlaku, siap salin atau cetak.", "keywords": "surat kuasa,kuasa,pemberi kuasa,penerima kuasa,contoh surat kuasa", "since": "6.11.0"};

/* <style> print disimpan referensinya supaya bisa DIHAPUS saat tool
   ditinggal (T.onLeave di render). Kalau menetap di <head>, aturan
   body *{visibility:hidden} bikin cetakan tool lain jadi blank. */
// CSS cetak kanonis: utils.ensurePrintCss / utils.removePrintCss (core.js).



const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// isoHariIni -> todayISO dari core.js.

// fmtTanggal kanonis tinggal di utils (core.js).

function tambahBulan(iso, n) {
  const p = String(iso || '').split('-');
  if (p.length !== 3) return '';
  const d = new Date(Number(p[0]), Number(p[1]) - 1 + n, Number(p[2]));
  return d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear();
}

export function render(root) {

    utils.ensurePrintCss('surat-kuasa-print', { page: '@page{size:A4;margin:18mm 20mm}', extra: '#surat-kuasa-print .surat-page{box-shadow:none !important;border:none !important;margin:0 !important;width:100% !important}' });
    T.onLeave(() => utils.removePrintCss('surat-kuasa-print'));

    const namaPemberiI = T.input('text', 'Nama pemberi kuasa', '');
    const alamatPemberiI = T.ta(2, 'Alamat pemberi kuasa', '');
    const nikPemberiI = T.input('text', 'Nomor KTP pemberi kuasa (boleh kosong)', '');
    nikPemberiI.inputMode = 'numeric';
    const namaPenerimaI = T.input('text', 'Nama penerima kuasa', '');
    const alamatPenerimaI = T.ta(2, 'Alamat penerima kuasa', '');
    const nikPenerimaI = T.input('text', 'Nomor KTP penerima kuasa (boleh kosong)', '');
    nikPenerimaI.inputMode = 'numeric';
    const keperluanI = T.ta(3, 'Keperluan kuasa, contoh: mengambil ijazah di SMK Negeri 1 atas nama saya', '');
    const masaI = T.select([
      ['sekali', 'Sekali keperluan'],
      ['1', '1 bulan'],
      ['3', '3 bulan'],
      ['6', '6 bulan'],
      ['12', '1 tahun']
    ], 'sekali');
    const tempatI = T.input('text', 'Tempat (untuk tanggal surat)', '');
    const tglSuratI = T.input('date', '', todayISO());
    const previewBox = T.out();
    const peringatanBox = T.out();

    const esc = (s) => T.esc(String(s == null ? '' : s));
    const v = (el) => el.value.trim();

    function tanggalSurat() {
      const tgl = utils.fmtTanggal(v(tglSuratI)) || utils.fmtTanggal(todayISO());
      return (v(tempatI) ? v(tempatI) + ', ' : '') + tgl;
    }

    function kalimatMasa() {
      if (masaI.value === 'sekali') return 'Surat kuasa ini berlaku untuk keperluan di atas dan berakhir setelah keperluan tersebut selesai.';
      const sampai = tambahBulan(v(tglSuratI) || todayISO(), Number(masaI.value));
      return 'Surat kuasa ini berlaku sampai dengan ' + sampai + '.';
    }

    function blokIdentitas(nama, alamat, nik) {
      const baris = (label, nilai) =>
        '<div style="display:flex;gap:8px"><div style="width:80px;flex:none">' + label + '</div><div>:</div><div>' + esc(nilai) + '</div></div>';
      return '<div style="margin-top:8px">' +
        baris('Nama', nama || '(Nama)') +
        baris('Alamat', alamat || '(Alamat)') +
        (nik ? baris('No. KTP', nik) : '') +
        '</div>';
    }

    function suratHtml() {
      const pemberi = v(namaPemberiI) || '(Nama pemberi kuasa)';
      const penerima = v(namaPenerimaI) || '(Nama penerima kuasa)';
      const keperluan = v(keperluanI) || '(Keperluan kuasa)';

      return (
        '<div style="font-size:14px;line-height:1.7">' +
        '<div style="text-align:center;font-weight:700;font-size:16px;text-decoration:underline">SURAT KUASA</div>' +
        '<div style="margin-top:16px">Yang bertanda tangan di bawah ini:</div>' +
        blokIdentitas(v(namaPemberiI), v(alamatPemberiI), v(nikPemberiI)) +
        '<div style="margin-top:8px">Selanjutnya disebut <b>Pemberi Kuasa</b>.</div>' +
        '<div style="margin-top:16px">Memberikan kuasa kepada:</div>' +
        blokIdentitas(v(namaPenerimaI), v(alamatPenerimaI), v(nikPenerimaI)) +
        '<div style="margin-top:8px">Selanjutnya disebut <b>Penerima Kuasa</b>.</div>' +
        '<div style="margin-top:16px">Untuk:</div>' +
        '<p style="text-align:justify">' + esc(keperluan) + '</p>' +
        '<p style="text-align:justify">' + esc(kalimatMasa()) + '</p>' +
        '<p style="text-align:justify">Demikian surat kuasa ini dibuat dengan sebenar-benarnya untuk dipergunakan sebagaimana mestinya.</p>' +
        '<div style="margin-top:24px;text-align:right">' + esc(tanggalSurat()) + '</div>' +
        '<div style="display:flex;justify-content:space-between;margin-top:8px;gap:16px">' +
        '<div style="text-align:center">Penerima Kuasa,<div style="margin-top:56px"><b>' + esc(penerima) + '</b></div></div>' +
        '<div style="text-align:center">Pemberi Kuasa,<div style="margin-top:56px"><b>' + esc(pemberi) + '</b></div></div>' +
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
      if (!v(namaPemberiI)) kurang.push('nama pemberi kuasa');
      if (!v(namaPenerimaI)) kurang.push('nama penerima kuasa');
      if (!v(keperluanI)) kurang.push('keperluan');
      const namaSama = v(namaPemberiI) && v(namaPemberiI).toLowerCase() === v(namaPenerimaI).toLowerCase();

      let peringatan = '';
      let merah = false;
      if (namaSama) { peringatan = 'Nama pemberi dan penerima kuasa sama. Periksa lagi.'; merah = true; }
      else if (kurang.length) peringatan = 'Lengkapi ' + kurang.join(', ') + ' supaya surat siap dipakai.';

      if (peringatan) {
        T.show(peringatanBox, '<p style="font-size:13px;color:' + (merah ? '#ef4444' : '#a1a1aa') + '">' + esc(peringatan) + '</p>');
      } else {
        T.hide(peringatanBox);
      }

      T.show(previewBox,
        '<div id="surat-kuasa-print"><div class="surat-page" style="background:#fff;color:#111;border:1px solid rgba(255,255,255,.15);border-radius:12px;max-width:720px;margin:0 auto;padding:28px 32px;font-family:Arial,Helvetica,sans-serif">' +
        suratHtml() +
        '</div></div>' +
        '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">' +
        '<button class="btn primary" data-act="print">🖨️ Cetak / Simpan PDF</button>' +
        '<button class="btn" data-act="copy">📋 Salin surat</button></div>' +
        '<p class="hint">Buat rangkap dua, satu untuk pemberi kuasa dan satu untuk penerima kuasa. Bila diminta pihak yang menerima, tempelkan materai di samping tanda tangan pemberi kuasa.</p>');
      previewBox.querySelector('[data-act="print"]').addEventListener('click', () => window.print());
      previewBox.querySelector('[data-act="copy"]').addEventListener('click', () => T.copy(suratTeks()));
    }

    masaI.addEventListener('change', perbarui);
    [namaPemberiI, alamatPemberiI, nikPemberiI, namaPenerimaI, alamatPenerimaI, nikPenerimaI, keperluanI, tempatI].forEach((el) => el.addEventListener('input', perbarui));
    tglSuratI.addEventListener('change', perbarui);

    root.appendChild(T.el('<p class="note">Isi form di bawah, surat kuasa langsung jadi. Tulis keperluan dengan jelas supaya tidak disalahgunakan.</p>'));
    root.appendChild(T.el('<p class="dim">Pemberi kuasa (yang memberi wewenang)</p>'));
    root.appendChild(T.grid2(T.field('Nama pemberi kuasa', namaPemberiI), T.field('Nomor KTP (boleh kosong)', nikPemberiI)));
    root.appendChild(T.field('Alamat pemberi kuasa', alamatPemberiI));
    root.appendChild(T.el('<p class="dim" style="margin-top:12px">Penerima kuasa (yang diberi wewenang)</p>'));
    root.appendChild(T.grid2(T.field('Nama penerima kuasa', namaPenerimaI), T.field('Nomor KTP (boleh kosong)', nikPenerimaI)));
    root.appendChild(T.field('Alamat penerima kuasa', alamatPenerimaI));
    root.appendChild(T.field('Keperluan', keperluanI, 'Tulis satu keperluan yang jelas, contoh: mengambil ijazah atas nama saya'));
    root.appendChild(T.grid2(T.field('Masa berlaku', masaI), T.field('Tanggal surat', tglSuratI)));
    root.appendChild(T.field('Tempat (tanggal surat)', tempatI));
    root.appendChild(T.el('<p class="dim" style="margin-top:16px">Hasil surat</p>'));
    root.appendChild(peringatanBox);
    root.appendChild(previewBox);
    perbarui();

}
