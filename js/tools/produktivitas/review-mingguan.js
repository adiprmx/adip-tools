import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id":"review-mingguan","name":"Review Mingguan","cat":"produktivitas","icon":"📝","desc":"Refleksi mingguan: 3 yang beres, 3 pelajaran, 3 fokus.","keywords":"review,mingguan,refleksi,weekly,jurnal,evaluasi,fokus,retro"};

const KOLS = [
  ['beres', '✅ 3 yang beres', 'Apa aja yang kelar minggu ini? Sekecil apapun, tulis.'],
  ['pelajaran', '💡 3 pelajaran', 'Apa yang kamu pelajari — dari yang mulus maupun yang zonk.'],
  ['fokus', '🎯 3 fokus minggu depan', 'Maksimal 3. Yang beneran penting, bukan wish list.'],
];

function mingguIni() {
  // ISO week: YYYY-Www
  const d = new Date();
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - day + 3);
  const first = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((t - first) / 86400000 - 3 + ((first.getUTCDay() + 6) % 7)) / 7);
  return t.getUTCFullYear() + '-W' + String(week).padStart(2, '0');
}

export function render(root) {
  const KEY = 'adip-tools:review-mingguan';
  let data = {};
  try { data = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { data = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} };

  root.appendChild(T.el('<p class="hint">Tiap akhir minggu, duduk sebentar: apa yang beres, apa pelajarannya, terus fokus ke mana minggu depan. 5 menit doang, tapi ngefek. 🌱</p>'));

  const weekInp = T.input('week');
  weekInp.value = mingguIni();

  const tas = {};
  const kolomWrap = T.el('<div></div>');

  const muat = () => {
    const w = weekInp.value || mingguIni();
    const entry = data[w] || {};
    KOLS.forEach(([k]) => {
      tas[k].forEach((ta, i) => { ta.value = (entry[k] && entry[k][i]) || ''; });
    });
  };

  const simpan = () => {
    const w = weekInp.value || mingguIni();
    const entry = { beres: [], pelajaran: [], fokus: [] };
    KOLS.forEach(([k]) => { entry[k] = tas[k].map((ta) => ta.value.trim()); });
    if (!entry.beres.some(Boolean) && !entry.pelajaran.some(Boolean) && !entry.fokus.some(Boolean)) {
      T.toast('Isi dulu minimal satu kolom');
      return;
    }
    data[w] = entry;
    save(); drawRiwayat();
    T.toast('Review minggu ' + w + ' kesimpan!');
  };

  weekInp.addEventListener('change', muat);

  root.appendChild(T.field('Minggu', weekInp, 'Pilih minggu yang mau direview'));

  KOLS.forEach(([k, judul, ph]) => {
    kolomWrap.appendChild(T.el('<div style="margin:14px 0 6px"><b>' + judul + '</b></div>'));
    tas[k] = [];
    for (let i = 0; i < 3; i++) {
      const ta = T.ta(2, (i + 1) + '. ' + ph);
      ta.style.marginBottom = '6px';
      tas[k].push(ta);
      kolomWrap.appendChild(ta);
    }
  });
  root.appendChild(kolomWrap);
  root.appendChild(T.row(T.btn('Simpan review', simpan, true), T.btn('Kosongkan', muat)));
  root.appendChild(T.el('<div style="height:14px"></div>'));

  const riwBox = T.el('<div></div>');
  root.appendChild(riwBox);

  const drawRiwayat = () => {
    riwBox.innerHTML = '';
    const weeks = Object.keys(data).sort().reverse();
    if (!weeks.length) return;
    riwBox.appendChild(T.el('<div style="margin-bottom:8px"><b>📚 Riwayat minggu lalu</b></div>'));
    weeks.forEach((w) => {
      const e = data[w];
      const n = (e.beres || []).filter(Boolean).length + (e.pelajaran || []).filter(Boolean).length + (e.fokus || []).filter(Boolean).length;
      const card = T.el('<div class="card" style="margin-bottom:8px;padding:10px 12px"></div>');
      const head = T.el('<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"></div>');
      head.appendChild(T.el('<b style="font-size:13px">Minggu ' + T.esc(w) + '</b><span class="mut" style="font-size:11px">' + n + ' catatan</span>'));
      const lihat = T.btn('Lihat', () => { weekInp.value = w; muat(); window.scrollTo(0, 0); T.toast('Review minggu ' + w + ' dimuat'); });
      lihat.style.cssText = 'padding:4px 10px;margin-left:auto';
      head.appendChild(lihat);
      const del = T.btn('✕', () => {
        if (confirm('Hapus review minggu ' + w + '?')) {
          delete data[w]; save(); drawRiwayat();
        }
      });
      del.style.cssText = 'padding:4px 9px';
      head.appendChild(del);
      card.appendChild(head);
      const isi = [];
      KOLS.forEach(([k, judul]) => {
        const arr = (e[k] || []).filter(Boolean);
        if (arr.length) isi.push('<div style="font-size:12px;margin-top:6px"><b>' + judul + '</b><ul style="margin:4px 0 0;padding-left:18px;line-height:1.6">' + arr.map((x) => '<li>' + T.esc(x) + '</li>').join('') + '</ul></div>');
      });
      if (isi.length) card.appendChild(T.el('<div>' + isi.join('') + '</div>'));
      riwBox.appendChild(card);
    });
  };

  muat();
  drawRiwayat();
}
