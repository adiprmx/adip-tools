import { h as T } from '../../core.js?v=6.9.5';

export const meta = {"id": "kurva-energi", "name": "Kurva Energi Set", "cat": "musik", "icon": "📈", "desc": "Visualisasi alur energi set DJ: bar chart + statistik peak, valley, rata-rata.", "keywords": "kurva,energi,energy,set,dj,alur,peak,valley,chart"};

export function render(root) {
  // Skala dingin -> panas untuk energy 1-10
  const heat = (e) => {
    const c = ['#38bdf8', '#38bdf8', '#34d399', '#34d399', '#a3e635', '#facc15', '#fbbf24', '#fb923c', '#f87171', '#ef4444'];
    return c[Math.min(10, Math.max(1, Math.round(e))) - 1];
  };
  const LOW = 4; // energy <= 4 dianggap low

  let tracks = [
    { judul: 'Warm Up Groove', energy: 4 },
    { judul: 'Groove Builder', energy: 6 },
    { judul: 'Peak Hour Driver', energy: 9 },
    { judul: 'Hands In The Air', energy: 8 },
    { judul: 'Cool Down', energy: 5 }
  ];

  const taIn = T.ta(4, 'Tempel daftar: "Judul | energy" per baris');
  const nmIn = T.input('text', 'Judul lagu');
  const enIn = T.input('number', 'Energy 1–10', '5');
  enIn.style.maxWidth = '110px';
  const chartBox = T.el('<div></div>');
  const statBox = T.out();

  const parseLines = (txt) => {
    const out = [];
    String(txt).split('\n').forEach((ln) => {
      const line = ln.trim();
      if (!line) return;
      const parts = line.split('|');
      const judul = (parts[0] || '').trim();
      const energy = Math.round(+String(parts[1] || '').trim());
      if (judul && Number.isFinite(energy) && energy >= 1 && energy <= 10) out.push({ judul, energy });
    });
    return out;
  };

  const paint = () => {
    chartBox.innerHTML = '';
    if (!tracks.length) {
      chartBox.innerHTML = '<div class="mut center" style="padding:24px 0">Belum ada lagu — tambah di atas atau import dari textarea.</div>';
      T.show(statBox, '');
      return;
    }
    const wrap = T.el('<div style="display:flex;align-items:flex-end;gap:6px;height:220px;padding:12px 4px 0;border-bottom:1px solid #ffffff20;overflow-x:auto"></div>');
    tracks.forEach((t, i) => {
      const col = T.el('<div style="flex:1 0 44px;min-width:44px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%"></div>');
      const val = T.el('<div style="font-size:12px;font-weight:700;margin-bottom:4px;font-variant-numeric:tabular-nums">' + t.energy + '</div>');
      const bar = T.el('<div data-i="' + i + '" title="' + T.esc(t.judul) + ' — energy ' + t.energy + '" style="width:100%;max-width:64px;height:' + (t.energy * 10) + '%;background:' + heat(t.energy) + ';border-radius:6px 6px 0 0;min-height:6px"></div>');
      const lbl = T.el('<div style="font-size:10px;color:#a1a1aa;margin-top:6px;max-width:64px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + T.esc(t.judul) + '</div>');
      const del = T.el('<button data-i="' + i + '" style="background:none;border:none;color:#71717a;font-size:12px;cursor:pointer;padding:2px" title="Hapus">✕</button>');
      del.addEventListener('click', () => { tracks.splice(i, 1); paint(); });
      col.appendChild(val); col.appendChild(bar); col.appendChild(lbl); col.appendChild(del);
      wrap.appendChild(col);
    });
    chartBox.appendChild(wrap);

    const en = tracks.map((t) => t.energy);
    const peak = Math.max.apply(null, en), valley = Math.min.apply(null, en);
    const avg = (en.reduce((a, b) => a + b, 0) / en.length).toFixed(1);
    const peakAt = en.indexOf(peak) + 1, valleyAt = en.indexOf(valley) + 1;

    // Deteksi 3+ lagu low (energy <= 4) berturut-turut
    let lowRun = 0, lowRuns = [];
    en.forEach((e, i) => {
      if (e <= LOW) { lowRun++; if (lowRun >= 3) lowRuns.push(i - lowRun + 2); }
      else lowRun = 0;
    });
    // Deteksi drop mendadak (>= 5 poin turun antar lagu berurutan)
    const drops = [];
    en.forEach((e, i) => { if (i > 0 && en[i - 1] - e >= 5) drops.push(i + 1); });

    let saran = '';
    if (lowRuns.length) saran += '<div class="kv"><span>⚠️ Lagu low berturut-turut</span><b style="color:#facc15">mulai lagu ke-' + lowRuns[0] + ' (' + lowRuns.length + 'x)</b></div>';
    if (drops.length) saran += '<div class="kv"><span>⚠️ Drop energi mendadak</span><b style="color:#facc15">sebelum lagu ke-' + drops.join(', ') + '</b></div>';
    if (!saran) saran = '<div class="kv"><span>✅ Alur energi</span><b style="color:#22c55e">aman, tidak ada jebakan</b></div>';

    T.show(statBox,
      '<div class="kv"><span>🔺 Peak (tertinggi)</span><b>' + peak + '/10 — lagu ke-' + peakAt + '</b></div>' +
      '<div class="kv"><span>🔻 Valley (terendah)</span><b>' + valley + '/10 — lagu ke-' + valleyAt + '</b></div>' +
      '<div class="kv"><span>Rata-rata energi</span><b>' + avg + '/10</b></div>' +
      '<div class="kv"><span>Jumlah lagu</span><b>' + tracks.length + '</b></div>' + saran);
  };

  const importBtn = T.btn('📥 Import dari teks', () => {
    const rows = parseLines(taIn.value);
    if (!rows.length) { T.toast('Format: "Judul | energy" per baris, energy 1–10'); return; }
    tracks = tracks.concat(rows);
    taIn.value = '';
    paint();
  });
  const clearBtn = T.btn('🗑 Bersihkan', () => { tracks = []; paint(); });
  const addBtn = T.btn('＋ Tambah lagu', () => {
    const judul = nmIn.value.trim();
    let e = Math.round(+enIn.value);
    if (!judul) { T.toast('Isi judul lagu dulu'); return; }
    if (!Number.isFinite(e) || e < 1 || e > 10) { T.toast('Energy harus 1–10'); return; }
    tracks.push({ judul, energy: e });
    nmIn.value = '';
    paint();
    try { T.beep(660, 0.12); } catch (err) { /* audio tidak tersedia */ }
  }, true);

  root.appendChild(T.el('<div class="h3">📈 Kurva Energi Set</div>'));
  root.appendChild(T.el('<div class="hint" style="margin-bottom:10px">Lihat alur energi set DJ-mu. Biru = chill, merah = peak. Fokus ke KURVA energi, bukan key/BPM.</div>'));
  root.appendChild(T.field('Import cepat (satu lagu per baris)', taIn));
  root.appendChild(T.row(importBtn, clearBtn));
  root.appendChild(T.el('<div class="h3" style="margin-top:16px">＋ Tambah manual</div>'));
  root.appendChild(T.grid2(
    T.field('Judul lagu', nmIn),
    T.field('Energy (1–10)', enIn)
  ));
  root.appendChild(T.row(addBtn));
  root.appendChild(T.el('<div class="h3" style="margin-top:16px">📊 Kurva</div>'));
  root.appendChild(chartBox);
  root.appendChild(statBox);
  root.appendChild(T.el('<div class="hint" style="margin-top:10px">Saran DJ: hindari 3+ lagu low (≤4) berturut-turut — lantai dansa bisa "mati". Bangun ke peak, beri jeda napas, tutup dengan manis.</div>'));

  paint();
}
