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

/* ---------- 1. RIPPLE: gelombang klik di tombol & kartu ----------
   Perbaikan akar bug ripple x tab flex (v6.12.2, P2-A1; temuan P1-B4):
   overflow:hidden mengubah min-width otomatis flex item dari min-content
   menjadi 0, sehingga baris tab flex (core.js tabs(): flex:1,
   min-width:auto) REFLOW di tengah klik — tombol menyusut (terukur
   160px -> 64px di kalkulator-waktu), pointer mendarat di luar tombol,
   tab gagal berpindah / salah tab. Dulu overflow dipasang permanen
   sejak pointerdown pertama; sekarang lebar tombol DIKUNCI dulu
   (min-width inline = lebar saat ini) sebelum overflow diubah, dan
   keduanya dikembalikan ke nilai inline semula setelah animasi
   selesai DAN pointer sudah diangkat — jadi tidak ada reflow di
   tengah klik, dan tidak ada efek samping layout permanen.
   Visual ripple tidak berubah: span + animasi sama persis. */
function initRipple() {
  const SEL = '.btn,.icobtn,.tcard,.cattile,.hcard,.allbtn,.contd,.schip,.back,.tab';
  // el -> { n: ripple aktif, down: pointer yang masih menekan,
  //         prevOverflow, prevMinWidth: nilai inline sebelum dikunci }
  const locks = new WeakMap();
  const maybeUnlock = (el) => {
    const l = locks.get(el);
    if (!l || l.n > 0 || l.down > 0) return;
    el.style.overflow = l.prevOverflow;
    el.style.minWidth = l.prevMinWidth;
    locks.delete(el);
  };
  document.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const t = e.target;
    if (!t || !t.closest) return;
    const el = t.closest(SEL);
    if (!el || el.disabled) return;
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    let l = locks.get(el);
    if (!l) {
      // Kunci lebar SEBELUM mengubah overflow (offsetWidth dibaca dulu,
      // saat layout masih asli) — inilah yang mencegah reflow.
      l = {
        n: 0, down: 0,
        prevOverflow: el.style.overflow,
        prevMinWidth: el.style.minWidth
      };
      el.style.minWidth = el.offsetWidth + 'px';
      el.style.overflow = 'hidden';
      locks.set(el, l);
    }
    l.n++;
    l.down++;
    // Satu "tekanan" selesai tepat sekali: pointerup / pointercancel /
    // pengaman timeout 5 dtk (bila pointerup hilang, mis. pointer
    // dilepas di luar jendela). Unlock via rAF — event click sudah
    // ter-dispatch sebelum rAF, jadi reflow kembalian tidak bisa
    // mengganggu klik yang sedang berjalan.
    const press = { settled: false };
    // pointerId tekanan ini: tiap tekanan hanya diselesaikan oleh
    // pointer-nya sendiri (P2-R1-F1 — dulu satu pointerup dari pointer
    // mana pun me-settle SEMUA press yang tertunda, melepas kunci
    // lebar saat jari ke-2 masih menekan). Listener TIDAK memakai
    // { once: true } karena event pointer lain akan menghabiskan
    // listener sekali-pakai itu sebelum pointer pemiliknya terangkat;
    // sebagai gantinya listener dilepas manual di settle().
    const pid = e.pointerId;
    function onUp(ev) { if (ev.pointerId === pid) settle(); }
    function onCancel(ev) { if (ev.pointerId === pid) settle(); }
    function settle() {
      if (press.settled) return;
      press.settled = true;
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onCancel);
      l.down--;
      requestAnimationFrame(() => maybeUnlock(el));
    }
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onCancel);
    setTimeout(settle, 5000);
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
    const animDone = () => { s.remove(); l.n--; maybeUnlock(el); };
    anim.onfinish = animDone;
    anim.oncancel = animDone;
  }, { passive: true });
}

/* ---------- 1b. BEBASKAN ENTRANCE: fill "both" menimpa :hover/:active
   selamanya → lepas animasi kartu/ubin setelah selesai.
   Jalan di semua device (bukan cuma pointer halus).
   (Hanya kartu/ubin: base style mereka = state akhir, aman dibebaskan.
    .rise/.w punya opacity:0 bawaan → JANGAN dibebaskan.) ---------- */
function initFreeEntrance() {
  const SEL = '.tcard,.hcard,.cattile';
  const ENTRANCE = new Set(['fx-card', 'fx-hcard', 'fx-tile', 'rise-in']);
  document.addEventListener('animationend', (e) => {
    const t = e.target;
    if (ENTRANCE.has(e.animationName) && t && t.closest && t.closest(SEL)) {
      t.style.animation = 'none';
    }
  });
}

/* ---------- 2. TILT 3D: kartu miring mengikuti pointer ---------- */
function initTilt() {
  if (!FINE_POINTER) return; // mati di touch
  const SEL = '.tcard,.hcard';
  const MAX = 5; // derajat maks — sangat halus
  let cur = null, raf = 0, px = 0, py = 0;

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
  initFreeEntrance();
  initRipple();
  initTilt();
  initConfetti();
}
// RM aktif → modul no-op total, tidak ada listener terpasang.
