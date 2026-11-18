import { h as T, onLeave } from '../../core.js';

export const meta = { id: 'papan-skor-online', name: 'Papan Skor Online', cat: 'fun', icon: '🏆', desc: 'Papan skor layar besar untuk game, kuis, atau olahraga. Tim, ronde, target skor, dan jam pertandingan.', keywords: 'papan skor,scoreboard,skor,pertandingan,kuis,olahraga,timer,ronde', since: '6.17.0' };

export function render(root) {
  const st = document.createElement('style');
  st.textContent =
    '.ps-papan{background:#0d0b09;border:1px solid var(--line-soft);border-radius:16px;padding:20px 12px;margin:12px 0;text-align:center}' +
    '.ps-judul{font-size:15px;color:var(--mut);margin:0 0 4px}' +
    '.ps-jam{font-family:var(--font-m);font-size:44px;font-weight:800;line-height:1.1}' +
    '.ps-ronde{font-size:14px;color:var(--mut);margin:4px 0 14px}' +
    '.ps-tim{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center}' +
    '.ps-nama{font-size:17px;font-weight:700;word-break:break-word}' +
    '.ps-skor{font-family:var(--font-m);font-size:64px;font-weight:800;line-height:1}' +
    '.ps-vs{font-size:28px;color:var(--faint);font-weight:700}' +
    '.ps-menang{color:#ffd166}' +
    '.ps-target{font-size:12.5px;color:var(--mut);margin-top:8px}' +
    '.ps-kontrol{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}' +
    '.ps-kontrol .btn{min-height:52px;font-size:16px}' +
    '@media (min-width:600px){.ps-skor{font-size:96px}.ps-jam{font-size:56px}}';
  root.appendChild(st);

  root.appendChild(T.el('<p class="hint">Atur nama tim dan target skornya, lalu tampilkan di layar besar. Skor bisa ditambah atau dikurangi kapan saja.</p>'));

  const namaAI = T.input('text', 'Nama tim kiri', 'Tim Merah');
  const namaBI = T.input('text', 'Nama tim kanan', 'Tim Biru');
  const targetI = T.input('number', 'Target skor (0 = tanpa target)', '0');
  const rondeTotalI = T.input('number', 'Jumlah ronde (0 = tanpa ronde)', '0');
  const durasiI = T.input('number', 'Durasi jam (menit, 0 = hitung naik)', '10');
  const modeJam = T.select([['turun', 'Hitung mundur'], ['naik', 'Hitung naik (stopwatch)']], 'turun');

  let skorA = 0, skorB = 0, ronde = 1, selesai = false;
  let detik = 0, durasiTotal = 0, timerId = null, jalan = false;

  const papan = T.el('<div class="ps-papan"></div>');
  const judulEl = T.el('<p class="ps-judul">Pertandingan</p>');
  const jamEl = T.el('<div class="ps-jam">10:00</div>');
  const rondeEl = T.el('<p class="ps-ronde"></p>');
  const timEl = T.el('<div class="ps-tim"></div>');
  const targetEl = T.el('<p class="ps-target"></p>');
  papan.append(judulEl, jamEl, rondeEl, timEl, targetEl);

  function fmtJam(d) {
    d = Math.max(0, Math.round(d));
    const m = Math.floor(d / 60), s = d % 60;
    return m + ':' + String(s).padStart(2, '0');
  }

  function gambar() {
    const target = parseInt(targetI.value, 10) || 0;
    const rondeTotal = parseInt(rondeTotalI.value, 10) || 0;
    jamEl.textContent = fmtJam(detik);
    rondeEl.textContent = rondeTotal > 0 ? 'Ronde ' + ronde + ' dari ' + rondeTotal : 'Ronde ' + ronde;
    const namaA = namaAI.value.trim() || 'Tim A';
    const namaB = namaBI.value.trim() || 'Tim B';
    const menangA = target > 0 && skorA >= target;
    const menangB = target > 0 && skorB >= target;
    timEl.innerHTML =
      '<div><div class="ps-nama' + (menangA ? ' ps-menang' : '') + '">' + T.esc(namaA) + '</div><div class="ps-skor' + (menangA ? ' ps-menang' : '') + '">' + skorA + '</div></div>' +
      '<div class="ps-vs">:</div>' +
      '<div><div class="ps-nama' + (menangB ? ' ps-menang' : '') + '">' + T.esc(namaB) + '</div><div class="ps-skor' + (menangB ? ' ps-menang' : '') + '">' + skorB + '</div></div>';
    targetEl.textContent = target > 0
      ? (menangA || menangB ? 'Pemenang: ' + (menangA ? namaA : namaB) + ' mencapai target ' + target + '!' : 'Target: ' + target + ' poin. ' + namaA + ' butuh ' + Math.max(0, target - skorA) + ' lagi, ' + namaB + ' butuh ' + Math.max(0, target - skorB) + ' lagi.')
      : 'Tanpa target skor.';
    if ((menangA || menangB) && !selesai) {
      selesai = true;
      try { T.beep(660, 0.2, 'sine'); T.beep(880, 0.3, 'sine', 0.22); } catch (e) {}
    }
    if (!menangA && !menangB) selesai = false;
  }

  function aturJam() {
    const durasi = parseInt(durasiI.value, 10) || 0;
    durasiTotal = durasi * 60;
    detik = modeJam.value === 'turun' ? durasiTotal : 0;
    gambar();
  }

  function mulaiJeda() {
    if (jalan) {
      clearInterval(timerId);
      timerId = null;
      jalan = false;
      btnJam.textContent = 'Mulai jam';
      return;
    }
    jalan = true;
    btnJam.textContent = 'Jeda jam';
    timerId = setInterval(() => {
      if (modeJam.value === 'turun') {
        detik--;
        if (detik <= 0) {
          detik = 0;
          clearInterval(timerId);
          timerId = null;
          jalan = false;
          btnJam.textContent = 'Mulai jam';
          try { T.beep(880, 0.4, 'sine'); T.beep(880, 0.4, 'sine', 0.45); T.beep(880, 0.4, 'sine', 0.9); } catch (e) {}
          T.toast('Waktu habis!');
        }
      } else {
        detik++;
      }
      gambar();
    }, 1000);
  }

  function ubahSkor(tim, delta) {
    if (tim === 'A') skorA = Math.max(0, skorA + delta);
    else skorB = Math.max(0, skorB + delta);
    gambar();
  }

  function resetSemua() {
    skorA = 0; skorB = 0; ronde = 1;
    if (timerId) { clearInterval(timerId); timerId = null; jalan = false; btnJam.textContent = 'Mulai jam'; }
    aturJam();
  }

  const btnJam = T.btn('Mulai jam', mulaiJeda, true);
  const btnLayar = T.btn('Layar penuh', () => {
    if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); return; }
    if (papan.requestFullscreen) papan.requestFullscreen().catch(() => T.toast('Layar penuh tidak bisa dibuka di perangkat ini'));
  });

  const kontrol = T.el('<div class="ps-kontrol"></div>');
  kontrol.append(
    T.btn('+1 Tim Kiri', () => ubahSkor('A', 1)),
    T.btn('+1 Tim Kanan', () => ubahSkor('B', 1)),
    T.btn('−1 Tim Kiri', () => ubahSkor('A', -1)),
    T.btn('−1 Tim Kanan', () => ubahSkor('B', -1)),
    T.btn('Ronde berikutnya', () => { ronde++; gambar(); }),
    T.btn('Ulang dari awal', resetSemua),
  );

  [namaAI, namaBI, targetI, rondeTotalI].forEach((el) => el.addEventListener('input', gambar));
  durasiI.addEventListener('change', aturJam);
  modeJam.addEventListener('change', aturJam);

  onLeave(() => { if (timerId) clearInterval(timerId); });

  root.append(
    T.grid2(T.field('Tim kiri', namaAI), T.field('Tim kanan', namaBI)),
    T.grid2(T.field('Target skor', targetI, '0 berarti tanpa target, main sampai puas.'), T.field('Jumlah ronde', rondeTotalI, '0 berarti tanpa batas ronde.')),
    T.grid2(T.field('Durasi jam (menit)', durasiI), T.field('Arah jam', modeJam)),
    papan,
    kontrol,
    T.row(btnJam, btnLayar),
  );
  aturJam();
}
