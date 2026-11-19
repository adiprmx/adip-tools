import { h as T, kv, utils } from '../../core.js';

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const fmtTgl = (d) => HARI[d.getUTCDay()] + ', ' + d.getUTCDate() + ' ' + BULAN[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
// parseTgl, tambahHari, hariIni kanonis tinggal di utils (core.js).

// Kehamilan anjing 58-68 hari dari tanggal kawin, rata-rata 63 hari
// (MedVet, AKC). Tonggak mengikuti perkembangan umum kehamilan anjing.
utils.kehamilanAnjing = function (isoKawin, isoHariIni) {
  const kawin = utils.parseTgl(isoKawin);
  const today = isoHariIni ? utils.parseTgl(isoHariIni) : utils.hariIni();
  if (!kawin || !today) return null;
  const hariKe = Math.round((today - kawin) / 86400000);
  const tonggak = [
    { hari: 21, ket: 'Nafsu makan bisa turun sebentar, puting mulai berubah.' },
    { hari: 28, ket: 'USG sudah bisa memastikan kehamilan.' },
    { hari: 42, ket: 'Perut mulai membesar, nafsu makan naik.' },
    { hari: 49, ket: 'Rontgen bisa menghitung jumlah anak.' },
    { hari: 56, ket: 'Siapkan tempat melahirkan yang tenang, hangat, dan bersih.' },
    { hari: 63, ket: 'Perkiraan lahir, 58-68 hari setelah kawin.' },
  ].map((t) => ({ ...t, tgl: utils.tambahHari(kawin, t.hari), lewat: hariKe > t.hari }));
  return { lahirAwal: utils.tambahHari(kawin, 58), lahirAkhir: utils.tambahHari(kawin, 68), lahirTengah: utils.tambahHari(kawin, 63), hariKe, tonggak };
};

export const meta = {"id": "kehamilan-anjing", "name": "Kehamilan Anjing", "cat": "sehari", "icon": "🐾", "desc": "Perkiraan tanggal lahir anak anjing dari tanggal kawin, plus tonggaknya.", "keywords": "anjing,hamil,kehamilan,lahir,anak anjing,kawin", "since": "6.11.0"};
export function render(root) {
  const tgl = T.input('date');
  const box = T.out();

  const hitung = () => {
    const kawin = utils.parseTgl(tgl.value);
    if (!kawin) { T.show(box, '<span class="err">Pilih tanggal kawin dulu.</span>'); return; }
    if (kawin > utils.hariIni()) { T.show(box, '<span class="err">Tanggal kawinnya masih di masa depan. Cek lagi tanggalnya.</span>'); return; }
    const r = utils.kehamilanAnjing(tgl.value);
    let statusHtml;
    if (r.hariKe > 70) {
      statusHtml = '<p class="err">Sudah lewat 70 hari dari tanggal kawin dan belum lahir. Segera bawa ke dokter hewan.</p>';
    } else if (r.hariKe >= 58) {
      statusHtml = '<p class="warn">Sudah masuk masa perkiraan lahir. Suhu badan biasanya turun 12-24 jam sebelum melahirkan.</p>';
    } else {
      statusHtml = '<p class="ok">Hari ini hari ke-' + r.hariKe + ' dari sekitar 58-68 hari kehamilan.</p>';
    }
    let html = '<div class="center"><div class="dim">Perkiraan lahir</div>' +
      '<div class="big">' + fmtTgl(r.lahirTengah) + '</div>' +
      '<div class="dim">Rentang ' + fmtTgl(r.lahirAwal) + ' sampai ' + fmtTgl(r.lahirAkhir) + '</div></div>' +
      statusHtml +
      kv('Tanggal kawin', fmtTgl(kawin));
    r.tonggak.forEach((t) => {
      html += kv('Hari ke-' + t.hari + (t.lewat ? ' (sudah lewat)' : ''), fmtTgl(t.tgl) + '<br><span class="dim">' + t.ket + '</span>');
    });
    html += '<p class="hint">Kehamilan anjing umumnya 58-68 hari, rata-rata 63 hari (MedVet, AKC). Tanggal kawin tidak selalu sama dengan tanggal pembuahan, jadi tanggal lahir bisa maju atau mundur beberapa hari. Ini panduan umum. Untuk keputusan medis, konsultasikan ke dokter hewan.</p>';
    T.show(box, html);
  };
  tgl.addEventListener('change', hitung);

  root.appendChild(T.field('Tanggal kawin', tgl));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  T.show(box, '<p class="hint">Pilih tanggal kawin, lalu tekan Hitung.</p>');
}
