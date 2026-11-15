import { h as T, utils } from '../../core.js?v=6.12.0';

export const meta = {"id": "surat-resmi", "name": "Pembuat Surat Resmi / Dinas", "cat": "produktivitas", "icon": "🏛️", "desc": "Bikin surat dinas atau surat resmi umum: kop instansi, nomor surat, perihal, isi, dan tembusan, siap salin atau cetak.", "keywords": "surat resmi,surat dinas,surat instansi,kop surat,nomor surat,tembusan", "since": "6.11.0"};

let _printCssDone = false;

function ensurePrintCss() {
  if (_printCssDone) return;
  _printCssDone = true;
  const st = document.createElement('style');
  st.textContent =
    '@page{size:A4;margin:18mm 20mm}' +
    '@media print{' +
    'body *{visibility:hidden !important}' +
    '#surat-resmi-print,#surat-resmi-print *{visibility:visible !important}' +
    '#surat-resmi-print{position:absolute;inset:0;background:#fff;color:#000;padding:0}' +
    '#surat-resmi-print .surat-page{box-shadow:none !important;border:none !important;margin:0 !important;width:100% !important}' +
    '}';
  document.head.appendChild(st);
}

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function isoHariIni() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function fmtTanggal(iso) {
  if (!iso) return '';
  const p = String(iso).split('-');
  if (p.length !== 3) return String(iso);
  const tgl = Number(p[2]);
  const bln = Number(p[1]);
  const thn = Number(p[0]);
  if (!tgl || !bln || !thn || bln < 1 || bln > 12) return String(iso);
  return tgl + ' ' + BULAN[bln - 1] + ' ' + thn;
}

const PENUTUP_STANDAR = 'Demikian surat ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.';

export function render(root) {

    ensurePrintCss();

    const instansiI = T.input('text', 'Nama instansi / organisasi', '');
    const alamatInstansiI = T.ta(2, 'Alamat instansi (untuk kop surat)', '');
    const nomorI = T.input('text', 'Nomor surat, contoh: 012/ORG/XI/2026', '');
    const lampiranI = T.input('text', 'Lampiran (boleh kosong), contoh: 1 berkas', '');
    const perihalI = T.input('text', 'Perihal surat', '');
    const tujuanI = T.ta(2, 'Tujuan surat, contoh: Kepala Dinas Pendidikan Kabupaten Bogor', '');
    const isiI = T.ta(5, 'Isi surat. Baris kosong memisahkan paragraf.', '');
    const penutupI = T.ta(2, 'Kalimat penutup (boleh kosong, pakai kalimat standar)', '');
    const namaTtdI = T.input('text', 'Nama penanda tangan', '');
    const jabatanTtdI = T.input('text', 'Jabatan penanda tangan', '');
    const tembusanI = T.ta(3, 'Tembusan (boleh kosong), satu nama per baris', '');
    const tempatI = T.input('text', 'Tempat (untuk tanggal surat)', '');
    const tglSuratI = T.input('date', '', isoHariIni());
    const previewBox = T.out();
    const peringatanBox = T.out();

    const esc = (s) => T.esc(String(s == null ? '' : s));
    const v = (el) => el.value.trim();

    function tanggalSurat() {
      const tgl = fmtTanggal(v(tglSuratI)) || fmtTanggal(isoHariIni());
      return (v(tempatI) ? v(tempatI) + ', ' : '') + tgl;
    }

    function paragrafIsi() {
      const teks = v(isiI);
      if (!teks) return '<p style="text-align:justify">(Isi surat)</p>';
      return teks.split(/\n+/).map((p) => '<p style="text-align:justify">' + esc(p.trim()) + '</p>').join('');
    }

    function suratHtml() {
      const instansi = v(instansiI) || '(Nama instansi)';
      const alamatInstansi = v(alamatInstansiI);
      const nomor = v(nomorI) || '(Nomor surat)';
      const lampiran = v(lampiranI) || '-';
      const perihal = v(perihalI) || '(Perihal)';
      const tujuan = v(tujuanI) || '(Tujuan surat)';
      const penutup = v(penutupI) || PENUTUP_STANDAR;
      const namaTtd = v(namaTtdI) || '(Nama penanda tangan)';
      const jabatanTtd = v(jabatanTtdI);
      const tembusan = v(tembusanI).split('\n').map((s) => s.trim()).filter(Boolean);

      const barisInfo = (label, nilai) =>
        '<div style="display:flex;gap:8px"><div style="width:90px;flex:none">' + label + '</div><div>:</div><div>' + esc(nilai) + '</div></div>';

      return (
        '<div style="font-size:14px;line-height:1.7">' +
        '<div style="text-align:center">' +
        '<div style="font-size:16px;font-weight:700">' + esc(instansi) + '</div>' +
        (alamatInstansi ? '<div style="font-size:12px">' + esc(alamatInstansi) + '</div>' : '') +
        '</div>' +
        '<div style="border-top:3px solid #111;border-bottom:1px solid #111;height:3px;margin:10px 0 16px"></div>' +
        '<div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap">' +
        '<div>' + barisInfo('Nomor', nomor) + barisInfo('Lampiran', lampiran) + barisInfo('Perihal', perihal) + '</div>' +
        '<div>' + esc(tanggalSurat()) + '</div>' +
        '</div>' +
        '<div style="margin-top:16px">Yth.<br/>' + esc(tujuan) + '</div>' +
        '<div style="margin-top:16px">Dengan hormat,</div>' +
        paragrafIsi() +
        '<p style="text-align:justify">' + esc(penutup) + '</p>' +
        '<div style="margin-top:24px;text-align:right">Hormat kami,</div>' +
        '<div style="text-align:right;margin-top:56px"><b>' + esc(namaTtd) + '</b>' +
        (jabatanTtd ? '<br/>' + esc(jabatanTtd) : '') +
        '</div>' +
        (tembusan.length
          ? '<div style="margin-top:24px">Tembusan:<ol style="margin:4px 0 0 18px;padding:0">' +
            tembusan.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ol></div>'
          : '') +
        '</div>'
      );
    }

    function suratTeks() {
      const tmp = document.createElement('div');
      tmp.innerHTML = suratHtml();
      return tmp.innerText || tmp.textContent;
    }

    function perbarui() {
      const kurang = [];
      if (!v(instansiI)) kurang.push('nama instansi');
      if (!v(nomorI)) kurang.push('nomor surat');
      if (!v(perihalI)) kurang.push('perihal');
      if (!v(tujuanI)) kurang.push('tujuan surat');
      if (!v(isiI)) kurang.push('isi surat');
      if (!v(namaTtdI)) kurang.push('nama penanda tangan');

      if (kurang.length) {
        T.show(peringatanBox, '<p style="font-size:13px;color:#a1a1aa">Lengkapi ' + esc(kurang.join(', ')) + ' supaya surat siap dipakai.</p>');
      } else {
        T.hide(peringatanBox);
      }

      T.show(previewBox,
        '<div id="surat-resmi-print"><div class="surat-page" style="background:#fff;color:#111;border:1px solid rgba(255,255,255,.15);border-radius:12px;max-width:720px;margin:0 auto;padding:28px 32px;font-family:Arial,Helvetica,sans-serif">' +
        suratHtml() +
        '</div></div>' +
        '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">' +
        '<button class="btn primary" data-act="print">🖨️ Cetak / Simpan PDF</button>' +
        '<button class="btn" data-act="copy">📋 Salin surat</button></div>' +
        '<p class="hint">Nomor surat mengikuti urutan arsip instansi kamu. Bila ragu, tanyakan ke bagian tata usaha.</p>');
      previewBox.querySelector('[data-act="print"]').addEventListener('click', () => window.print());
      previewBox.querySelector('[data-act="copy"]').addEventListener('click', () => T.copy(suratTeks()));
    }

    [instansiI, alamatInstansiI, nomorI, lampiranI, perihalI, tujuanI, isiI, penutupI, namaTtdI, jabatanTtdI, tembusanI, tempatI].forEach((el) => el.addEventListener('input', perbarui));
    tglSuratI.addEventListener('change', perbarui);

    root.appendChild(T.el('<p class="note">Isi form di bawah, surat resmi langsung jadi dengan kop, nomor surat, dan tembusan. Cocok untuk keperluan organisasi, sekolah, dan kantor.</p>'));
    root.appendChild(T.el('<p class="dim">Kop surat</p>'));
    root.appendChild(T.field('Nama instansi / organisasi', instansiI));
    root.appendChild(T.field('Alamat instansi', alamatInstansiI));
    root.appendChild(T.grid2(T.field('Nomor surat', nomorI), T.field('Lampiran (boleh kosong)', lampiranI)));
    root.appendChild(T.grid2(T.field('Perihal', perihalI), T.field('Tanggal surat', tglSuratI)));
    root.appendChild(T.field('Tempat (tanggal surat)', tempatI));
    root.appendChild(T.field('Tujuan surat', tujuanI, 'Nama jabatan atau nama orang yang dituju'));
    root.appendChild(T.field('Isi surat', isiI, 'Pisahkan paragraf dengan baris kosong'));
    root.appendChild(T.field('Kalimat penutup (boleh kosong)', penutupI, 'Kosongkan untuk memakai kalimat standar'));
    root.appendChild(T.grid2(T.field('Nama penanda tangan', namaTtdI), T.field('Jabatan penanda tangan', jabatanTtdI)));
    root.appendChild(T.field('Tembusan (boleh kosong)', tembusanI, 'Satu nama per baris'));
    root.appendChild(T.el('<p class="dim" style="margin-top:16px">Hasil surat</p>'));
    root.appendChild(peringatanBox);
    root.appendChild(previewBox);
    perbarui();

}
