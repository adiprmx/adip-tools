import { h as T, kv, errBox, todayISO } from '../../core.js?v=6.12.0';

// Halaman awal tiap juz, mushaf standar Madinah 604 halaman.
// Diverifikasi dari AlQuran Cloud API (ayat pertama surah pembuka juz)
// dan daftar mushaf Madinah: juz 1 mulai hal. 1, juz 2 hal. 22,
// juz 18 hal. 342, juz 26 hal. 502, juz 29 hal. 562, juz 30 hal. 582.
const JUZ_START = [1, 22, 42, 62, 82, 102, 122, 142, 162, 182, 202, 222, 242, 262, 282, 302, 322, 342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582];
const TOTAL_HAL = 604;
const KEY = 'adip-tools-target-khatam';

const juzOf = (hal) => { let j = 1; for (let i = 0; i < 30; i++) if (hal >= JUZ_START[i]) j = i + 1; return j; };
const juzEnd = (j) => (j < 30 ? JUZ_START[j] - 1 : TOTAL_HAL);
const toUTC = (iso) => { const p = String(iso || '').split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); };
const fmtTgl = (ms) => new Date(ms).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
const fmtTglPanjang = (ms) => new Date(ms).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } };
const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };

export const meta = {"id": "target-khatam", "name": "Target Khatam", "cat": "indonesia", "icon": "📖", "desc": "Rencana khatam Al-Quran: dari posisi sekarang dan tanggal target, hitung berapa halaman per hari plus jadwal hariannya.", "keywords": "khatam,quran,alquran,juz,halaman,target,tilawah,baca,ramadhan,jadwal", "since": "6.11.0"};
export function render(root) {
  const saved = load();
  const defTarget = (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); })();

  const juzSel = T.select(Array.from({ length: 30 }, (_, i) => [String(i + 1), 'Juz ' + (i + 1) + ' (hal. ' + JUZ_START[i] + '–' + juzEnd(i + 1) + ')']), String(saved.juz || 1));
  const halI = T.input('text', 'cth: 1', String(saved.page || 1)); halI.inputMode = 'decimal';
  const tglI = T.input('date', '', saved.target || defTarget);
  const box = T.out();

  const hitung = () => {
    const page = Math.floor(T.num(halI.value) || 0);
    if (!(page >= 1 && page <= TOTAL_HAL)) { T.show(box, errBox('Halaman diisi 1 sampai 604.')); return; }
    const targetMs = toUTC(tglI.value);
    if (!targetMs) { T.show(box, errBox('Pilih tanggal target dulu.')); return; }
    const todayMs = toUTC(todayISO());
    const hari = Math.floor((targetMs - todayMs) / 86400000) + 1;
    if (hari < 1) { T.show(box, errBox('Tanggal target sudah lewat. Pilih tanggal hari ini atau sesudahnya.')); return; }
    const sisa = TOTAL_HAL - page + 1;
    const perHari = Math.ceil(sisa / hari);
    const juz = juzOf(page);
    const perHariJuz = (perHari / 20).toLocaleString('id-ID', { maximumFractionDigits: 1 });

    // Bagi rata: hari-hari awal dapat 1 halaman ekstra bila tidak habis dibagi.
    const dasar = Math.floor(sisa / hari);
    const ekstra = sisa % hari;
    let rows = '';
    let hal = page;
    for (let i = 0; i < hari; i++) {
      const jml = dasar + (i < ekstra ? 1 : 0);
      const akhir = hal + jml - 1;
      const tgl = todayMs + i * 86400000;
      rows += '<div class="kv"><span class="k">' + T.esc(fmtTgl(tgl)) + (i === 0 ? ' (hari ini)' : '') + '</span><span class="v">hal. ' + hal + '–' + akhir + ' · juz ' + juzOf(hal) + (juzOf(akhir) !== juzOf(hal) ? '–' + juzOf(akhir) : '') + '</span></div>';
      hal = akhir + 1;
    }

    T.show(box,
      '<div class="big center">' + perHari + ' halaman/hari</div>' +
      '<p class="center hint">sekitar ' + perHariJuz + ' juz per hari, selama ' + hari + ' hari</p>' +
      kv('Posisi sekarang', 'Halaman ' + page + ' · juz ' + juz) +
      kv('Sisa bacaan', sisa + ' halaman') +
      kv('Target selesai', T.esc(fmtTglPanjang(targetMs))) +
      '<p class="hint" style="margin-top:12px">Jadwal harian</p>' +
      '<div style="max-height:320px;overflow:auto">' + rows + '</div>' +
      '<p class="hint">Hitungan memakai mushaf standar Madinah 604 halaman (1 juz sekitar 20 halaman). Kalau mushafmu beda cetakan, jumlah halamannya bisa sedikit berbeda.</p>');
  };

  const simpan = () => {
    const page = Math.floor(T.num(halI.value) || 0);
    if (!(page >= 1 && page <= TOTAL_HAL)) { T.show(box, errBox('Halaman diisi 1 sampai 604.')); return; }
    save({ page, juz: juzOf(page), target: tglI.value });
    hitung();
    T.toast('Progres tersimpan');
  };

  juzSel.addEventListener('change', () => { halI.value = String(JUZ_START[+juzSel.value - 1]); hitung(); });
  halI.addEventListener('input', () => { const p = Math.floor(T.num(halI.value) || 0); if (p >= 1 && p <= TOTAL_HAL) juzSel.value = String(juzOf(p)); hitung(); });
  tglI.addEventListener('change', hitung);

  root.appendChild(T.el('<p class="note">Mau khatam sebelum tanggal tertentu? Isi halaman tempatmu berhenti membaca dan tanggal targetnya, nanti dihitung berapa halaman yang perlu dibaca tiap hari.</p>'));
  root.appendChild(T.grid2(
    T.field('Juz sekarang', juzSel),
    T.field('Halaman sekarang', halI, 'Halaman yang sedang dibaca, 1 sampai 604'),
    T.field('Target selesai tanggal', tglI)
  ));
  root.appendChild(T.row(T.btn('Hitung jadwal', hitung, true), T.btn('Simpan progres', simpan)));
  root.appendChild(box);
  hitung();
}
