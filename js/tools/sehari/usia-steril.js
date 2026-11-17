import { h as T, kv, utils } from '../../core.js';

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const fmtTgl = (d) => HARI[d.getUTCDay()] + ', ' + d.getUTCDate() + ' ' + BULAN[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
const parseTgl = (s) => { const p = String(s || '').split('-').map(Number); if (p.length !== 3 || p.some(isNaN)) return null; const d = new Date(Date.UTC(p[0], p[1] - 1, p[2])); return isNaN(d.getTime()) ? null : d; };
const tambahBulan = (d, n) => { const x = new Date(d.getTime()); x.setUTCMonth(x.getUTCMonth() + n); return x; };
const hariIni = () => { const n = new Date(); return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate())); };

// Waktu steril yang dianjurkan. Kucing: sebelum umur 5 bulan
// (Veterinary Task Force on Feline Sterilization, didukung AVMA).
// Anjing: panduan AAHA 2019, batas 20 kg berat dewasa.
utils.usiaSteril = function (jenis, kelamin, ukuran, isoLahir, isoHariIni) {
  const lahir = parseTgl(isoLahir);
  const today = isoHariIni ? parseTgl(isoHariIni) : hariIni();
  if (!lahir || !today) return null;
  let awal, akhir, ket;
  if (jenis === 'kucing') {
    awal = tambahBulan(lahir, 4);
    akhir = tambahBulan(lahir, 5);
    ket = 'Kucing dianjurkan steril sebelum umur 5 bulan. Kucing betina bisa hamil mulai umur 4 bulan, dan steril sebelum birahi pertama menurunkan risiko tumor payudara.';
  } else if (ukuran === 'kecil') {
    if (kelamin === 'jantan') {
      awal = tambahBulan(lahir, 6);
      akhir = tambahBulan(lahir, 6);
      ket = 'Anjing jantan ras kecil dianjurkan steril sekitar umur 6 bulan.';
    } else {
      awal = tambahBulan(lahir, 5);
      akhir = tambahBulan(lahir, 6);
      ket = 'Anjing betina ras kecil dianjurkan steril umur 5-6 bulan, sebelum birahi pertama.';
    }
  } else {
    if (kelamin === 'jantan') {
      awal = tambahBulan(lahir, 9);
      akhir = tambahBulan(lahir, 15);
      ket = 'Anjing jantan ras besar dianjurkan steril setelah selesai tumbuh, umur 9-15 bulan, supaya tulang dan sendi matang dulu.';
    } else {
      awal = tambahBulan(lahir, 5);
      akhir = tambahBulan(lahir, 15);
      ket = 'Anjing betina ras besar dianjurkan steril umur 5-15 bulan. Waktu pastinya diputuskan bersama dokter hewan, menimbang risiko tumor dan risiko sendi.';
    }
  }
  return { awal, akhir, ket, sudahLewat: today > akhir, sudahMulai: today >= awal };
};

export const meta = {"id": "usia-steril", "name": "Waktu Steril Hewan", "cat": "sehari", "icon": "✂️", "desc": "Kapan waktu steril yang dianjurkan untuk kucing dan anjing, dari tanggal lahir.", "keywords": "steril,kucing,anjing,umur,kebiri,spay,neuter", "since": "6.11.0"};
export function render(root) {
  const jenis = T.select([['kucing', 'Kucing'], ['anjing', 'Anjing']], 'kucing');
  const kelamin = T.select([['jantan', 'Jantan'], ['betina', 'Betina']], 'jantan');
  const ukuran = T.select([
    ['kecil', 'Ras kecil (berat dewasa di bawah 20 kg)'],
    ['besar', 'Ras besar (berat dewasa 20 kg atau lebih)'],
  ], 'kecil');
  const ukuranField = T.field('Ukuran ras (untuk anjing)', ukuran);
  const tgl = T.input('date');
  const box = T.out();

  const aturUkuran = () => { ukuranField.style.display = jenis.value === 'anjing' ? '' : 'none'; };
  jenis.addEventListener('change', aturUkuran);
  aturUkuran();

  const hitung = () => {
    const lahir = parseTgl(tgl.value);
    if (!lahir) { T.show(box, '<span class="err">Pilih tanggal lahir hewan dulu.</span>'); return; }
    if (lahir > hariIni()) { T.show(box, '<span class="err">Tanggal lahirnya masih di masa depan. Cek lagi tanggalnya.</span>'); return; }
    const r = utils.usiaSteril(jenis.value, kelamin.value, ukuran.value, tgl.value);
    const sama = r.awal.getTime() === r.akhir.getTime();
    let statusHtml;
    if (r.sudahLewat) {
      statusHtml = '<p class="warn">Waktu yang dianjurkan sudah lewat, tapi steril masih bisa dilakukan di umur berapa pun. Tanya dokter hewan untuk jadwalnya.</p>';
    } else if (r.sudahMulai) {
      statusHtml = '<p class="ok">Sekarang sudah masuk waktu yang dianjurkan.</p>';
    } else {
      statusHtml = '<p class="hint">Waktunya belum tiba. Tandai tanggal di bawah ini.</p>';
    }
    T.show(box,
      '<div class="center"><div class="dim">Waktu steril yang dianjurkan</div>' +
      '<div class="big">' + (sama ? fmtTgl(r.awal) : fmtTgl(r.awal) + ' - ' + fmtTgl(r.akhir)) + '</div></div>' +
      statusHtml +
      '<p class="hint">' + r.ket + '</p>' +
      '<p class="hint">Sumber: panduan AAHA 2019 untuk anjing, dan Veterinary Task Force on Feline Sterilization (didukung AVMA) untuk kucing. Ini panduan umum. Untuk keputusan medis, konsultasikan ke dokter hewan.</p>');
  };
  tgl.addEventListener('change', hitung);

  root.appendChild(T.grid2(
    T.field('Jenis hewan', jenis),
    T.field('Jenis kelamin', kelamin),
  ));
  root.appendChild(ukuranField);
  root.appendChild(T.field('Tanggal lahir', tgl));
  root.appendChild(T.btn('Lihat Waktu Steril', hitung, true));
  root.appendChild(box);
  T.show(box, '<p class="hint">Pilih jenis, kelamin, dan tanggal lahir, lalu tekan Lihat Waktu Steril.</p>');
}
