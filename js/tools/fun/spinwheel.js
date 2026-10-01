import { h as T, utils, esc } from '../../core.js?v=6.8.0';

export const meta = {"id": "spinwheel", "name": "Roda Putar", "cat": "fun", "icon": "🎡", "desc": "Spin wheel visual.", "keywords": "roda,putar,spin,acak,undian"};
export function render(root) {

    const taOpsi = T.ta(5, 'Satu nama per baris\nmisal:\nAndi\nBudi\nCitra\nDewi');
    taOpsi.value = 'Andi\nBudi\nCitra\nDewi\nEka';
    const hapus = document.createElement('input');
    hapus.type = 'checkbox'; hapus.checked = true;
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;max-width:320px;display:block;margin:8px auto';
    const box = T.out();
    const TAU = Math.PI * 2;
    let rot = 0, raf = null, spinning = false;
    T.onLeave(() => { if (raf) cancelAnimationFrame(raf); });
    const getOpts = () => taOpsi.value.split('\n').map((s) => s.trim()).filter(Boolean);
    function draw() {
      const opts = getOpts();
      const dpr = window.devicePixelRatio || 1, S = 320;
      canvas.width = S * dpr; canvas.height = S * dpr;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, S, S);
      const cx = S / 2, cy = S / 2, Rr = S / 2 - 6;
      const n = Math.max(opts.length, 1), seg = TAU / n;
      for (let i = 0; i < n; i++) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, Rr, rot + i * seg, rot + (i + 1) * seg);
        ctx.closePath();
        ctx.fillStyle = 'hsl(' + Math.round((i * 360) / n) + ',65%,52%)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.25)';
        ctx.stroke();
        if (opts[i]) {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(rot + (i + 0.5) * seg);
          ctx.textAlign = 'right';
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 13px system-ui,sans-serif';
          const label = opts[i].length > 14 ? opts[i].slice(0, 13) + '…' : opts[i];
          ctx.fillText(label, Rr - 12, 5);
          ctx.restore();
        }
      }
      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, TAU);
      ctx.fillStyle = '#111'; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px system-ui,sans-serif';
      ctx.textAlign = 'center'; ctx.fillText('SPIN', cx, cy + 4);
      // penunjuk (segitiga di atas)
      ctx.beginPath();
      ctx.moveTo(cx - 10, 2); ctx.lineTo(cx + 10, 2); ctx.lineTo(cx, 24);
      ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();
    }
    const putar = () => {
      const opts = getOpts();
      if (opts.length < 2) { T.toast('Isi minimal 2 opsi'); return; }
      if (spinning) return;
      spinning = true;
      const start = rot, dur = 4200 + Math.random() * 1800;
      const extra = (5 + Math.random() * 4) * TAU + Math.random() * TAU;
      const t0 = performance.now();
      const frame = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        rot = start + extra * e;
        draw();
        if (p < 1) raf = requestAnimationFrame(frame);
        else {
          spinning = false;
          const seg = TAU / opts.length;
          const pos = (((-Math.PI / 2 - rot) % TAU) + TAU) % TAU;
          const idx = Math.floor(pos / seg) % opts.length;
          const menang = opts[idx];
          T.show(box, '<div class="center"><div class="dim">Pemenang</div><div class="big">🎉 ' + esc(menang) + '</div></div>');
          T.beep(660, 0.15); T.beep(880, 0.15, 'sine', 0.15); T.beep(1100, 0.3, 'sine', 0.3);
          if (hapus.checked) {
            const sisa = getOpts().filter((_, i) => i !== idx);
            taOpsi.value = sisa.join('\n');
            T.toast(menang + ' dihapus dari daftar');
            draw();
          }
        }
      };
      raf = requestAnimationFrame(frame);
    };
    const lbl = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px;margin:4px 0 10px"></label>');
    lbl.appendChild(hapus);
    lbl.appendChild(document.createTextNode('Hapus pemenang dari daftar'));
    root.appendChild(T.field('Daftar opsi (satu per baris)', taOpsi));
    root.appendChild(lbl);
    root.appendChild(canvas);
    root.appendChild(T.btn('🎡 PUTAR', putar, true));
    root.appendChild(box);
    draw();
    taOpsi.addEventListener('input', draw);
  
}
