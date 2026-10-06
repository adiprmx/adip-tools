import { h as T, errBox, onLeave } from '../../core.js?v=6.9.5';

export const meta = {"id": "tuner-gitar", "name": "Tuner Gitar", "cat": "musik", "icon": "🎸", "desc": "Stem gitar pakai mikrofon, deteksi nada otomatis.", "keywords": "tuner,gitar,stem,nada,mic,mikrofon"};
export function render(root) {

    const STRINGS = [
      { n: 'E', oct: 2, f: 82.41 },
      { n: 'A', oct: 2, f: 110.00 },
      { n: 'D', oct: 3, f: 146.83 },
      { n: 'G', oct: 3, f: 196.00 },
      { n: 'B', oct: 3, f: 246.94 },
      { n: 'e', oct: 4, f: 329.63 },
    ];
    const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    // Autocorrelation (pendekatan pitch detection standar).
    const autoCorrelate = (buf, sampleRate) => {
      const SIZE = buf.length;
      let rms = 0;
      for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
      rms = Math.sqrt(rms / SIZE);
      if (rms < 0.012) return -1;
      let r1 = 0, r2 = SIZE - 1;
      for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i] - buf[0]) < 0.2) { r1 = i; break; }
      for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i] - buf[SIZE - 1]) < 0.2) { r2 = SIZE - i; break; }
      const n = r2 - r1;
      if (n < 32) return -1;
      const c = new Array(n).fill(0);
      for (let i = 0; i < n; i++) for (let j = 0; j < n - i; j++) c[i] += buf[r1 + j] * buf[r1 + j + i];
      let d = 0;
      while (d + 1 < n && c[d] > c[d + 1]) d++;
      let maxval = -1, maxpos = -1;
      for (let i = d; i < n; i++) if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
      let T0 = maxpos;
      if (T0 > 0 && T0 < n - 1) {
        const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
        const a = (x1 + x3 - 2 * x2) / 2, b = (x3 - x1) / 2;
        if (a) T0 = T0 - b / (2 * a);
      }
      const f = sampleRate / T0;
      return (f > 40 && f < 1200) ? f : -1;
    };

    const noteBig = T.el('<div class="center" style="font-size:64px;font-weight:800;letter-spacing:2px;line-height:1.2">–</div>');
    const freqLbl = T.el('<div class="center" style="font-size:15px;color:#a1a1aa">0.0 Hz</div>');
    const statusLbl = T.el('<div class="center" style="font-size:14px;min-height:44px;color:#a1a1aa;line-height:1.5"></div>');
    const needleWrap = T.el('<div style="position:relative;height:10px;background:#27272a;border-radius:6px;margin:16px 4px 6px"></div>');
    const needle = T.el('<div style="position:absolute;top:-4px;width:3px;height:18px;background:#71717a;border-radius:2px;left:50%;transform:translateX(-50%);transition:left .12s"></div>');
    needleWrap.appendChild(needle);
    const needleScale = T.el('<div class="center" style="font-size:11px;color:#71717a">-50 cent&nbsp;&nbsp;·&nbsp;&nbsp;pas&nbsp;&nbsp;·&nbsp;&nbsp;+50 cent</div>');
    const targetLbl = T.el('<div class="center" style="font-size:13px;color:#a1a1aa"></div>');
    const box = T.out();
    const startBtn = T.btn('Mulai', null, true);

    let stream = null, analyser = null, timer = null, active = false, ctx = null;
    let buf = null;

    const stop = () => {
      active = false;
      if (timer) { clearInterval(timer); timer = null; }
      if (stream) { stream.getTracks().forEach((t) => { try { t.stop(); } catch (e) {} }); stream = null; }
      analyser = null;
      startBtn.disabled = false;
      startBtn.textContent = 'Mulai';
      noteBig.textContent = '–';
      freqLbl.textContent = '0.0 Hz';
      needle.style.left = '50%';
      needle.style.background = '#71717a';
    };
    onLeave(stop);

    const tick = () => {
      if (!active || !analyser) return;
      analyser.getFloatTimeDomainData(buf);
      const f = autoCorrelate(buf, ctx.sampleRate);
      if (f < 0) {
        statusLbl.textContent = 'Tidak ada suara terdeteksi — petik satu senar lebih keras / dekatkan mic.';
        noteBig.textContent = '–';
        freqLbl.textContent = '0.0 Hz';
        return;
      }
      const midi = Math.round(12 * Math.log2(f / 440)) + 69;
      const name = NAMES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);
      let best = STRINGS[0], bd = Infinity;
      STRINGS.forEach((s) => { const d = Math.abs(s.f - f); if (d < bd) { bd = d; best = s; } });
      const cents = Math.round(1200 * Math.log2(f / best.f));
      const ac = Math.abs(cents);
      noteBig.textContent = name;
      freqLbl.textContent = f.toFixed(1) + ' Hz';
      targetLbl.innerHTML = 'Senar terdekat: <b style="color:#fff">' + best.n + best.oct + '</b> (' + best.f.toFixed(2) + ' Hz)';
      const pos = 50 + Math.max(-50, Math.min(50, cents));
      needle.style.left = pos + '%';
      if (ac <= 5) {
        needle.style.background = '#22c55e';
        statusLbl.innerHTML = '<b style="color:#22c55e">PAS</b> — senar ' + best.n + ' sudah stem. ✅';
      } else if (ac <= 25) {
        needle.style.background = '#f59e0b';
        statusLbl.innerHTML = (cents < 0 ? '▼ Terlalu <b>rendah</b> ' : '▲ Terlalu <b>tinggi</b> ') + ac + ' cent — ' + (cents < 0 ? 'kencangkan' : 'kendurkan') + ' senar perlahan.';
      } else {
        needle.style.background = '#ef4444';
        statusLbl.innerHTML = (cents < 0 ? '▼ Terlalu <b>rendah</b> ' : '▲ Terlalu <b>tinggi</b> ') + ac + ' cent — ' + (cents < 0 ? 'kencangkan' : 'kendurkan') + ' senar perlahan.';
      }
    };

    startBtn.onclick = async () => {
      if (active) { stop(); T.show(box, ''); return; }
      const md = (typeof navigator !== 'undefined' && navigator.mediaDevices) ? navigator.mediaDevices : null;
      if (!md || typeof md.getUserMedia !== 'function') {
        T.show(box, errBox('Perangkat/browser ini tidak mendukung akses mikrofon (navigator.mediaDevices tidak tersedia). Buka halaman ini lewat HTTPS di browser HP atau laptop yang mendukung mic.'));
        return;
      }
      startBtn.disabled = true;
      try {
        stream = await md.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      } catch (e) {
        startBtn.disabled = false;
        const nm = (e && e.name) || '';
        let msg;
        if (nm === 'NotAllowedError' || nm === 'SecurityError') msg = 'Izin mikrofon DITOLAK. Ketuk "Mulai" lagi lalu pilih "Izinkan" saat browser meminta akses mikrofon — tanpa izin, tuner tidak bisa mendengar senar gitar.';
        else if (nm === 'NotFoundError' || nm === 'OverconstrainedError') msg = 'Tidak ditemukan mikrofon di perangkat ini. Pastikan mic terhubung, lalu coba lagi.';
        else if (nm === 'NotReadableError') msg = 'Mikrofon sedang dipakai aplikasi lain. Tutup aplikasi itu, lalu coba lagi.';
        else msg = 'Gagal mengakses mikrofon' + (e && e.message ? ': ' + e.message : '') + '. Coba lagi.';
        T.show(box, errBox(msg));
        return;
      }
      try {
        ctx = T.actx();
      } catch (e) {
        stream.getTracks().forEach((t) => { try { t.stop(); } catch (e2) {} });
        stream = null;
        startBtn.disabled = false;
        T.show(box, errBox('Audio tidak tersedia di perangkat ini (AudioContext gagal dibuat).'));
        return;
      }
      try {
        const src = ctx.createMediaStreamSource(stream);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        src.connect(analyser);
        buf = new Float32Array(analyser.fftSize);
      } catch (e) {
        stream.getTracks().forEach((t) => { try { t.stop(); } catch (e2) {} });
        stream = null;
        startBtn.disabled = false;
        T.show(box, errBox('Gagal menyiapkan analisa audio: ' + (e && e.message ? e.message : e)));
        return;
      }
      active = true;
      startBtn.disabled = false;
      startBtn.textContent = 'Stop';
      statusLbl.textContent = 'Mendengarkan… petik SATU senar.';
      T.show(box, '');
      timer = setInterval(tick, 120);
    };

    const hint = T.el('<div style="font-size:12px;color:#71717a;line-height:1.6">Stem standar (rendah → tinggi): E2 · A2 · D3 · G3 · B3 · E4. Semua diproses 100% lokal di HP kamu — suara tidak direkam atau diupload.</div>');
    root.appendChild(noteBig);
    root.appendChild(freqLbl);
    root.appendChild(needleWrap);
    root.appendChild(needleScale);
    root.appendChild(targetLbl);
    root.appendChild(statusLbl);
    root.appendChild(T.row(startBtn));
    root.appendChild(box);
    root.appendChild(hint);
  
}
