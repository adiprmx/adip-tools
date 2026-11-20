import { h as T, utils, todayISO } from '../../core.js';

export const meta = {"id": "surat-duka", "name": "Pembuat Surat Belasungkawa", "cat": "produktivitas", "icon": "🕊️", "desc": "Bikin surat turut berduka cita dengan bahasa yang sopan dan hangat untuk keluarga yang ditinggalkan, siap salin atau cetak.", "keywords": "surat duka,belasungkawa,turut berduka cita,surat belasungkawa,ucapan duka", "since": "6.11.0"};

// CSS cetak kanonis: utils.ensurePrintCss (core.js).

// BULAN, isoHariIni, fmtTanggal kanonis tinggal di core.js (todayISO, utils.fmtTanggal).

export function render(root) {

    utils.ensurePrintCss('surat-duka-print', { page: '@page{size:A4;margin:18mm 20mm}', extra: '#surat-duka-print .surat-page{box-shadow:none !important;border:none !important;margin:0 !important;width:100% !important}' });
    T.onLeave(() => utils.removePrintCss('surat-duka-print'));

    const pengirimI = T.input('text', 'Nama kamu (pengirim)', '');
    const namaAlmI = T.input('text', 'Nama almarhum / almarhumah', '');
    const sebutanI = T.select([['almarhum', 'Almarhum (laki-laki)'], ['almarhumah', 'Almarhumah (perempuan)']], 'almarhum');
    const keluargaI = T.input('text', 'Keluarga penerima, contoh: Keluarga Bapak Ahmad', '');
    const hubunganI = T.input('text', 'Hubungan kamu dengan beliau (boleh kosong), contoh: rekan kerja', '');
    const pesanI = T.ta(3, 'Pesan pribadi (boleh kosong), contoh: kenangan atau kebaikan beliau yang kamu ingat', '');
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

    function suratHtml() {
      const pengirim = v(pengirimI) || '(Nama pengirim)';
      const alm = v(namaAlmI) || '(nama almarhum/almarhumah)';
      const sebutan = sebutanI.value === 'almarhumah' ? 'almarhumah' : 'almarhum';
      const sebutanKapital = sebutanI.value === 'almarhumah' ? 'Almarhumah' : 'Almarhum';
      const keluarga = v(keluargaI) || '(Keluarga yang dituju)';
      const hubungan = v(hubunganI);
      const pesan = v(pesanI);

      const pHubungan = hubungan
        ? '<p style="text-align:justify">Saya mengenal ' + esc(sebutan) + ' ' + esc(alm) + ' sebagai ' + esc(hubungan) + ' yang baik. ' +
          'Kebaikan dan kenangan bersama beliau akan selalu saya ingat.</p>'
        : '';

      const pPesan = pesan
        ? '<p style="text-align:justify">' + esc(pesan) + '</p>'
        : '';

      return (
        '<div style="font-size:14px;line-height:1.7">' +
        '<div style="text-align:right">' + esc(tanggalSurat()) + '</div>' +
        '<div style="margin-top:16px">Yth. ' + esc(keluarga) + '<br/>di tempat</div>' +
        '<div style="margin-top:16px">Dengan hormat,</div>' +
        '<p style="text-align:justify">Saya turut berduka cita yang sedalam-dalamnya atas berpulangnya ' + esc(sebutan) + ' ' + esc(alm) + '. ' +
        'Kabar ini membuat saya sangat terkejut dan sedih.</p>' +
        pHubungan +
        pPesan +
        '<p style="text-align:justify">Semoga ' + esc(sebutanKapital) + ' mendapat tempat terbaik di sisi-Nya, dan seluruh keluarga yang ditinggalkan diberi ketabahan serta kekuatan dalam menghadapi masa sulit ini.</p>' +
        '<p style="text-align:justify">Apabila ada yang dapat saya bantu, jangan ragu untuk menghubungi saya.</p>' +
        '<div style="margin-top:24px">Dengan turut berduka cita,</div>' +
        '<div style="margin-top:48px"><b>' + esc(pengirim) + '</b></div>' +
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
      if (!v(pengirimI)) kurang.push('nama pengirim');
      if (!v(namaAlmI)) kurang.push('nama almarhum/almarhumah');
      if (!v(keluargaI)) kurang.push('keluarga penerima');

      if (kurang.length) {
        T.show(peringatanBox, '<p style="font-size:13px;color:#a1a1aa">Lengkapi ' + esc(kurang.join(', ')) + ' supaya surat siap dipakai.</p>');
      } else {
        T.hide(peringatanBox);
      }

      T.show(previewBox,
        '<div id="surat-duka-print"><div class="surat-page" style="background:#fff;color:#111;border:1px solid rgba(255,255,255,.15);border-radius:12px;max-width:720px;margin:0 auto;padding:28px 32px;font-family:Arial,Helvetica,sans-serif">' +
        suratHtml() +
        '</div></div>' +
        '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">' +
        '<button class="btn primary" data-act="print">🖨️ Cetak / Simpan PDF</button>' +
        '<button class="btn" data-act="copy">📋 Salin surat</button></div>' +
        '<p class="hint">Tulis pesan pribadi dengan kata-kata sendiri bila ada kenangan yang ingin disampaikan. Sampaikan surat ini dengan sopan kepada keluarga yang sedang berduka.</p>');
      previewBox.querySelector('[data-act="print"]').addEventListener('click', () => window.print());
      previewBox.querySelector('[data-act="copy"]').addEventListener('click', () => T.copy(suratTeks()));
    }

    sebutanI.addEventListener('change', perbarui);
    [pengirimI, namaAlmI, keluargaI, hubunganI, pesanI, tempatI].forEach((el) => el.addEventListener('input', perbarui));
    tglSuratI.addEventListener('change', perbarui);

    root.appendChild(T.el('<p class="note">Isi form di bawah, surat belasungkawa langsung jadi. Kalimatnya sudah sopan, tinggal sesuaikan dengan keadaan sebenarnya.</p>'));
    root.appendChild(T.grid2(T.field('Nama kamu (pengirim)', pengirimI), T.field('Nama almarhum / almarhumah', namaAlmI)));
    root.appendChild(T.grid2(T.field('Sebutan', sebutanI), T.field('Keluarga penerima', keluargaI)));
    root.appendChild(T.field('Hubungan kamu dengan beliau (boleh kosong)', hubunganI, 'Contoh: rekan kerja, tetangga, sahabat'));
    root.appendChild(T.field('Pesan pribadi (boleh kosong)', pesanI, 'Kenangan atau kebaikan beliau yang ingin kamu sampaikan'));
    root.appendChild(T.grid2(T.field('Tempat (tanggal surat)', tempatI), T.field('Tanggal surat', tglSuratI)));
    root.appendChild(T.el('<p class="dim" style="margin-top:16px">Hasil surat</p>'));
    root.appendChild(peringatanBox);
    root.appendChild(previewBox);
    perbarui();

}
