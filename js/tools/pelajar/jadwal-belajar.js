import { h as T, utils } from '../../core.js';

export const meta = {"id":"jadwal-belajar","name":"Jadwal Belajar","cat":"pelajar","icon":"🗓️","desc":"Susun jadwal belajar mingguan otomatis dari daftar mapelmu.","keywords":"jadwal,belajar,rencana,mingguan,mapel,waktu,rutin"};

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const fm = (m) => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(((m % 60) + 60) % 60).padStart(2, '0');

// Susun jadwal mingguan. Murni, bisa diuji di Node.
// mapels: [{ nama, target }] target dalam jam/minggu.
// Alokasi dikunci per INDEKS mapel, bukan per nama — dua baris mapel
// bernama sama ("Matematika" 3 jam dan "Matematika" 2 jam) adalah dua
// target berbeda dan tidak boleh bergabung. Nama tampil diberi nomor
// "(2)", "(3)" bila namanya duplikat, supaya ringkasan tidak membingungkan.
export function susunJadwal(mapels, jumlahHari, jamHari, sesiLen, istirahat, mulaiMenit) {
  const daftar = (mapels || []).filter((m) => m && m.target > 0);
  // Nama tampil: duplikat diberi nomor urut.
  const hitungNama = {};
  const tampilNama = daftar.map((m) => {
    const nama = m.nama || 'Tanpa nama';
    hitungNama[nama] = (hitungNama[nama] || 0) + 1;
    return hitungNama[nama] > 1 ? nama + ' (' + hitungNama[nama] + ')' : nama;
  });
  // Bagi jam/hari jadi beberapa sesi (menit per sesi, sisa dibagi rata)
  const totalHari = Math.round(jamHari * 60);
  const nSesi = Math.max(1, Math.round(totalHari / sesiLen));
  const base = Math.floor(totalHari / nSesi);
  const lens = Array(nSesi).fill(base);
  let rem = totalHari - base * nSesi;
  for (let i = 0; rem > 0; i = (i + 1) % nSesi) { lens[i]++; rem--; }

  // Alokasi: tiap sesi ambil mapel dengan sisa target terbesar.
  // Sisa dicatat per indeks — bukan per nama.
  const remain = daftar.map((m) => m.target * 60);
  const terjadwal = daftar.map(() => 0);
  const sched = [];
  for (let di = 0; di < jumlahHari; di++) {
    const baris = [];
    let cur = mulaiMenit;
    lens.forEach((len) => {
      let best = -1, bv = 0;
      for (let k = 0; k < remain.length; k++) {
        if (remain[k] > bv) { bv = remain[k]; best = k; }
      }
      if (best < 0) { baris.push(null); cur += len + istirahat; return; }
      const take = Math.min(len, remain[best]);
      baris.push({ mapel: best, m0: cur, m1: cur + take });
      remain[best] -= take;
      terjadwal[best] += take;
      cur += take + istirahat;
    });
    sched.push(baris);
  }
  return { daftar, tampilNama, nSesi, lens, sched, terjadwal };
}

export function render(root) {
  root.appendChild(T.el('<p class="mut">Masukkan mata pelajaran + target jam per minggu, pilih hari luangmu, dan jadwal mingguan tersusun otomatis.</p>'));

  // ---------- 1 · mata pelajaran ----------
  root.appendChild(T.el('<h4 style="margin:14px 0 8px">1 · Mata pelajaran</h4>'));
  const mapelRows = [];
  const listEl = T.el('<div></div>');
  function addMapel(nama, jam) {
    const r = {};
    r.nama = T.input('text', 'Nama mata pelajaran', nama || '');
    r.jam = T.input('number', 'Jam / minggu', jam != null ? String(jam) : '2');
    r.del = T.btn('✕', () => {
      const i = mapelRows.indexOf(r);
      if (i >= 0) mapelRows.splice(i, 1);
      wrap.remove();
    });
    r.del.setAttribute('aria-label', 'Hapus mata pelajaran');
    const wrap = T.el('<div style="border:1px solid var(--line);border-radius:10px;padding:10px;margin-bottom:10px"></div>');
    wrap.appendChild(T.grid2(T.field('Mata pelajaran', r.nama), T.field('Target (jam/minggu)', r.jam)));
    const d = T.el('<div style="text-align:right"></div>');
    d.appendChild(r.del);
    wrap.appendChild(d);
    r.wrap = wrap;
    mapelRows.push(r);
    listEl.appendChild(wrap);
  }
  root.appendChild(listEl);
  addMapel('Matematika', '3');
  addMapel('Bahasa Inggris', '2');
  addMapel('Fisika', '2');
  root.appendChild(T.btn('+ Tambah mata pelajaran', () => addMapel()));

  // ---------- 2 · hari ----------
  root.appendChild(T.el('<h4 style="margin:16px 0 8px">2 · Hari tersedia</h4>'));
  const hariWrap = T.el('<div style="display:flex;flex-wrap:wrap;gap:8px"></div>');
  const boxes = [];
  HARI.forEach((h, i) => {
    const lab = T.el('<label style="display:flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:8px;padding:6px 12px;cursor:pointer;font-size:14px"></label>');
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.checked = i < 5;
    lab.appendChild(cb);
    lab.appendChild(document.createTextNode(h));
    hariWrap.appendChild(lab);
    boxes.push(cb);
  });
  root.appendChild(hariWrap);

  // ---------- 3 · pengaturan ----------
  root.appendChild(T.el('<h4 style="margin:16px 0 8px">3 · Pengaturan sesi</h4>'));
  const mulaiInp = T.input('text', 'cth: 16:00', '16:00');
  const jamInp = T.input('number', 'cth: 2', '2');
  const sesiInp = T.input('number', 'cth: 60', '60');
  const istInp = T.input('number', 'cth: 10', '10');
  root.appendChild(T.grid2(
    T.field('Mulai belajar pukul', mulaiInp, 'Berlaku untuk semua hari'),
    T.field('Jam belajar / hari', jamInp)
  ));
  root.appendChild(T.grid2(
    T.field('Durasi 1 sesi (menit)', sesiInp),
    T.field('Istirahat antar sesi (menit)', istInp)
  ));

  const box = T.out();
  const gen = () => {
    const mapels = mapelRows
      .map((r) => ({ nama: r.nama.value.trim() || 'Tanpa nama', target: T.num(r.jam.value) }))
      .filter((m) => m.target > 0);
    if (!mapels.length) { T.show(box, '<span class="err">Isi minimal satu mata pelajaran dengan target jam &gt; 0.</span>'); return; }
    const days = HARI.filter((_, i) => boxes[i].checked);
    if (!days.length) { T.show(box, '<span class="err">Pilih minimal satu hari.</span>'); return; }
    const jamHari = T.num(jamInp.value);
    const sesiLen = T.num(sesiInp.value);
    const rest = Math.max(0, T.num(istInp.value) || 0);
    if (!(jamHari > 0) || !(sesiLen > 0)) { T.show(box, '<span class="err">Jam per hari dan durasi sesi harus lebih dari 0.</span>'); return; }
    const mm = (mulaiInp.value.trim() || '16:00').split(':');
    const startMin = (Number(mm[0]) || 0) * 60 + (Number(mm[1]) || 0);

    const hasil = susunJadwal(mapels, days.length, jamHari, sesiLen, rest, startMin);
    const { nSesi, sched, terjadwal, tampilNama } = hasil;

    // Tabel: baris = sesi, kolom = hari
    let html = '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13.5px;min-width:' + (days.length * 130) + 'px">';
    html += '<tr><th style="border:1px solid var(--line);padding:8px;background:var(--bg2)">Sesi</th>' +
      days.map((d) => '<th style="border:1px solid var(--line);padding:8px;background:var(--bg2)">' + d + '</th>').join('') + '</tr>';
    for (let s = 0; s < nSesi; s++) {
      html += '<tr><td class="dim" style="border:1px solid var(--line);padding:8px;text-align:center">Sesi ' + (s + 1) + '</td>';
      for (let di = 0; di < days.length; di++) {
        const cell = sched[di][s];
        html += '<td style="border:1px solid var(--line);padding:8px;vertical-align:top">' +
          (cell
            ? '<b>' + T.esc(tampilNama[cell.mapel]) + '</b><br><span class="dim">' + fm(cell.m0) + '–' + fm(cell.m1) + '</span>'
            : '<span class="dim">—</span>') + '</td>';
      }
      html += '</tr>';
    }
    html += '</table></div>';

    // Ringkasan per mapel (per baris input, bukan per nama — mapel
    // bernama sama tampil sebagai baris terpisah dengan angkanya sendiri).
    html += '<h4 style="margin:16px 0 8px">Ringkasan</h4>';
    const kurang = [];
    mapels.forEach((m, i) => {
      const sudah = (terjadwal[i] || 0) / 60;
      const ok = sudah >= m.target - 0.01;
      if (!ok) kurang.push({ nama: tampilNama[i], sisa: m.target - sudah });
      html += '<div class="kv"><span class="k">' + T.esc(tampilNama[i]) + '</span><span class="v ' + (ok ? 'ok' : 'warn') + '">' +
        sudah.toFixed(1).replace(/\.0$/, '') + ' / ' + m.target + ' jam' + '</span></div>';
    });
    html += '<div class="kv"><span class="k">Total waktu belajar</span><span class="v">' +
      (days.length * jamHari) + ' jam/minggu (' + days.length + ' hari)</span></div>';
    if (kurang.length) {
      html += '<p class="warn" style="margin-top:10px">⚠️ Target belum teralokasi penuh: ' +
        kurang.map((k) => T.esc(k.nama) + ' kurang ' + k.sisa.toFixed(1) + ' jam').join('; ') +
        '. Tambah jam per hari atau tambah hari belajar.</p>';
    } else {
      html += '<p class="ok" style="margin-top:10px">✓ Semua target mapel teralokasi. Semangat! 💪</p>';
    }
    T.show(box, html);
    T.scrollToPreview(box);
  };
  root.appendChild(T.el('<div style="height:10px"></div>'));
  root.appendChild(T.row(T.btn('🗓️ Susun jadwal', gen, true)));
  root.appendChild(box);
}
