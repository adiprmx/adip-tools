import { h as T } from '../../core.js?v=6.9.5';

export const meta = {"id": "setlist-dj", "name": "Perencana Setlist DJ", "cat": "musik", "icon": "🎧", "desc": "Susun urutan lagu DJ: key Camelot, BPM, durasi, energy + saran transisi.", "keywords": "setlist,dj,perencana,camelot,key,transisi,bpm,energy,set"};

export function render(root) {
  const fmtDur = (mins) => {
    const m = Math.round(mins);
    const h = Math.floor(m / 60), r = m % 60;
    return (h > 0 ? h + ' jam ' : '') + r + ' mnt';
  };
  const parseKey = (k) => {
    const m = /^\s*(1[0-2]|[1-9])\s*([ABab])\s*$/.exec(String(k == null ? '' : k));
    return m ? { n: +m[1], L: m[2].toUpperCase() } : null;
  };
  // Kompatibilitas Camelot antar dua key berurutan
  const compat = (a, b) => {
    const A = parseKey(a), B = parseKey(b);
    if (!A || !B) return { cls: 'na', dot: '#71717a', label: 'Key tidak valid — cek format (cth: 8A)' };
    if (A.n === B.n && A.L === B.L) return { cls: 'ok', dot: '#22c55e', label: 'Sempurna — key sama, mix tanpa geser nada' };
    if (A.n === B.n) return { cls: 'ok2', dot: '#a3e635', label: 'Smooth — relatif mayor/minor, harmonis' };
    const d = Math.abs(A.n - B.n);
    if (A.L === B.L && (d === 1 || d === 11)) return { cls: 'ok2', dot: '#a3e635', label: 'Smooth — geser ±1 di roda Camelot' };
    return { cls: 'warn', dot: '#ef4444', label: 'Hati-hati — key jauh, siapkan EQ/filter atau echo-out' };
  };

  // Data contoh awal agar tidak kosong
  let songs = [
    { judul: 'Warm Up Groove', key: '8A', bpm: 122, dur: 4, energy: 4 },
    { judul: 'Peak Hour Driver', key: '8B', bpm: 126, dur: 5, energy: 8 },
    { judul: 'Hands In The Air', key: '9B', bpm: 128, dur: 5, energy: 9 }
  ];

  const nmIn = T.input('text', 'Judul lagu');
  const keyIn = T.input('text', 'Key Camelot (cth: 8A)');
  keyIn.style.maxWidth = '130px';
  const bpmIn = T.input('number', 'BPM', '124');
  bpmIn.style.maxWidth = '90px';
  const durIn = T.input('number', 'Durasi (mnt)', '4');
  durIn.style.maxWidth = '90px';
  const enIn = T.input('number', 'Energy 1–10', '5');
  enIn.style.maxWidth = '90px';

  const tableBox = T.el('<div style="overflow-x:auto"></div>');
  const sumBox = T.out();

  const clampNum = (el, min, max, fb) => {
    let v = Math.round(+el.value);
    if (!Number.isFinite(v)) return fb;
    return Math.min(max, Math.max(min, v));
  };

  const paint = () => {
    tableBox.innerHTML = '';
    const tbl = T.el('<table style="width:100%;border-collapse:collapse;font-size:14px;min-width:560px"></table>');
    const th = '<thead><tr>' +
      ['#', 'Judul', 'Key', 'BPM', 'Durasi', 'Enr', ''].map(c =>
        '<th style="text-align:left;padding:8px 6px;border-bottom:1px solid #ffffff20;color:#a1a1aa;font-weight:600;white-space:nowrap">' + c + '</th>').join('') +
      '</tr></thead>';
    let rows = '';
    songs.forEach((s, i) => {
      rows += '<tr data-i="' + i + '">' +
        '<td style="padding:8px 6px;border-bottom:1px solid #ffffff10;color:#71717a">' + (i + 1) + '</td>' +
        '<td style="padding:8px 6px;border-bottom:1px solid #ffffff10;font-weight:600">' + T.esc(s.judul || ('Lagu ' + (i + 1))) + '</td>' +
        '<td style="padding:8px 6px;border-bottom:1px solid #ffffff10"><span style="background:#27272a;border:1px solid #ffffff20;border-radius:6px;padding:2px 8px;font-weight:700">' + T.esc(s.key) + '</span></td>' +
        '<td style="padding:8px 6px;border-bottom:1px solid #ffffff10;font-variant-numeric:tabular-nums">' + s.bpm + '</td>' +
        '<td style="padding:8px 6px;border-bottom:1px solid #ffffff10;font-variant-numeric:tabular-nums">' + s.dur + ' mnt</td>' +
        '<td style="padding:8px 6px;border-bottom:1px solid #ffffff10;font-variant-numeric:tabular-nums">' + s.energy + '/10</td>' +
        '<td style="padding:8px 6px;border-bottom:1px solid #ffffff10;white-space:nowrap;text-align:right">' +
          '<button data-act="up" ' + (i === 0 ? 'disabled' : '') + ' style="background:#18181b;border:1px solid #ffffff20;border-radius:6px;color:#fafafa;padding:2px 8px;margin-right:4px;cursor:pointer" title="Pindah ke atas">▲</button>' +
          '<button data-act="down" ' + (i === songs.length - 1 ? 'disabled' : '') + ' style="background:#18181b;border:1px solid #ffffff20;border-radius:6px;color:#fafafa;padding:2px 8px;margin-right:4px;cursor:pointer" title="Pindah ke bawah">▼</button>' +
          '<button data-act="del" style="background:#18181b;border:1px solid #ef4444;color:#ef4444;border-radius:6px;padding:2px 8px;cursor:pointer" title="Hapus">✕</button>' +
        '</td></tr>';
      if (i < songs.length - 1) {
        const c = compat(s.key, songs[i + 1].key);
        rows += '<tr><td></td><td colspan="6" style="padding:6px 6px 10px;border-bottom:1px solid #ffffff10">' +
          '<span style="display:inline-flex;align-items:center;gap:8px;font-size:13px;color:#a1a1aa">' +
          '<span style="width:10px;height:10px;border-radius:50%;background:' + c.dot + ';display:inline-block"></span>' +
          '<span>⬇ ' + T.esc(c.label) + '</span></span></td></tr>';
      }
    });
    tbl.innerHTML = th + '<tbody>' + rows + '</tbody>';
    tbl.querySelectorAll('button[data-act]').forEach((b) => {
      b.addEventListener('click', () => {
        const i = +b.closest('tr').dataset.i, act = b.dataset.act;
        if (act === 'del') songs.splice(i, 1);
        else if (act === 'up' && i > 0) { const t = songs[i - 1]; songs[i - 1] = songs[i]; songs[i] = t; }
        else if (act === 'down' && i < songs.length - 1) { const t = songs[i + 1]; songs[i + 1] = songs[i]; songs[i] = t; }
        paint();
      });
    });
    tableBox.appendChild(tbl);

    const totalDur = songs.reduce((a, s) => a + (s.dur || 0), 0);
    const avgBpm = songs.length ? Math.round(songs.reduce((a, s) => a + (s.bpm || 0), 0) / songs.length) : 0;
    const avgEn = songs.length ? (songs.reduce((a, s) => a + (s.energy || 0), 0) / songs.length).toFixed(1) : '–';
    let warn = '';
    songs.forEach((s, i) => {
      if (i < songs.length - 1 && compat(s.key, songs[i + 1].key).cls === 'warn') {
        warn += '<div class="kv"><span>⚠️ Transisi ' + (i + 1) + ' → ' + (i + 2) + '</span><b style="color:#ef4444">key jauh</b></div>';
      }
    });
    T.show(sumBox,
      '<div class="kv"><span>Total durasi set</span><b>' + fmtDur(totalDur) + '</b></div>' +
      '<div class="kv"><span>Rata-rata BPM</span><b>' + (songs.length ? avgBpm : '–') + '</b></div>' +
      '<div class="kv"><span>Rata-rata energy</span><b>' + avgEn + '/10</b></div>' +
      '<div class="kv"><span>Jumlah lagu</span><b>' + songs.length + '</b></div>' + warn);
  };

  const addBtn = T.btn('＋ Tambah lagu', () => {
    const judul = nmIn.value.trim();
    const key = keyIn.value.trim().toUpperCase();
    if (!judul) { T.toast('Isi judul lagu dulu'); return; }
    if (!parseKey(key)) { T.toast('Key tidak valid — pakai format Camelot, cth: 8A'); return; }
    songs.push({
      judul: judul,
      key: key,
      bpm: clampNum(bpmIn, 60, 200, 124),
      dur: clampNum(durIn, 1, 60, 4),
      energy: clampNum(enIn, 1, 10, 5)
    });
    nmIn.value = ''; keyIn.value = '';
    paint();
    try { T.beep(660, 0.12); } catch (e) { /* audio tidak tersedia */ }
  }, true);

  root.appendChild(T.el('<div class="h3">🎧 Perencana Setlist DJ</div>'));
  root.appendChild(T.el('<div class="hint" style="margin-bottom:10px">Susun urutan main. Saran transisi dihitung dari key Camelot antar lagu berurutan.</div>'));
  root.appendChild(T.grid2(
    T.field('Judul lagu', nmIn),
    T.field('Key Camelot', keyIn)
  ));
  root.appendChild(T.grid2(
    T.field('BPM', bpmIn),
    T.field('Durasi (menit)', durIn)
  ));
  root.appendChild(T.grid2(
    T.field('Energy (1–10)', enIn),
    T.field('&nbsp;', addBtn)
  ));
  root.appendChild(T.el('<div class="h3" style="margin-top:16px">📋 Daftar lagu</div>'));
  root.appendChild(tableBox);
  root.appendChild(sumBox);
  root.appendChild(T.el('<div class="hint" style="margin-top:10px">🟢 Sempurna = key sama · 🟡 Smooth = relatif mayor/minor atau geser ±1 di roda · 🔴 Hati-hati = key jauh.</div>'));

  paint();
}
