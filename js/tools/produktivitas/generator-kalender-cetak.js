import { h as T, fileInput, utils } from '../../core.js';

// Generator Kalender Cetak: kalender tahun mana pun, setahun satu halaman
// atau sebulan per halaman, siap dicetak. Minggu dimulai hari Senin.
// Libur yang dimasukkan hanya yang tanggalnya tetap tiap tahun; libur yang
// tanggalnya berubah (Idulfitri, Nyepi, Waisak, Imlek, cuti bersama)
// mengikuti SKB 3 Menteri dan tidak dimasukkan, tapi bisa ditambahkan
// sendiri lewat tanggal khusus.
export const meta = {"id": "generator-kalender-cetak", "name": "Generator Kalender Cetak", "cat": "produktivitas", "icon": "🗓️", "desc": "Buat kalender cetak tahun mana pun: setahun satu halaman atau sebulan per halaman.", "keywords": "kalender cetak,kalender tahunan,printable calendar,kalender 2027,kalender sebulan,kalender libur", "since": "6.18.0"};

export const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const NAMA_HARI = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

// Libur nasional Indonesia yang tanggalnya tetap tiap tahun.
export function hariLiburTetap(tahun) {
  return [
    { bulan: 0, tanggal: 1, nama: 'Tahun Baru Masehi' },
    { bulan: 4, tanggal: 1, nama: 'Hari Buruh Internasional' },
    { bulan: 5, tanggal: 1, nama: 'Hari Lahir Pancasila' },
    { bulan: 7, tanggal: 17, nama: 'HUT Kemerdekaan RI' },
    { bulan: 11, tanggal: 25, nama: 'Hari Raya Natal' },
  ].map((l) => ({ ...l, tahun }));
}

// Kalender satu bulan: array minggu, tiap minggu 7 sel (Senin dulu).
// Sel berisi nomor tanggal atau null (sel kosong). Murni, bisa diuji di Node.
export function kalenderBulan(tahun, bulan) {
  const pertama = new Date(tahun, bulan, 1);
  const jumlahHari = new Date(tahun, bulan + 1, 0).getDate();
  const geser = (pertama.getDay() + 6) % 7;
  const minggu = [];
  let baris = new Array(7).fill(null);
  let pos = geser;
  for (let t = 1; t <= jumlahHari; t++) {
    baris[pos] = t;
    pos++;
    if (pos === 7) { minggu.push(baris); baris = new Array(7).fill(null); pos = 0; }
  }
  if (pos !== 0) minggu.push(baris);
  return minggu;
}

// CSS cetak kanonis: utils.ensurePrintCss / utils.removePrintCss (core.js).

export function render(root) {
  utils.ensurePrintCss('kalender-print', { page: '@page{size:A4;margin:12mm}', extra: '#kalender-print .kal-page{box-shadow:none !important;border:none !important;margin:0 !important;width:100% !important;page-break-after:always}#kalender-print .kal-page:last-child{page-break-after:auto}' });
  T.onLeave(() => utils.removePrintCss('kalender-print'));

  const tahunIni = new Date().getFullYear();
  const tahunI = T.input('text', 'cth: 2027', String(tahunIni)); tahunI.inputMode = 'numeric';
  const modeI = T.select([['tahun', 'Setahun satu halaman (12 bulan kecil)'], ['bulan', 'Sebulan per halaman (besar)']], 'tahun');
  const bulanI = T.select(NAMA_BULAN.map((n, i) => [String(i), n]), String(new Date().getMonth()));
  const fotoI = fileInput('image/*');
  const khususI = T.ta(3, 'Satu per baris, format: 15-8-2027 Acara keluarga', '');
  const box = T.out();
  let fotoUrl = '';

  fotoI.addEventListener('change', () => {
    const f = fotoI.files && fotoI.files[0];
    if (!f) { fotoUrl = ''; return; }
    if (typeof FileReader === 'undefined') { T.toast('Peramban ini tidak bisa membaca foto'); return; }
    const r = new FileReader();
    r.onload = () => { fotoUrl = String(r.result || ''); T.toast('Foto dipasang'); };
    r.readAsDataURL(f);
  });

  const bacaKhusus = () => {
    const hasil = [];
    khususI.value.split('\n').forEach((baris) => {
      const m = /^\s*(\d{1,2})-(\d{1,2})-(\d{4})\s+(.+?)\s*$/.exec(baris);
      if (m) hasil.push({ tanggal: Number(m[1]), bulan: Number(m[2]) - 1, tahun: Number(m[3]), nama: m[4] });
    });
    return hasil;
  };

  const tabelBulan = (tahun, bulan, liburMap, besar) => {
    const minggu = kalenderBulan(tahun, bulan);
    const pad = besar ? '10px' : '4px';
    const fs = besar ? '15px' : '11px';
    let h = '<table style="border-collapse:collapse;width:100%;font-size:' + fs + '"><thead><tr>' +
      NAMA_HARI.map((d, i) => '<th style="padding:' + pad + ';border-bottom:1px solid #ccc;font-weight:600' + (i === 6 ? ';color:#c0392b' : '') + '">' + d + '</th>').join('') + '</tr></thead><tbody>';
    minggu.forEach((m) => {
      h += '<tr>';
      m.forEach((t, i) => {
        if (t == null) { h += '<td></td>'; return; }
        const kunci = bulan + '-' + t;
        const libur = liburMap[kunci];
        const merah = i === 6 || !!libur;
        h += '<td style="text-align:center;padding:' + pad + ';' + (merah ? 'color:#c0392b;font-weight:700' : '') + '" title="' + (libur ? T.esc(libur) : '') + '">' + t + '</td>';
      });
      h += '</tr>';
    });
    return h + '</tbody></table>';
  };

  const buat = () => {
    const tahun = T.num(tahunI.value);
    if (!isFinite(tahun) || tahun < 1900 || tahun > 2200) {
      T.show(box, '<div class="err">Tahun harus diisi angka antara 1900 dan 2200.</div>');
      return;
    }
    const libur = {};
    hariLiburTetap(tahun).forEach((l) => { libur[l.bulan + '-' + l.tanggal] = l.nama; });
    const khusus = bacaKhusus().filter((k) => k.tahun === tahun);
    khusus.forEach((k) => { libur[k.bulan + '-' + k.tanggal] = k.nama; });
    const fotoHtml = fotoUrl
      ? '<div style="text-align:center;margin-bottom:12px"><img src="' + T.esc(fotoUrl) + '" alt="Foto kalender" style="max-width:100%;max-height:220px;border-radius:8px"></div>'
      : '';

    let isi = '';
    if (modeI.value === 'tahun') {
      isi = '<div class="kal-page" style="background:#fff;color:#000;padding:8px"><h2 style="text-align:center;margin:4px 0 12px;font-size:22px">Kalender ' + tahun + '</h2>' + fotoHtml +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">';
      for (let b = 0; b < 12; b++) {
        isi += '<div><div style="text-align:center;font-weight:700;margin-bottom:4px;font-size:12px">' + NAMA_BULAN[b] + '</div>' + tabelBulan(tahun, b, libur, false) + '</div>';
      }
      isi += '</div><p style="font-size:10px;color:#666;margin-top:10px">Tanggal merah: hari Minggu dan libur nasional bertanggal tetap. Libur yang tanggalnya berubah tiap tahun (Idulfitri, Nyepi, Waisak, Imlek, cuti bersama) mengikuti SKB 3 Menteri dan tidak dimasukkan di sini.</p></div>';
    } else {
      const b = Number(bulanI.value);
      isi = '<div class="kal-page" style="background:#fff;color:#000;padding:8px"><h2 style="text-align:center;margin:4px 0 12px;font-size:26px">' + NAMA_BULAN[b] + ' ' + tahun + '</h2>' + fotoHtml +
        tabelBulan(tahun, b, libur, true);
      const daftarLibur = hariLiburTetap(tahun).filter((l) => l.bulan === b).concat(khusus.filter((k) => k.bulan === b));
      if (daftarLibur.length) {
        isi += '<ul style="font-size:13px;margin-top:12px;padding-left:18px">' + daftarLibur.map((l) => '<li><b>' + l.tanggal + ' ' + NAMA_BULAN[l.bulan] + '</b>: ' + T.esc(l.nama) + '</li>').join('') + '</ul>';
      }
      isi += '</div>';
    }
    T.show(box, '<div id="kalender-print">' + isi + '</div>');
    T.scrollToPreview(box);
  };

  root.appendChild(T.el('<p class="note">Libur yang dimasukkan hanya yang tanggalnya tetap tiap tahun (Tahun Baru, Hari Buruh, Hari Lahir Pancasila, 17 Agustus, Natal). Libur yang tanggalnya berubah tiap tahun mengikuti SKB 3 Menteri, jadi tambahkan sendiri lewat tanggal khusus di bawah.</p>'));
  root.appendChild(T.grid2(T.field('Tahun', tahunI), T.field('Tampilan', modeI)));
  root.appendChild(T.field('Bulan (untuk tampilan sebulan per halaman)', bulanI));
  root.appendChild(T.field('Foto di kalender (boleh kosong)', fotoI, 'Foto hanya dipakai di halaman ini, tidak diunggah ke mana-mana.'));
  root.appendChild(T.field('Tanggal khusus (boleh kosong)', khususI, 'Satu per baris. Format: tanggal-bulan-tahun lalu nama acaranya. Contoh: 15-8-2027 Acara keluarga.'));
  root.appendChild(T.row(T.btn('Buat Kalender', buat, true), T.btn('Cetak / Simpan PDF', () => { if (!box.innerHTML) { T.toast('Buat kalendernya dulu'); return; } window.print(); })));
  root.appendChild(box);
}
