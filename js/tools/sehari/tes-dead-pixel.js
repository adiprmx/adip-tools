import { h as T } from '../../core.js?v=6.13.0';

export const meta = {"id": "tes-dead-pixel", "name": "Tes Dead Pixel", "cat": "sehari", "icon": "🔍", "desc": "Layar penuh warna bergantian untuk mencari piksel yang mati atau macet.", "keywords": "dead pixel,piksel,layar,monitor,stuck pixel", "since": "6.11.0"};

const COLORS = [
  ['Hitam', '#000000'], ['Putih', '#ffffff'], ['Merah', '#ff0000'], ['Hijau', '#00ff00'],
  ['Biru', '#0000ff'], ['Kuning', '#ffff00'], ['Cyan', '#00ffff'], ['Magenta', '#ff00ff'],
];

export function render(root) {
  const info = T.el('<p class="mut" style="font-size:13px">Pemeriksaan ini manual, dilihat dengan mata. Ganti warna dan perhatikan layar dari dekat. Titik hitam di semua warna biasanya piksel mati. Titik berwarna yang tidak berubah biasanya piksel macet.</p>');

  const area = T.el('<div style="position:relative;width:100%;height:280px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:#000;overflow:hidden;cursor:crosshair"></div>');
  const hint = T.el('<div style="position:absolute;left:0;right:0;bottom:10px;text-align:center;font-size:12px;color:rgba(128,128,128,.9);pointer-events:none">Ketuk layar untuk ganti warna</div>');
  area.appendChild(hint);

  const colorRow = T.el('<div style="display:flex;flex-wrap:wrap;gap:6px;margin:12px 0"></div>');
  const markBox = T.out();

  let idx = 0;
  let mode = 'warna';
  let marks = [];

  const paintArea = () => {
    if (idx < COLORS.length) {
      area.style.background = COLORS[idx][1];
      area.style.backgroundImage = 'none';
    } else {
      area.style.background = '#000';
      area.style.backgroundImage = 'repeating-linear-gradient(0deg, rgba(255,255,255,.35) 0 1px, transparent 1px 20px), repeating-linear-gradient(90deg, rgba(255,255,255,.35) 0 1px, transparent 1px 20px)';
    }
    hint.textContent = mode === 'warna'
      ? (idx < COLORS.length ? COLORS[idx][0] + '. Ketuk layar untuk warna berikutnya' : 'Kotak-kotak. Ketuk layar untuk kembali ke hitam')
      : 'Mode tandai. Ketuk titik yang mencurigakan';
  };

  const paintMarks = () => {
    if (!marks.length) { T.hide(markBox); return; }
    let html = '<p style="font-size:13px;margin:0 0 6px">Titik yang ditandai (' + marks.length + '):</p>';
    marks.forEach((m, i) => {
      html += '<div style="font-size:12px;line-height:1.7" class="mut">Titik ' + (i + 1) + ': ' + m.x + '% dari kiri, ' + m.y + '% dari atas, warna ' + T.esc(m.warna) + '</div>';
    });
    T.show(markBox, html);
    markBox.appendChild(T.row(
      T.btn('📋 Salin daftar', () => {
        const txt = marks.map((m, i) => 'Titik ' + (i + 1) + ': ' + m.x + '% dari kiri, ' + m.y + '% dari atas, warna ' + m.warna).join('\n');
        T.copy(txt);
      }),
      T.btn('🗑 Hapus semua tanda', () => {
        marks = [];
        area.querySelectorAll('.dp-mark').forEach((n) => n.remove());
        paintMarks();
      })
    ));
  };

  COLORS.forEach(([nama, hex], i) => {
    const b = T.el('<button type="button" style="width:38px;height:38px;border-radius:10px;border:1px solid rgba(255,255,255,.25);background:' + hex + ';cursor:pointer" aria-label="Warna ' + T.esc(nama) + '" title="' + T.esc(nama) + '"></button>');
    b.addEventListener('click', () => { idx = i; paintArea(); });
    colorRow.appendChild(b);
  });
  const gridBtn = T.el('<button type="button" style="height:38px;padding:0 12px;border-radius:10px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.06);color:#e5e5e5;font-size:12px;cursor:pointer">Kotak-kotak</button>');
  gridBtn.addEventListener('click', () => { idx = COLORS.length; paintArea(); });
  colorRow.appendChild(gridBtn);

  const modeBtn = T.btn('✏️ Mode tandai titik', () => {
    mode = mode === 'warna' ? 'tandai' : 'warna';
    modeBtn.textContent = mode === 'warna' ? '✏️ Mode tandai titik' : '🎨 Mode ganti warna';
    paintArea();
  });
  const fsBtn = T.btn('⛶ Layar penuh', () => {
    if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); return; }
    if (area.requestFullscreen) area.requestFullscreen().catch(() => T.toast('Layar penuh tidak bisa dibuka'));
    else T.toast('Browser ini tidak mendukung layar penuh');
  });
  document.addEventListener('fullscreenchange', () => {
    fsBtn.textContent = document.fullscreenElement ? '⛶ Keluar layar penuh' : '⛶ Layar penuh';
  });

  area.addEventListener('click', (e) => {
    const r = area.getBoundingClientRect();
    if (mode === 'warna') {
      idx = (idx + 1) % (COLORS.length + 1);
      paintArea();
      return;
    }
    const x = Math.round((e.clientX - r.left) / r.width * 100);
    const y = Math.round((e.clientY - r.top) / r.height * 100);
    const warna = idx < COLORS.length ? COLORS[idx][0] : 'Kotak-kotak';
    marks.push({ x, y, warna });
    const m = T.el('<div class="dp-mark" style="position:absolute;left:' + x + '%;top:' + y + '%;width:18px;height:18px;margin:-9px 0 0 -9px;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 2px #000;pointer-events:none"></div>');
    area.appendChild(m);
    paintMarks();
  });

  T.onLeave(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  });

  root.appendChild(info);
  root.appendChild(area);
  root.appendChild(colorRow);
  root.appendChild(T.row(modeBtn, fsBtn));
  root.appendChild(markBox);
  root.appendChild(T.el('<p class="mut" style="font-size:12px">Tips: periksa di ruangan agak gelap. Piksel mati terlihat sebagai titik hitam di warna terang. Piksel macet terlihat sebagai titik merah, hijau, atau biru yang tidak berubah. Diproses di browser.</p>'));
  paintArea();
}
