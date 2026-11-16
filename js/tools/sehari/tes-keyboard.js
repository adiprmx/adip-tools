import { h as T } from '../../core.js?v=6.12.2';

export const meta = {"id": "tes-keyboard", "name": "Tes Keyboard", "cat": "sehari", "icon": "⌨️", "desc": "Tekan tiap tombol dan lihat mana yang menyala, mana yang belum dites.", "keywords": "keyboard,tombol,tes keyboard,rusak", "since": "6.11.0"};

// Peta tombol berdasarkan e.code. Label singkat agar muat di HP.
const ROWS = [
  [['Escape', 'Esc'], ['Digit1', '1'], ['Digit2', '2'], ['Digit3', '3'], ['Digit4', '4'], ['Digit5', '5'], ['Digit6', '6'], ['Digit7', '7'], ['Digit8', '8'], ['Digit9', '9'], ['Digit0', '0'], ['Minus', '-'], ['Equal', '='], ['Backspace', '⌫']],
  [['Tab', 'Tab'], ['KeyQ', 'Q'], ['KeyW', 'W'], ['KeyE', 'E'], ['KeyR', 'R'], ['KeyT', 'T'], ['KeyY', 'Y'], ['KeyU', 'U'], ['KeyI', 'I'], ['KeyO', 'O'], ['KeyP', 'P'], ['BracketLeft', '['], ['BracketRight', ']'], ['Backslash', '\\']],
  [['CapsLock', 'Caps'], ['KeyA', 'A'], ['KeyS', 'S'], ['KeyD', 'D'], ['KeyF', 'F'], ['KeyG', 'G'], ['KeyH', 'H'], ['KeyJ', 'J'], ['KeyK', 'K'], ['KeyL', 'L'], ['Semicolon', ';'], ['Quote', "'"], ['Enter', 'Enter']],
  [['ShiftLeft', 'Shift'], ['KeyZ', 'Z'], ['KeyX', 'X'], ['KeyC', 'C'], ['KeyV', 'V'], ['KeyB', 'B'], ['KeyN', 'N'], ['KeyM', 'M'], ['Comma', ','], ['Period', '.'], ['Slash', '/'], ['ShiftRight', 'Shift']],
  [['ControlLeft', 'Ctrl'], ['MetaLeft', 'Win'], ['AltLeft', 'Alt'], ['Space', 'Spasi'], ['AltRight', 'Alt'], ['MetaRight', 'Win'], ['ContextMenu', 'Menu'], ['ControlRight', 'Ctrl']],
  [['Insert', 'Ins'], ['Delete', 'Del'], ['Home', 'Home'], ['End', 'End'], ['PageUp', 'PgUp'], ['PageDown', 'PgDn'], ['ArrowUp', '↑'], ['ArrowLeft', '←'], ['ArrowDown', '↓'], ['ArrowRight', '→']],
];

const KEY_STYLE = 'min-width:30px;flex:1 1 auto;padding:9px 2px;text-align:center;border:1px solid rgba(255,255,255,.14);border-radius:8px;font-size:12px;background:rgba(255,255,255,.04);color:#e5e5e5;user-select:none';
const KEY_TESTED = 'background:rgba(255,255,255,.85);color:#111;border-color:rgba(255,255,255,.85)';
const KEY_HELD = 'background:#fff;color:#111;border-color:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.35)';

export function render(root) {
  const tested = new Set();
  const keyEls = {};
  let total = 0;
  ROWS.forEach((r) => { total += r.length; });

  const info = T.el('<p class="mut" style="font-size:13px">Tekan tombol di keyboard. Tombol yang ditekan menyala putih. Tombol yang tetap gelap setelah ditekan berkali-kali kemungkinan rusak.</p>');
  const prog = T.el('<div class="big center" style="font-variant-numeric:tabular-nums">0 / ' + total + ' tombol dites</div>');
  const lastBox = T.out();
  const mapWrap = T.el('<div></div>');
  const untestedBox = T.out();

  ROWS.forEach((r) => {
    const rowEl = T.el('<div style="display:flex;gap:4px;margin-bottom:4px"></div>');
    r.forEach(([code, label]) => {
      const k = T.el('<div style="' + KEY_STYLE + (code === 'Space' ? ';flex:4 1 auto' : '') + '">' + T.esc(label) + '</div>');
      keyEls[code] = k;
      rowEl.appendChild(k);
    });
    mapWrap.appendChild(rowEl);
  });

  const paintProg = () => {
    prog.textContent = tested.size + ' / ' + total + ' tombol dites';
  };

  const onDown = (e) => {
    const code = e.code;
    if (!code) return;
    // Cegah halaman bergeser saat mengetes tombol navigasi.
    if ((code === 'Space' || code.indexOf('Arrow') === 0) && e.target === document.body) e.preventDefault();
    const el = keyEls[code];
    if (el) {
      el.style.cssText = KEY_STYLE + ';' + KEY_HELD + (code === 'Space' ? ';flex:4 1 auto' : '');
      if (!e.repeat && !tested.has(code)) {
        tested.add(code);
        paintProg();
      }
    }
    const nama = e.key && e.key.length === 1 ? e.key.toUpperCase() : (e.key || code);
    T.show(lastBox, '<div class="kv"><span class="k">Terakhir ditekan</span><span class="v">' + T.esc(nama) + '</span></div>' +
      '<div class="kv"><span class="k">Kode tombol</span><span class="v">' + T.esc(code) + '</span></div>');
  };

  const onUp = (e) => {
    const el = keyEls[e.code];
    if (!el) return;
    const base = KEY_STYLE + (e.code === 'Space' ? ';flex:4 1 auto' : '');
    el.style.cssText = base + (tested.has(e.code) ? ';' + KEY_TESTED : '');
  };

  const lihatBelum = () => {
    const belum = [];
    ROWS.forEach((r) => r.forEach(([code, label]) => { if (!tested.has(code)) belum.push(label); }));
    if (!belum.length) {
      T.show(untestedBox, '<div class="big ok">Semua tombol sudah ditekan 🎉</div><p class="mut" style="font-size:13px">Tidak ada tombol yang terlewat di peta ini.</p>');
      return;
    }
    T.show(untestedBox, '<p style="font-size:13px;margin:0 0 6px">Tombol yang belum ditekan (' + belum.length + '):</p>' +
      '<p style="font-size:13px;line-height:1.7">' + belum.map((b) => T.esc(b)).join(' · ') + '</p>' +
      '<p class="mut" style="font-size:12px">Coba tekan tombol-tombol itu. Kalau tetap tidak menyala, tombolnya mungkin bermasalah.</p>');
  };

  const reset = () => {
    tested.clear();
    Object.keys(keyEls).forEach((code) => {
      keyEls[code].style.cssText = KEY_STYLE + (code === 'Space' ? ';flex:4 1 auto' : '');
    });
    paintProg();
    T.hide(lastBox);
    T.hide(untestedBox);
  };

  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);
  T.onLeave(() => {
    window.removeEventListener('keydown', onDown);
    window.removeEventListener('keyup', onUp);
  });

  root.appendChild(info);
  root.appendChild(prog);
  root.appendChild(lastBox);
  root.appendChild(mapWrap);
  root.appendChild(T.row(T.btn('Tombol yang belum dites', lihatBelum, true), T.btn('↺ Ulangi', reset)));
  root.appendChild(untestedBox);
  root.appendChild(T.el('<p class="mut" style="font-size:12px">Butuh keyboard fisik. Di HP, sambungkan keyboard bluetooth atau OTG. Beberapa tombol dipakai browser sendiri (misalnya F5) sehingga tidak bisa ditangkap di sini. Diproses di browser.</p>'));
}
