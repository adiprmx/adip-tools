import { h as T, utils, kv } from '../../core.js';

export const meta = {"id": "kalkulator-runway-usaha", "name": "Kalkulator Runway Usaha", "cat": "bisnis", "icon": "⏳", "desc": "Kas usaha cukup berapa bulan? Hitung runway dari kas dan burn rate, plus skenario potong biaya.", "keywords": "runway,burn rate,kas usaha,bertahan,modal,startup,umkm,potong biaya", "since": "6.13.0"};

function hitungRunway(kas, burn, pemasukan) {
  const netBurn = burn - pemasukan;
  if (netBurn <= 0) return { netBurn, bulan: Infinity, habis: null, overflow: false };
  const bulan = kas / netBurn;
  // Overflow: bulan tidak finite, ATAU tanggal habisnya di luar jangkauan
  // Date (setMonth meluber -> Invalid Date). Keduanya ditandai eksplisit
  // supaya TIDAK disamakan dengan "balik modal" (RT2-02).
  if (!isFinite(bulan)) return { netBurn, bulan, habis: null, overflow: true };
  const habis = new Date();
  habis.setMonth(habis.getMonth() + Math.floor(bulan));
  if (isNaN(habis.getTime())) return { netBurn, bulan, habis: null, overflow: true };
  return { netBurn, bulan, habis, overflow: false };
}

utils.runwayHitung = hitungRunway;

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
function fmtBulanTahun(d) {
  if (!d || isNaN(d.getTime())) return '';
  return BULAN[d.getMonth()] + ' ' + d.getFullYear();
}
function fmtBulan(b) {
  if (!isFinite(b)) return 'tidak terbatas';
  if (b > 1200) return 'lebih dari 100 tahun';
  const t = Math.floor(b / 12);
  const s = Math.floor(b % 12);
  const des = (Math.round(b * 10) / 10).toString().replace('.', ',');
  if (t > 0) return des + ' bulan (' + t + ' tahun ' + s + ' bulan)';
  return des + ' bulan';
}
function vonisRunway(b) {
  if (!isFinite(b)) return { teks: 'Usaha sudah balik modal operasional — pemasukan menutup semua biaya bulanan, kas tidak berkurang.', cls: 'info' };
  if (b < 3) return { teks: 'Bahaya — kas hanya cukup kurang dari 3 bulan. Segera cari pemasukan tambahan atau potong biaya besar-besaran.', cls: 'err' };
  if (b < 6) return { teks: 'Hati-hati — di bawah 6 bulan. Mulai potong biaya yang tidak penting dan kejar pemasukan.', cls: 'warn' };
  if (b < 12) return { teks: 'Cukup — 6 sampai 12 bulan itu ruang bernapas yang sehat untuk usaha kecil. Tetap jaga burn rate.', cls: 'info' };
  return { teks: 'Aman — di atas 12 bulan. Kasmu kuat; fokus ke pertumbuhan, bukan bertahan hidup.', cls: 'info' };
}

export function render(root) {
  const kasI = T.input('text', 'cth: 50000000', '');
  const burnI = T.input('text', 'cth: 8000000', '');
  const masukI = T.input('text', 'cth: 3000000 (boleh 0)', '0');
  [kasI, burnI, masukI].forEach((i) => { i.inputMode = 'decimal'; });
  const potongI = T.select([
    ['10', 'Potong 10%'],
    ['20', 'Potong 20%'],
    ['30', 'Potong 30%'],
    ['50', 'Potong 50%'],
  ], '20');
  const box = T.out();
  const skenarioBox = T.out();

  const hitung = () => {
    const kas = T.num(kasI.value);
    const burn = T.num(burnI.value);
    const masuk = T.num(masukI.value);
    if (!isFinite(kas) || kas < 0) {
      T.toast('Isi sisa kas usahamu dengan angka (boleh 0).'); return;
    }
    if (!isFinite(burn) || burn < 0) {
      T.toast('Isi biaya bulanan usahamu dengan angka (boleh 0).'); return;
    }
    if (!isFinite(masuk) || masuk < 0) {
      T.toast('Isi pemasukan bulanan dengan angka (boleh 0).'); return;
    }
    if (kas === 0) {
      T.show(box, '<p class="center err"><b>Kas sudah 0 — runway habis.</b> Usaha butuh pemasukan atau suntikan dana sekarang juga.</p>');
      T.show(skenarioBox, '');
      return;
    }
    const h = hitungRunway(kas, burn, masuk);
    if (h.overflow) {
      // Kas dibagi burn rate yang sangat kecil -> runway di luar jangkauan
      // hitung (ratusan ribu tahun). Bukan balik modal: kas TETAP berkurang,
      // hanya saja sangat lambat. Tampilkan pesan jujur, tanpa tanggal palsu.
      T.show(box,
        '<div class="center"><div class="dim">Kasmu cukup untuk</div>' +
        '<div class="big">lebih dari 100 tahun</div>' +
        '<div class="dim">Dengan burn rate sekecil ini, kasmu praktis tidak akan habis.</div></div>' +
        kv('Sisa kas', T.rp(kas)) +
        kv('Biaya bulanan (burn rate)', T.rp(burn)) +
        kv('Pemasukan bulanan', T.rp(masuk)) +
        kv('Kas berkurang per bulan', T.rp(h.netBurn)) +
        '<p class="info">Tanggal pastinya tidak bisa dihitung karena angkanya terlalu besar — tapi intinya kasmu sangat aman untuk jangka panjang. Catatan: kas tetap berkurang sedikit tiap bulan, jadi ini bukan berarti usahanya sudah balik modal.</p>');
      T.show(skenarioBox, '');
      return;
    }
    const v = vonisRunway(h.bulan);
    T.show(box,
      '<div class="center"><div class="dim">Kasmu cukup untuk</div>' +
      '<div class="big">' + fmtBulan(h.bulan) + '</div>' +
      (h.habis ? '<div class="dim">Kas diperkirakan habis sekitar <b>' + fmtBulanTahun(h.habis) + '</b></div>' : '') + '</div>' +
      kv('Sisa kas', T.rp(kas)) +
      kv('Biaya bulanan (burn rate)', T.rp(burn)) +
      kv('Pemasukan bulanan', T.rp(masuk)) +
      kv('Kas berkurang per bulan', h.netBurn <= 0 ? 'Rp0 — pemasukan menutup biaya' : T.rp(h.netBurn)) +
      '<p class="' + v.cls + '">' + v.teks + '</p>');

    // Skenario potong biaya: burn rate baru = burn x (1 - potong%).
    const p = Number(potongI.value) / 100;
    const burnBaru = burn * (1 - p);
    const h2 = hitungRunway(kas, burnBaru, masuk);
    const tambah = (isFinite(h2.bulan) && isFinite(h.bulan)) ? h2.bulan - h.bulan : null;
    T.show(skenarioBox,
      '<div style="margin-top:6px"><b>Skenario: potong biaya ' + potongI.value + '%</b></div>' +
      kv('Biaya bulanan baru', T.rp(burnBaru) + ' <span class="dim">(hemat ' + T.rp(burn - burnBaru) + '/bulan)</span>') +
      kv('Runway baru', fmtBulan(h2.bulan) + (h2.habis ? ' <span class="dim">(sampai ' + fmtBulanTahun(h2.habis) + ')</span>' : '')) +
      (tambah !== null && tambah > 0 ? kv('Tambahan waktu bertahan', '+' + (Math.round(tambah * 10) / 10).toString().replace('.', ',') + ' bulan') : '') +
      '<p class="hint">Potong biaya yang tidak langsung menghasilkan uang dulu: langganan yang jarang dipakai, stok berlebih, atau biaya operasional yang bisa dinegosiasi.</p>');
  };

  root.appendChild(T.el('<p class="note">Pertanyaan hidup-mati tiap usaha: kas yang ada cukup berapa bulan? Masukkan sisa kas, biaya bulanan, dan pemasukan bulanan — lalu lihat efeknya bila biaya dipotong.</p>'));
  root.appendChild(T.field('Sisa kas usaha sekarang (Rp)', kasI, 'Uang tunai + saldo rekening usaha yang bisa dipakai.'));
  root.appendChild(T.field('Biaya bulanan / burn rate (Rp)', burnI, 'Semua biaya rutin per bulan: gaji, sewa, stok, listrik, dll.'));
  root.appendChild(T.field('Pemasukan bulanan (Rp)', masukI, 'Uang yang masuk tiap bulan dari jualan. Isi 0 bila belum ada pemasukan.'));
  root.appendChild(T.field('Skenario potong biaya', potongI, 'Lihat runway baru bila biaya bulanan dipotong sebesar ini.'));
  root.appendChild(T.row(T.btn('Hitung Runway', hitung, true)));
  root.appendChild(box);
  root.appendChild(skenarioBox);
  potongI.addEventListener('change', () => { if (!box.hidden) hitung(); });
}
