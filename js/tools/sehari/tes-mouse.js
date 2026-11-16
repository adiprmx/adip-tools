import { h as T, kv } from '../../core.js?v=6.12.2';

export const meta = {"id": "tes-mouse", "name": "Tes Mouse", "cat": "sehari", "icon": "🖱️", "desc": "Cek klik kiri, kanan, tengah, roda scroll, dan gerak mouse.", "keywords": "mouse,klik,scroll,tombol,tes mouse", "since": "6.11.0"};

const BTN_STYLE = 'flex:1;text-align:center;padding:12px 4px;border:1px solid rgba(255,255,255,.14);border-radius:10px;font-size:13px;background:rgba(255,255,255,.04)';
const BTN_ON = 'background:rgba(255,255,255,.9);color:#111;border-color:rgba(255,255,255,.9)';

export function render(root) {
  const info = T.el('<p class="mut" style="font-size:13px">Gerakkan mouse dan klik di dalam kotak. Tombol yang ditekan menyala. Menu klik kanan dimatikan di dalam kotak supaya bisa dites.</p>');

  const area = T.el('<div style="border:1px solid rgba(255,255,255,.16);border-radius:12px;height:220px;position:relative;overflow:hidden;background:rgba(255,255,255,.03);touch-action:none"></div>');
  const dot = T.el('<div style="position:absolute;width:14px;height:14px;border-radius:50%;background:#fff;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none"></div>');
  area.appendChild(dot);

  const bKiri = T.el('<div style="' + BTN_STYLE + '">Kiri</div>');
  const bTengah = T.el('<div style="' + BTN_STYLE + '">Tengah</div>');
  const bKanan = T.el('<div style="' + BTN_STYLE + '">Kanan</div>');
  const btnRow = T.el('<div style="display:flex;gap:8px;margin:12px 0"></div>');
  btnRow.appendChild(bKiri); btnRow.appendChild(bTengah); btnRow.appendChild(bKanan);

  const statBox = T.out();
  const logBox = T.out();

  let lastX = null, lastY = null, lastT = 0, speed = 0;
  let wheelUp = 0, wheelDown = 0, lastClickT = 0, dblMs = null;
  let clicks = { kiri: 0, tengah: 0, kanan: 0 };
  const log = [];

  const paintStats = (px, py) => {
    T.show(statBox,
      kv('Posisi di kotak', (px == null ? 'Belum digerakkan' : Math.round(px) + ', ' + Math.round(py) + ' px')) +
      kv('Kecepatan gerak', Math.round(speed) + ' px/detik') +
      kv('Klik kiri / tengah / kanan', clicks.kiri + ' / ' + clicks.tengah + ' / ' + clicks.kanan) +
      kv('Roda scroll naik / turun', wheelUp + ' / ' + wheelDown) +
      kv('Klik ganda terakhir', dblMs == null ? 'Belum ada' : dblMs + ' ms'));
  };

  const pushLog = (txt) => {
    log.unshift(txt);
    if (log.length > 6) log.pop();
    T.show(logBox, '<p style="font-size:13px;margin:0 0 4px">Kejadian terakhir:</p>' +
      log.map((l) => '<div style="font-size:12px;line-height:1.6" class="mut">' + T.esc(l) + '</div>').join(''));
  };

  const setBtn = (el, on) => { el.style.cssText = BTN_STYLE + (on ? ';' + BTN_ON : ''); };

  const onMove = (e) => {
    const r = area.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    dot.style.left = x + 'px';
    dot.style.top = y + 'px';
    const now = performance.now();
    if (lastX != null && now > lastT) {
      const d = Math.hypot(x - lastX, y - lastY);
      const inst = d / ((now - lastT) / 1000);
      speed = Math.round(speed * 0.7 + inst * 0.3);
    }
    lastX = x; lastY = y; lastT = now;
    paintStats(x, y);
  };

  const onDown = (e) => {
    if (e.button === 1) e.preventDefault();
    const nama = e.button === 0 ? 'kiri' : e.button === 1 ? 'tengah' : e.button === 2 ? 'kanan' : 'tombol ' + e.button;
    if (e.button === 0) { setBtn(bKiri, true); clicks.kiri++; }
    if (e.button === 1) { setBtn(bTengah, true); clicks.tengah++; }
    if (e.button === 2) { setBtn(bKanan, true); clicks.kanan++; }
    const now = performance.now();
    if (e.button === 0 && lastClickT) {
      const gap = Math.round(now - lastClickT);
      if (gap < 600) dblMs = gap;
    }
    if (e.button === 0) lastClickT = now;
    pushLog('Klik ' + nama + ' ditekan');
    paintStats(lastX, lastY);
  };

  const onUp = (e) => {
    if (e.button === 0) setBtn(bKiri, false);
    if (e.button === 1) setBtn(bTengah, false);
    if (e.button === 2) setBtn(bKanan, false);
  };

  const onWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) wheelUp++; else if (e.deltaY > 0) wheelDown++;
    pushLog('Roda digeser ' + (e.deltaY < 0 ? 'ke atas' : 'ke bawah'));
    paintStats(lastX, lastY);
  };

  const onCtx = (e) => { e.preventDefault(); pushLog('Klik kanan ditekan (menu dicegah)'); };

  area.addEventListener('mousemove', onMove);
  area.addEventListener('mousedown', onDown);
  window.addEventListener('mouseup', onUp);
  area.addEventListener('wheel', onWheel, { passive: false });
  area.addEventListener('contextmenu', onCtx);

  const reset = () => {
    clicks = { kiri: 0, tengah: 0, kanan: 0 };
    wheelUp = 0; wheelDown = 0; dblMs = null; speed = 0;
    lastX = null; lastY = null; log.length = 0;
    setBtn(bKiri, false); setBtn(bTengah, false); setBtn(bKanan, false);
    dot.style.left = '50%'; dot.style.top = '50%';
    paintStats(null, null);
    T.hide(logBox);
  };

  T.onLeave(() => {
    area.removeEventListener('mousemove', onMove);
    area.removeEventListener('mousedown', onDown);
    window.removeEventListener('mouseup', onUp);
    area.removeEventListener('wheel', onWheel);
    area.removeEventListener('contextmenu', onCtx);
  });

  root.appendChild(info);
  root.appendChild(area);
  root.appendChild(btnRow);
  root.appendChild(statBox);
  root.appendChild(T.row(T.btn('↺ Ulangi', reset)));
  root.appendChild(logBox);
  root.appendChild(T.el('<p class="mut" style="font-size:12px">Di HP tanpa mouse, tool ini tidak banyak berguna. Sambungkan mouse bluetooth atau OTG untuk mengetes. Diproses di browser.</p>'));
  paintStats(null, null);
}
