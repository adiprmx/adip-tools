/* ============================================================
   fx.js — lapisan delight interaktif (di-load SETELAH app.js).
   Murni enhancement: tidak mengubah markup/logika app, hanya
   menempel via event delegation di document. Semua efek
   nonaktif bila prefers-reduced-motion aktif.
   Wiring (oleh parent): <script type="module" src="js/fx.js?v=...">
   diletakkan setelah script app.js di index.html.
   ============================================================ */

const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE_POINTER = matchMedia('(pointer: fine)').matches;

/* ---------- 1. RIPPLE: gelombang klik di tombol & kartu ---------- */
function initRipple() {
  const SEL = '.btn,.icobtn,.tcard,.cattile,.hcard,.allbtn,.contd,.schip,.back,.tab';
  const prepped = new WeakSet(); // sekali per elemen, tanpa bocor
  document.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const t = e.target;
    if (!t || !t.closest) return;
    const el = t.closest(SEL);
    if (!el || el.disabled) return;
    if (!prepped.has(el)) {
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.style.overflow = 'hidden';
      prepped.add(el);
    }
    const r = el.getBoundingClientRect();
    const d = Math.max(r.width, r.height) * 2.2;
    const s = document.createElement('span');
    s.style.cssText =
      `position:absolute;left:${e.clientX - r.left - d / 2}px;` +
      `top:${e.clientY - r.top - d / 2}px;width:${d}px;height:${d}px;` +
      `border-radius:50%;background:rgba(255,255,255,.22);` +
      `pointer-events:none;transform:scale(0);`;
    el.appendChild(s);
    // hanya transform + opacity → murah, tidak memicu layout
    const anim = s.animate(
      [{ transform: 'scale(0)', opacity: 0.4 }, { transform: 'scale(1)', opacity: 0 }],
      { duration: 550, easing: 'cubic-bezier(.22,1,.36,1)' }
    );
    anim.onfinish = () => s.remove();
  }, { passive: true });
}

/* ---------- 2. TILT 3D: kartu miring mengikuti pointer ---------- */
function initTilt() {
  if (!FINE_POINTER) return; // mati di touch
  const SEL = '.tcard,.hcard';
  const MAX = 5; // derajat maks — sangat halus
  let cur = null, raf = 0, px = 0, py = 0;

  // CSS entrance (.tgrid > .tcard) memakai animation fill "both" yang
  // menimpa inline transform selamanya → bebaskan setelah selesai.
  document.addEventListener('animationend', (e) => {
    const t = e.target;
    if (e.animationName === 'rise-in' && t && t.closest && t.closest(SEL)) {
      t.style.animation = 'none';
    }
  });

  const apply = () => {
    raf = 0;
    if (!cur || !document.contains(cur)) { cur = null; return; }
    const r = cur.getBoundingClientRect();
    const nx = (px - r.left) / r.width - 0.5;
    const ny = (py - r.top) / r.height - 0.5;
    // sertakan translateY(-3px) agar hover-lift CSS tetap terasa
    cur.style.transform =
      `translateY(-3px) perspective(700px) ` +
      `rotateX(${(-ny * MAX * 2).toFixed(2)}deg) ` +
      `rotateY(${(nx * MAX * 2).toFixed(2)}deg)`;
  };
  const reset = (el) => {
    // kembali dengan pegas, lalu bersihkan inline style
    el.style.transition = 'transform .5s cubic-bezier(.34,1.45,.64,1)';
    el.style.transform = '';
    el.style.willChange = '';
    setTimeout(() => { if (document.contains(el)) el.style.transition = ''; }, 520);
  };

  document.addEventListener('pointerover', (e) => {
    const t = e.target;
    if (!t || !t.closest) return;
    const el = t.closest(SEL);
    if (el === cur) return;
    if (cur) reset(cur);
    cur = el;
    if (cur) {
      cur.style.transition = 'transform .12s ease-out';
      cur.style.willChange = 'transform';
    }
  });
  document.addEventListener('pointermove', (e) => {
    if (!cur) return;
    px = e.clientX; py = e.clientY;
    if (!raf) raf = requestAnimationFrame(apply); // throttle rAF
  }, { passive: true });
  document.addEventListener('pointerout', (e) => {
    if (!cur) return;
    if (cur.contains(e.relatedTarget)) return; // masih di dalam kartu
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    reset(cur);
    cur = null;
  });
}

/* ---------- 3. CONFETTI MINI: ledakan kecil saat favorit + ---------- */
function initConfetti() {
  const COLORS = ['#ff6f61', '#ffffff', '#ffd166', '#7dd3fc'];
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!t || !t.closest) return;
    const b = t.closest('.fav');
    if (!b) return;
    // handler favorit app.js jalan di level elemen (lebih dulu) → baca status akhir
    requestAnimationFrame(() => {
      if (!b.classList.contains('on')) return; // favorit justru dihapus
      const r = b.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      for (let i = 0; i < 8; i++) {
        const p = document.createElement('span');
        const sz = 4 + Math.random() * 4;
        p.style.cssText =
          `position:fixed;left:${cx}px;top:${cy}px;` +
          `width:${sz.toFixed(1)}px;height:${(sz * (Math.random() > 0.5 ? 1 : 0.45)).toFixed(1)}px;` +
          `background:${COLORS[i % COLORS.length]};` +
          `border-radius:${Math.random() > 0.5 ? '50%' : '2px'};` +
          `pointer-events:none;z-index:9999;`;
        document.body.appendChild(p);
        const ang = (Math.PI * 2 * i) / 8 + Math.random() * 0.5;
        const dist = 26 + Math.random() * 30;
        const dx = Math.cos(ang) * dist;
        const dy = Math.sin(ang) * dist - 14; // sedikit ke atas dulu
        const anim = p.animate(
          [
            { transform: 'translate(-50%,-50%) rotate(0deg)', opacity: 1 },
            {
              transform:
                `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${(dy + 30).toFixed(1)}px)) ` +
                `rotate(${(Math.random() * 360) | 0}deg)`,
              opacity: 0
            }
          ],
          { duration: 620 + Math.random() * 260, easing: 'cubic-bezier(.22,1,.36,1)' }
        );
        anim.onfinish = () => p.remove();
      }
    });
  });
}

/* ---------- jalan ---------- */
if (!RM) {
  initRipple();
  initTilt();
  initConfetti();
}
// RM aktif → modul no-op total, tidak ada listener terpasang.
