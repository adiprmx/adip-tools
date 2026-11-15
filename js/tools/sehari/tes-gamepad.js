import { h as T, kv } from '../../core.js?v=6.12.0';

export const meta = {"id": "tes-gamepad", "name": "Tes Gamepad", "cat": "sehari", "icon": "🎮", "desc": "Cek stik atau gamepad: tombol, analog, dan getaran.", "keywords": "gamepad,stik,joystick,controller,tombol", "since": "6.11.0"};

// Nama tombol standar Gamepad API (layout Xbox/PlayStation umum).
const BTN_NAMES = ['A / Silang', 'B / Lingkaran', 'X / Kotak', 'Y / Segitiga', 'LB / L1', 'RB / R1', 'LT / L2', 'RT / R2', 'Select', 'Start', 'L3', 'R3', 'Atas', 'Bawah', 'Kiri', 'Kanan', 'Home'];
const AXIS_NAMES = ['Analog kiri X', 'Analog kiri Y', 'Analog kanan X', 'Analog kanan Y'];

const CELL = 'flex:1 1 30%;min-width:90px;text-align:center;padding:10px 4px;border:1px solid rgba(255,255,255,.14);border-radius:10px;font-size:12px;background:rgba(255,255,255,.04)';
const CELL_ON = 'background:rgba(255,255,255,.9);color:#111;border-color:rgba(255,255,255,.9)';

export function render(root) {
  const info = T.el('<p class="mut" style="font-size:13px">Sambungkan stik atau gamepad, lalu tekan tombol apa pun di stik. Browser baru mendeteksi stik setelah ada tombol yang ditekan.</p>');
  const statusBox = T.out();
  const btnGrid = T.el('<div style="display:flex;flex-wrap:wrap;gap:6px;margin:10px 0"></div>');
  const axisBox = T.out();
  const vibBox = T.out();

  const btnEls = [];
  BTN_NAMES.forEach((n) => {
    const c = T.el('<div style="' + CELL + '">' + T.esc(n) + '</div>');
    btnEls.push(c);
    btnGrid.appendChild(c);
  });

  let raf = null;
  let currentPad = null;
  let lastShown = '';

  const paintAxes = (axes) => {
    let html = '<p style="font-size:13px;margin:0 0 6px">Analog:</p>';
    AXIS_NAMES.forEach((n, i) => {
      const v = axes[i] == null ? 0 : axes[i];
      const pct = Math.round(((v + 1) / 2) * 100);
      html += '<div style="font-size:12px;margin-bottom:8px"><div style="display:flex;justify-content:space-between"><span>' + T.esc(n) + '</span><span class="mut">' + v.toFixed(2) + '</span></div>' +
        '<div style="height:6px;background:rgba(255,255,255,.08);border-radius:3px;margin-top:3px"><div style="height:100%;width:' + pct + '%;background:#fff;border-radius:3px"></div></div></div>';
    });
    T.show(axisBox, html);
  };

  const loop = () => {
    raf = requestAnimationFrame(loop);
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = pads ? Array.prototype.find.call(pads, (p) => p && p.connected) : null;
    if (!pad) {
      if (currentPad) {
        currentPad = null;
        lastShown = '';
        T.show(statusBox, '<p class="mut" style="font-size:13px">Stik terputus. Sambungkan lagi dan tekan tombol apa pun.</p>');
        T.hide(axisBox);
        T.hide(vibBox);
        btnEls.forEach((c) => { c.style.cssText = CELL; });
      }
      return;
    }
    currentPad = pad;
    const key = pad.id + '|' + pad.index;
    if (key !== lastShown) {
      lastShown = key;
      T.show(statusBox, kv('Stik terdeteksi', T.esc(pad.id || 'Tanpa nama')) + kv('Jumlah tombol', pad.buttons.length) + kv('Jumlah analog', pad.axes.length));
      if (pad.vibrationActuator && typeof pad.vibrationActuator.playEffect === 'function') {
        T.show(vibBox, '');
        vibBox.appendChild(T.btn('📳 Tes getaran', () => {
          pad.vibrationActuator.playEffect('dual-rumble', { duration: 600, strongMagnitude: 0.8, weakMagnitude: 0.8 })
            .then(() => T.toast('Getaran dikirim'))
            .catch(() => T.toast('Getaran tidak didukung stik ini'));
        }, true));
      } else {
        T.show(vibBox, '<p class="mut" style="font-size:12px">Stik ini tidak menyediakan tes getaran lewat browser.</p>');
      }
    }
    btnEls.forEach((c, i) => {
      const b = pad.buttons[i];
      const on = b && b.pressed;
      const val = b && b.value > 0 && b.value < 1 ? ' ' + Math.round(b.value * 100) + '%' : '';
      c.style.cssText = CELL + (on ? ';' + CELL_ON : '');
      c.textContent = BTN_NAMES[i] + val;
    });
    paintAxes(pad.axes);
  };

  const onConnect = () => T.toast('Stik tersambung');
  const onDisconnect = () => T.toast('Stik terputus');

  if (!('getGamepads' in navigator)) {
    T.show(statusBox, '<div class="big warn">Browser ini tidak bisa membaca gamepad</div><p class="mut" style="font-size:13px">Gamepad API tidak tersedia di browser ini. Coba Chrome atau Edge terbaru di laptop atau HP Android.</p>');
  } else {
    T.show(statusBox, '<p class="mut" style="font-size:13px">Belum ada stik terdeteksi. Sambungkan stik, lalu tekan tombol apa pun di stik.</p>');
    window.addEventListener('gamepadconnected', onConnect);
    window.addEventListener('gamepaddisconnected', onDisconnect);
    loop();
  }

  T.onLeave(() => {
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener('gamepadconnected', onConnect);
    window.removeEventListener('gamepaddisconnected', onDisconnect);
  });

  root.appendChild(info);
  root.appendChild(statusBox);
  root.appendChild(btnGrid);
  root.appendChild(axisBox);
  root.appendChild(vibBox);
  root.appendChild(T.el('<p class="mut" style="font-size:12px">Nama tombol mengikuti layout standar. Di stik lain, posisi tombol bisa berbeda. Diproses di browser.</p>'));
}
