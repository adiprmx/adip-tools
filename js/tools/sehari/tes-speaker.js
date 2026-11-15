import { h as T } from '../../core.js?v=6.12.0';

export const meta = {"id": "tes-speaker", "name": "Tes Speaker", "cat": "sehari", "icon": "🔊", "desc": "Bunyi kiri dan kanan terpisah, plus nada berbagai tinggi suara.", "keywords": "speaker,suara,kiri kanan,earphone,nada,frekuensi", "since": "6.11.0"};

const FREQS = [100, 440, 1000, 5000, 10000];

export function render(root) {
  const info = T.el('<p class="mut" style="font-size:13px">Pastikan volume perangkat menyala dan tidak senyap. Kalau bunyi kiri terdengar di kanan, kabel atau speaker mungkin tertukar.</p>');
  const statusBox = T.out();

  const vol = T.input('range', '');
  vol.min = '0'; vol.max = '100'; vol.value = '70';
  vol.style.cssText = 'width:100%';
  const volLabel = T.el('<div class="mut" style="font-size:12px">Volume: 70%</div>');
  vol.addEventListener('input', () => { volLabel.textContent = 'Volume: ' + vol.value + '%'; });

  let osc = null, gainNode = null, stopTimer = null;

  const stopSound = () => {
    if (stopTimer) clearTimeout(stopTimer);
    stopTimer = null;
    if (osc) { try { osc.stop(); } catch (e) {} osc = null; }
    if (gainNode) { try { gainNode.disconnect(); } catch (e) {} gainNode = null; }
  };

  const play = (freq, pan, dur, label, sweepTo) => {
    let ctx;
    try {
      ctx = T.actx();
    } catch (e) {
      T.show(statusBox, '<div class="big warn">Browser ini tidak bisa memutar suara tes</div><p class="mut" style="font-size:13px">Audio web tidak tersedia di browser ini.</p>');
      return;
    }
    stopSound();
    const t = ctx.currentTime;
    osc = ctx.createOscillator();
    gainNode = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (sweepTo) osc.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    const volLevel = (Number(vol.value) / 100) * 0.4;
    gainNode.gain.setValueAtTime(0.0001, t);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(volLevel, 0.0001), t + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let out = gainNode;
    if (pan !== 0 && typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;
      gainNode.connect(panner);
      out = panner;
    }
    out.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
    T.show(statusBox, '<p style="font-size:13px">Memutar: ' + T.esc(label) + '</p>');
    stopTimer = setTimeout(() => {
      stopSound();
      T.show(statusBox, '<p class="mut" style="font-size:13px">Selesai. Terdengar jelas?</p>');
    }, dur * 1000 + 100);
  };

  const canPan = (() => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      const c = new AC();
      const ok = typeof c.createStereoPanner === 'function';
      c.close().catch(() => {});
      return ok;
    } catch (e) { return false; }
  })();

  const sideRow = T.row(
    T.btn('◀ Bunyi kiri', () => play(440, -1, 1.5, 'nada kiri saja'), true),
    T.btn('Bunyi tengah', () => play(440, 0, 1.5, 'nada tengah (dua sisi)')),
    T.btn('Bunyi kanan ▶', () => play(440, 1, 1.5, 'nada kanan saja'), true)
  );

  const freqRow = T.el('<div style="display:flex;flex-wrap:wrap;gap:6px;margin:10px 0"></div>');
  FREQS.forEach((f) => {
    const b = T.btn((f >= 1000 ? (f / 1000) + ' kHz' : f + ' Hz'), () => play(f, 0, 1.5, 'nada ' + (f >= 1000 ? (f / 1000) + ' kHz' : f + ' Hz')));
    freqRow.appendChild(b);
  });

  T.onLeave(stopSound);

  root.appendChild(info);
  if (!canPan) {
    root.appendChild(T.el('<p class="mut" style="font-size:12px">Browser ini tidak mendukung pemisahan bunyi kiri dan kanan, jadi semua bunyi keluar di dua sisi.</p>'));
  }
  root.appendChild(T.field('Volume bunyi tes', vol));
  root.appendChild(volLabel);
  root.appendChild(T.el('<p style="font-size:13px;margin:14px 0 6px">Cek kiri dan kanan:</p>'));
  root.appendChild(sideRow);
  root.appendChild(T.el('<p style="font-size:13px;margin:14px 0 6px">Cek nada dari rendah sampai tinggi:</p>'));
  root.appendChild(freqRow);
  root.appendChild(T.row(
    T.btn('〰️ Sapuan nada (rendah ke tinggi)', () => play(100, 0, 3, 'sapuan nada 100 Hz ke 10.000 Hz', 10000)),
    T.btn('⏹ Berhenti', () => { stopSound(); T.show(statusBox, '<p class="mut" style="font-size:13px">Dihentikan.</p>'); })
  ));
  root.appendChild(statusBox);
  root.appendChild(T.el('<p class="mut" style="font-size:12px">Nada dibuat langsung di browser, bukan file rekaman. Diproses di browser.</p>'));
}
