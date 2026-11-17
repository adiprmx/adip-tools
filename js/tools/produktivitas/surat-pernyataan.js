import { h as T, utils } from '../../core.js';

export const meta = {"id": "surat-pernyataan", "name": "Pembuat Surat Pernyataan", "cat": "produktivitas", "icon": "📜", "desc": "Bikin surat pernyataan bermaterai: kebenaran data, belum menikah, atau tidak terikat kontrak, lengkap dengan tempat tanda tangan.", "keywords": "surat pernyataan,pernyataan bermaterai,surat pernyataan belum menikah,surat pernyataan kebenaran data,materai", "since": "6.11.0"};

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
    '#surat-pernyataan-print,#surat-pernyataan-print *{visibility:visible !important}' +
    '#surat-pernyataan-print{position:absolute;inset:0;background:#fff;color:#000;padding:0}' +
    '#surat-pernyataan-print .surat-page{box-shadow:none !important;border:none !important;margin:0 !important;width:100% !important}' +
    '}';
  document.head.appendChild(st);
  _printCss = st;
}

function hapusPrintCss() {
  if (_printCss) { _printCss.remove(); _printCss = null; }
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

const ISI_BAWAAN = {
  data: 'Seluruh data dan dokumen yang saya sampaikan adalah benar dan dapat dipertanggungjawabkan.',
  belum_menikah: 'Saya belum pernah menikah dan saat ini tidak sedang terikat dalam perkawinan dengan siapa pun.',
  tidak_terikat: 'Saya tidak sedang terikat kontrak kerja atau perjanjian apa pun dengan pihak lain.',
  lain: ''
};

export function render(root) {

    ensurePrintCss();
    T.onLeave(hapusPrintCss);

    const namaI = T.input('text', 'Nama lengkap', '');
    const tempatLahirI = T.input('text', 'Tempat lahir', '');
    const tglLahirI = T.input('date', '', '');
    const alamatI = T.ta(2, 'Alamat lengkap sesuai KTP', '');
    const nikI = T.input('text', 'Nomor KTP (boleh kosong)', '');
    nikI.inputMode = 'numeric';
    const jenisI = T.select([
      ['data', 'Kebenaran data / dokumen'],
      ['belum_menikah', 'Belum menikah'],
      ['tidak_terikat', 'Tidak terikat kontrak'],
      ['lain', 'Tulis sendiri']
    ], 'data');
    const isiI = T.ta(3, 'Isi pernyataan', ISI_BAWAAN.data);
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

    function suratHtml() {
      const nama = v(namaI) || '(Nama lengkap)';
      const ttl = [v(tempatLahirI), fmtTanggal(v(tglLahirI))].filter(Boolean).join(', ') || '(Tempat, tanggal lahir)';
      const alamat = v(alamatI) || '(Alamat lengkap)';
      const nik = v(nikI);
      const isi = v(isiI) || '(Isi pernyataan)';

      const barisIdentitas = (label, nilai) =>
        '<div style="display:flex;gap:8px"><div style="width:130px;flex:none">' + label + '</div><div>:</div><div>' + esc(nilai) + '</div></div>';

      return (
        '<div style="font-size:14px;line-height:1.7">' +
        '<div style="text-align:center;font-weight:700;font-size:16px;text-decoration:underline">SURAT PERNYATAAN</div>' +
        '<div style="margin-top:16px">Yang bertanda tangan di bawah ini:</div>' +
        '<div style="margin-top:8px">' +
        barisIdentitas('Nama', nama) +
        barisIdentitas('Tempat/Tgl Lahir', ttl) +
        barisIdentitas('Alamat', alamat) +
        (nik ? barisIdentitas('Nomor KTP', nik) : '') +
        '</div>' +
        '<div style="margin-top:16px">Dengan ini menyatakan bahwa:</div>' +
        '<p style="text-align:justify">' + esc(isi) + '</p>' +
        '<p style="text-align:justify">Demikian surat pernyataan ini saya buat dengan sebenar-benarnya dan penuh kesadaran, tanpa paksaan dari pihak mana pun. Apabila di kemudian hari pernyataan ini tidak benar, saya bersedia mempertanggungjawabkannya sesuai ketentuan yang berlaku.</p>' +
        '<div style="margin-top:24px;text-align:right">' + esc(tanggalSurat()) + '<br/>Yang menyatakan,</div>' +
        '<div style="text-align:right;margin-top:8px;font-size:12px;color:#555">(Materai Rp10.000)</div>' +
        '<div style="text-align:right;margin-top:40px"><b>' + esc(nama) + '</b></div>' +
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
      if (!v(namaI)) kurang.push('nama');
      if (!v(tempatLahirI) && !v(tglLahirI)) kurang.push('tempat/tanggal lahir');
      if (!v(alamatI)) kurang.push('alamat');
      if (!v(isiI)) kurang.push('isi pernyataan');

      if (kurang.length) {
        T.show(peringatanBox, '<p style="font-size:13px;color:#a1a1aa">Lengkapi ' + esc(kurang.join(', ')) + ' supaya surat siap dipakai.</p>');
      } else {
        T.hide(peringatanBox);
      }

      T.show(previewBox,
        '<div id="surat-pernyataan-print"><div class="surat-page" style="background:#fff;color:#111;border:1px solid rgba(255,255,255,.15);border-radius:12px;max-width:720px;margin:0 auto;padding:28px 32px;font-family:Arial,Helvetica,sans-serif">' +
        suratHtml() +
        '</div></div>' +
        '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">' +
        '<button class="btn primary" data-act="print">🖨️ Cetak / Simpan PDF</button>' +
        '<button class="btn" data-act="copy">📋 Salin surat</button></div>' +
        '<p class="hint">Tempelkan materai Rp10.000 di samping tanda tangan sebelum surat dipakai. Periksa lagi isi pernyataan sebelum ditandatangani.</p>');
      previewBox.querySelector('[data-act="print"]').addEventListener('click', () => window.print());
      previewBox.querySelector('[data-act="copy"]').addEventListener('click', () => T.copy(suratTeks()));
    }

    jenisI.addEventListener('change', () => {
      isiI.value = ISI_BAWAAN[jenisI.value] || '';
      perbarui();
    });
    [namaI, tempatLahirI, alamatI, nikI, isiI, tempatI].forEach((el) => el.addEventListener('input', perbarui));
    [tglLahirI, tglSuratI].forEach((el) => el.addEventListener('change', perbarui));

    root.appendChild(T.el('<p class="note">Isi form di bawah, surat pernyataan langsung jadi. Pilih jenis pernyataan, lalu ubah kalimatnya bila perlu.</p>'));
    root.appendChild(T.field('Jenis pernyataan', jenisI));
    root.appendChild(T.grid2(T.field('Nama lengkap', namaI), T.field('Tempat lahir', tempatLahirI)));
    root.appendChild(T.grid2(T.field('Tanggal lahir', tglLahirI), T.field('Nomor KTP (boleh kosong)', nikI, 'Isi hanya bila diminta pihak yang menerima surat')));
    root.appendChild(T.field('Alamat', alamatI));
    root.appendChild(T.field('Isi pernyataan', isiI, 'Kalimat ini bisa diubah sesuai keperluan'));
    root.appendChild(T.grid2(T.field('Tempat (tanggal surat)', tempatI), T.field('Tanggal surat', tglSuratI)));
    root.appendChild(T.el('<p class="dim" style="margin-top:16px">Hasil surat</p>'));
    root.appendChild(peringatanBox);
    root.appendChild(previewBox);
    perbarui();

}
