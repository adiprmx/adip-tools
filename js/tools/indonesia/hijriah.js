import { h as T, p2, todayISO } from '../../core.js?v=5.2.0';

// Algoritma Kuwaiti (kalender Hijriah tabular/astronomis).
// Perkiraan — bisa selisih ±1-2 hari dari penetapan rukyat pemerintah.
function g2jdn(y, m, d) {
  const a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}
function jdn2isl(jd) {
  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const mm = Math.floor((24 * l) / 709), dd = l - Math.floor((709 * mm) / 24), yy = 30 * n + j - 30;
  return { y: yy, m: mm, d: dd };
}
function isl2jdn(y, m, d) {
  return Math.floor(d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + Math.floor((3 + 11 * y) / 30) + 1948439.5);
}
function jdn2g(jd) {
  let l = jd + 68569;
  const n = Math.floor(4 * l / 146097);
  l = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor(4000 * (l + 1) / 1461001);
  l = l - Math.floor(1461 * i / 4) + 31;
  const j = Math.floor(80 * l / 2447);
  const dd = l - Math.floor(2447 * j / 80), mm = j + 2 - 12 * Math.floor(j / 11), yy = 100 * (n - 49) + i + Math.floor(j / 11);
  return { y: yy, m: mm, d: dd };
}

const BULAN_H = ['Muharram', 'Safar', 'Rabiulawal', 'Rabiulakhir', 'Jumadilawal', 'Jumadilakhir', 'Rajab', 'Syakban', 'Ramadan', 'Syawal', 'Zulkaidah', 'Zulhijah'];
const BULAN_M = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
// JDN 2460000 = Senin? — hitung weekday dari JDN: (jdn + 1) % 7 → 0=Minggu
const weekday = (jdn) => HARI[(jdn + 1) % 7];

export const meta = {"id": "hijriah", "name": "Konverter Hijriah", "cat": "indonesia", "icon": "🌙", "desc": "Konversi Masehi ↔ Hijriah dua arah.", "keywords": "hijriah,kalender,islam,puasa,lebaran,ramadhan"};
export function render(root) {

    // --- Tab manual ---
    const bar = T.el('<div style="display:flex;gap:8px;margin-bottom:12px"></div>');
    const b1 = T.btn('Masehi → Hijriah', null, true), b2 = T.btn('Hijriah → Masehi', null, false);
    b1.style.flex = '1'; b2.style.flex = '1';
    bar.appendChild(b1); bar.appendChild(b2);
    const page1 = T.el('<div></div>'), page2 = T.el('<div></div>');

    // Page 1: Masehi -> Hijriah
    const tgl = T.input('date', '', todayISO());
    const box1 = T.out();
    const hit1 = () => {
      if (!tgl.value) { T.show(box1, '<p class="warn">Pilih tanggal dulu.</p>'); return; }
      const [y, m, d] = tgl.value.split('-').map(Number);
      const jdn = g2jdn(y, m, d);
      const h = jdn2isl(jdn);
      T.show(box1,
        '<div class="big">' + h.d + ' ' + BULAN_H[h.m - 1] + ' ' + h.y + ' H</div>' +
        '<div class="kv"><span>Hari</span><b>' + weekday(jdn) + '</b></div>' +
        '<div class="kv"><span>Tanggal Masehi</span><span>' + d + ' ' + BULAN_M[m - 1] + ' ' + y + '</span></div>');
    };
    tgl.addEventListener('change', hit1);

    // Page 2: Hijriah -> Masehi
    const hy = T.input('number', 'cth: 1447', '1447'); hy.inputMode = 'numeric';
    const hm = T.select(BULAN_H.map((b, i) => [String(i + 1), (i + 1) + ' — ' + b]), '9');
    const hd = T.input('number', 'cth: 15', '1'); hd.inputMode = 'numeric';
    const box2 = T.out();
    const hit2 = () => {
      const y = parseInt(hy.value, 10), m = parseInt(hm.value, 10), d = parseInt(hd.value, 10);
      if (!(y > 0) || !(m >= 1 && m <= 12) || !(d >= 1 && d <= 30)) { T.show(box2, '<p class="warn">Tanggal Hijriah tidak valid.</p>'); return; }
      const jdn = isl2jdn(y, m, d);
      const g = jdn2g(jdn);
      T.show(box2,
        '<div class="big">' + g.d + ' ' + BULAN_M[g.m - 1] + ' ' + g.y + '</div>' +
        '<div class="kv"><span>Hari</span><b>' + weekday(jdn) + '</b></div>' +
        '<div class="kv"><span>Tanggal Hijriah</span><span>' + d + ' ' + BULAN_H[m - 1] + ' ' + y + ' H</span></div>');
    };
    [hy, hd].forEach((i) => i.addEventListener('input', hit2));
    hm.addEventListener('change', hit2);

    const setTab = (i) => {
      page1.hidden = i !== 0; page2.hidden = i !== 1;
      b1.classList.toggle('primary', i === 0); b2.classList.toggle('primary', i === 1);
    };
    b1.addEventListener('click', () => setTab(0));
    b2.addEventListener('click', () => setTab(1));

    root.appendChild(bar);
    page1.appendChild(T.field('Tanggal Masehi', tgl));
    page1.appendChild(T.row(T.btn('Konversi', hit1, true)));
    page1.appendChild(box1);
    page2.appendChild(T.grid2(
      T.field('Tanggal', hd),
      T.field('Bulan Hijriah', hm)
    ));
    page2.appendChild(T.field('Tahun Hijriah', hy));
    page2.appendChild(T.row(T.btn('Konversi', hit2, true)));
    page2.appendChild(box2);
    root.appendChild(page1);
    root.appendChild(page2);
    setTab(0);
    hit1();
    root.appendChild(T.el('<p class="hint">🌙 Menggunakan algoritma Kuwaiti (kalender Hijriah tabular). Hasil perkiraan — bisa selisih ±1–2 hari dari penetapan resmi pemerintah (sidang isbat / rukyatul hilal).</p>'));

}
