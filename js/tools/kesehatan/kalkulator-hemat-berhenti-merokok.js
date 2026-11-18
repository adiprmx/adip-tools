import { h as T, esc } from '../../core.js';

// Hemat berhenti merokok: dari jumlah batang per hari, harga per bungkus,
// dan tanggal berhenti. Waktu hidup yang didapat memakai angka studi
// Shaw dkk. (BMJ, 2000): tiap batang rokok memangkas sekitar 11 menit
// harapan hidup. Hari dihitung dari tanggal berhenti sampai hari ini.
function hariSejak(tglISO) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(tglISO || '').trim());
  if (!m) return null;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  const now = new Date();
  const hariIni = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((hariIni - t) / 86400000);
}

function fmtWaktu(menit) {
  if (menit < 60) return Math.round(menit) + ' menit';
  if (menit < 1440) return (menit / 60).toFixed(1) + ' jam';
  return (menit / 1440).toFixed(1) + ' hari';
}

export const meta = {"id": "kalkulator-hemat-berhenti-merokok", "name": "Kalkulator Hemat Berhenti Merokok", "cat": "kesehatan", "icon": "🚭", "desc": "Berapa uang, batang rokok, dan waktu hidup yang kamu dapat sejak berhenti merokok.", "keywords": "berhenti merokok,hemat,rokok,uang,quit smoking,hemat rokok", "since": "6.17.0"};
export function render(root) {
  const batang = T.input('number', 'Batang rokok per hari', '12');
  const harga = T.input('number', 'Harga per bungkus (Rp)', '40000');
  const isi = T.select([['20', '20 batang per bungkus'], ['16', '16 batang per bungkus'], ['12', '12 batang per bungkus']], '20');
  const tgl = T.input('date', 'Tanggal berhenti merokok', '');
  const box = T.out();

  const hitung = () => {
    const perHari = T.num(batang.value);
    const hrg = T.num(harga.value);
    const perBungkus = Number(isi.value);
    if (!(perHari > 0 && perHari <= 200)) {
      T.show(box, '<span class="err">Isi jumlah batang per hari antara 1 sampai 200.</span>');
      return;
    }
    if (!(hrg > 0 && hrg <= 10000000)) {
      T.show(box, '<span class="err">Isi harga per bungkus dengan angka yang masuk akal.</span>');
      return;
    }
    const hari = hariSejak(tgl.value);
    if (hari === null) {
      T.show(box, '<span class="err">Isi tanggal berhenti merokok.</span>');
      return;
    }
    if (hari < 0) {
      T.show(box, '<span class="err">Tanggal berhentinya masih di masa depan. Isi tanggal hari ini atau sebelumnya.</span>');
      return;
    }
    const hematPerHari = perHari / perBungkus * hrg;
    const tidakDihisap = hari * perHari;
    const hematTotal = tidakDihisap / perBungkus * hrg;
    const menitHidup = tidakDihisap * 11;
    T.show(box,
      '<div class="center"><div class="dim">Uang yang sudah kamu hemat</div>' +
      '<div class="big">' + T.rp(hematTotal) + '</div>' +
      '<div class="dim">' + T.fmt(hari) + ' hari tanpa rokok</div></div>' +
      '<div class="kv"><span class="k">Batang yang tidak dihisap</span><span class="v">' + T.fmt(tidakDihisap) + ' batang</span></div>' +
      '<div class="kv"><span class="k">Waktu hidup yang didapat</span><span class="v">sekitar ' + fmtWaktu(menitHidup) + '</span></div>' +
      '<div class="kv"><span class="k">Hemat per hari</span><span class="v">' + T.rp(hematPerHari) + '</span></div>' +
      '<div class="kv"><span class="k">Hemat per minggu</span><span class="v">' + T.rp(hematPerHari * 7) + '</span></div>' +
      '<div class="kv"><span class="k">Hemat per bulan (30 hari)</span><span class="v">' + T.rp(hematPerHari * 30) + '</span></div>' +
      '<div class="kv"><span class="k">Hemat per tahun</span><span class="v">' + T.rp(hematPerHari * 365) + '</span></div>' +
      '<p class="hint">Waktu hidup dihitung dari studi Shaw dkk. (BMJ, 2000): tiap batang rokok memangkas sekitar 11 menit harapan hidup. Angka itu rata-rata penelitian, bukan hitungan pasti buat satu orang. ' +
      'Uang yang dihemat dihitung dari harga yang kamu isi, tanpa menghitung kenaikan harga rokok. Hasil ini perkiraan buat penyemangat, bukan diagnosis. ' +
      'Buat keputusan medis, konsultasikan ke tenaga kesehatan. Bila sulit berhenti, tanya dokter atau layanan berhenti merokok.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Batang rokok per hari', batang, 'Jumlah yang dulu kamu hisap tiap hari.'),
    T.field('Harga per bungkus (Rp)', harga),
  ));
  root.appendChild(T.grid2(
    T.field('Isi per bungkus', isi),
    T.field('Tanggal berhenti merokok', tgl),
  ));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
}
