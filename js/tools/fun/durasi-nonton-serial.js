import { h as T, utils } from '../../core.js';

// Kalkulator Durasi Nonton Serial: total waktu maraton dari jumlah
// episode x durasi, dikurangi intro yang di-skip, dibagi kecepatan
// putar, lalu diterjemahkan ke "selesai dalam berapa hari" dan tanggal
// selesai kalau nonton sekian jam per hari.
export const meta = {"id": "durasi-nonton-serial", "name": "Durasi Nonton Serial", "cat": "fun", "icon": "📺", "desc": "Hitung total waktu maraton serialmu: dari jumlah episode dan durasinya, sampai tanggal selesai kalau nonton sekian jam sehari.", "keywords": "serial,maraton,nonton,durasi,episode,netflix,binge,series", "since": "6.19.0"};

// Total menit: episode x (durasi - skip intro) / kecepatan. Murni.
export function totalMenit(episode, durasi, skipDetik, kecepatan) {
  if (!(episode > 0) || !(durasi > 0) || !(kecepatan > 0)) return NaN;
  const perEpisode = Math.max(0, durasi - (skipDetik || 0) / 60);
  return (episode * perEpisode) / kecepatan;
}

// Hari yang dibutuhkan kalau nonton jamPerHari jam/hari. Murni.
export function hariSelesai(menit, jamPerHari) {
  if (!(menit > 0) || !(jamPerHari > 0)) return NaN;
  return Math.ceil(menit / 60 / jamPerHari);
}

export function fmtMenit(menit) {
  if (!isFinite(menit)) return '-';
  const m = Math.round(menit);
  const hari = Math.floor(m / 1440);
  const jam = Math.floor((m % 1440) / 60);
  const sisa = m % 60;
  const bagian = [];
  if (hari) bagian.push(hari + ' hari');
  if (jam) bagian.push(jam + ' jam');
  if (sisa || !bagian.length) bagian.push(sisa + ' menit');
  return bagian.join(' ');
}

export function render(root) {
  const box = T.out();
  const epI = T.input('number', 'cth: 100');
  const durI = T.input('number', 'cth: 45');
  const skipI = T.input('number', 'cth: 90 (boleh kosong)');
  const kecS = T.select([['1', '1x (normal)'], ['1.25', '1,25x'], ['1.5', '1,5x'], ['2', '2x']], '1');
  const jamI = T.input('number', 'cth: 2');
  jamI.value = '2';

  const hitung = () => {
    const ep = T.num(epI.value);
    const dur = T.num(durI.value);
    const skip = T.num(skipI.value) || 0;
    const kec = Number(kecS.value);
    const jam = T.num(jamI.value);
    if (!(ep > 0)) { T.toast('Isi jumlah episode dengan angka lebih dari 0'); return; }
    if (!(dur > 0)) { T.toast('Isi durasi per episode dengan angka lebih dari 0'); return; }
    if (skip < 0) { T.toast('Skip intro tidak boleh negatif'); return; }
    const menit = totalMenit(ep, dur, skip, kec);
    const hemat = skip > 0 ? (ep * Math.min(skip, dur * 60)) / 60 : 0;
    let html = '<div class="big center">' + fmtMenit(menit) + '</div>' +
      '<p class="center hint">total ' + T.fmt(Math.round(menit)) + ' menit untuk ' + T.fmt(ep) + ' episode' +
      (kec !== 1 ? ' di kecepatan ' + String(kec).replace('.', ',') + 'x' : '') + '</p>' +
      '<div style="margin-top:12px">' +
      '<div class="kv"><span class="k">Maraton nonstop</span><span class="v">' + fmtMenit(menit) + ' tanpa tidur</span></div>';
    if (hemat > 0) html += '<div class="kv"><span class="k">Hemat waktu karena skip intro</span><span class="v">' + fmtMenit(hemat) + '</span></div>';
    html += '</div>';
    if (jam > 0) {
      const hari = hariSelesai(menit, jam);
      const selesai = new Date();
      selesai.setDate(selesai.getDate() + hari);
      const tgl = selesai.getDate() + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][selesai.getMonth()] + ' ' + selesai.getFullYear();
      html += '<div style="margin-top:12px">' +
        '<div class="kv"><span class="k">Kalau nonton ' + utils.r4(jam) + ' jam/hari</span><span class="v">selesai dalam ' + hari + ' hari</span></div>' +
        '<div class="kv"><span class="k">Mulai hari ini, tamat tanggal</span><span class="v">' + tgl + '</span></div>' +
        '</div>';
    } else {
      html += '<p class="hint">Isi "jam nonton per hari" untuk melihat tanggal tamatnya.</p>';
    }
    T.show(box, html);
  };

  root.appendChild(T.el('<p class="hint">Mau maraton serial tapi penasaran total waktunya? Isi jumlah episode dan durasinya, sisanya dihitung otomatis.</p>'));
  root.appendChild(T.field('Jumlah episode', epI));
  root.appendChild(T.field('Durasi per episode (menit)', durI));
  root.appendChild(T.field('Skip intro per episode (detik, opsional)', skipI, 'Kosongkan kalau tidak pernah skip intro.'));
  root.appendChild(T.field('Kecepatan putar', kecS));
  root.appendChild(T.field('Jam nonton per hari', jamI, 'Untuk menghitung tanggal tamat.'));
  root.appendChild(T.row(T.btn('Hitung durasi', hitung, true)));
  root.appendChild(box);
}
