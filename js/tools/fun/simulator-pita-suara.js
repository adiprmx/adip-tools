import { h as T, onLeave, actx } from '../../core.js';

export const meta = {"id": "simulator-pita-suara", "name": "Simulator Pita Suara", "cat": "fun", "icon": "🎤", "desc": "Lihat dua pita suara membuka dan menutup saat bersuara. Atur nada dan kerasnya, lalu dengarkan bunyinya.", "keywords": "pita suara,vokal,suara,fonasi,nada,frekuensi,simulator,laring", "since": "6.19.0"};

// Bukaan pita suara pada waktu t (detik) untuk frekuensi f (Hz) dan
// amplitudo 0..1. Bentuknya gelombang yang membuka cepat lalu menutup
// pelan, mirip satu siklus fonasi yang disederhanakan.
export function bukaanPita(t, freq, amp) {
  const fase = ((t * freq) % 1 + 1) % 1;
  const naik = fase < 0.35 ? fase / 0.35 : 1 - (fase - 0.35) / 0.65;
  const bentuk = Math.sin(Math.PI * Math.max(0, Math.min(1, naik)));
  return Math.max(0, Math.min(1, bentuk * amp));
}

// Nilai gelombang suara sederhana (sinus) untuk digambar.
export function gelombang(t, freq, amp) {
  return Math.sin(2 * Math.PI * freq * t) * amp;
}

// Nama nada terdekat dari frekuensi (A4 = 440 Hz).
export function namaNada(freq) {
  if (!(freq > 0)) return '';
  const nama = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const n = Math.round(12 * Math.log2(freq / 440)) + 69;
  const oktaf = Math.floor(n / 12) - 1;
  return nama[((n % 12) + 12) % 12] + oktaf;
}

export function render(root) {
  const st = document.createElement('style');
  st.textContent = '.ps-kanvas{width:100%;height:auto;display:block;background:#171923;border:1px solid rgba(255,255,255,.12);border-radius:12px;margin:12px 0}';
  root.appendChild(st);

  const kanvas = document.createElement('canvas');
  kanvas.className = 'ps-kanvas';
  kanvas.width = 680;
  kanvas.height = 300;
  kanvas.setAttribute('role', 'img');
  kanvas.setAttribute('aria-label', 'Gambar pita suara yang bergetar');
  const ctx = kanvas.getContext('2d');

  const nadaI = T.input('range', '', '');
  nadaI.min = '80'; nadaI.max = '400'; nadaI.step = '1'; nadaI.value = '150';
  const kerasI = T.input('range', '', '');
  kerasI.min = '0.1'; kerasI.max = '1'; kerasI.step = '0.05'; kerasI.value = '0.7';
  const box = T.out();
  const infoNada = T.out();
  let animId = null;
  let jalan = true;
  let audioCtx = null;
  let osilator = null;
  let penguat = null;

  const nada = () => parseFloat(nadaI.value) || 150;
  const keras = () => parseFloat(kerasI.value) || 0.7;

  function perbaruiInfo() {
    T.show(infoNada, '<p class="center hint">Nada ' + T.fmt(nada()) + ' Hz (sekitar ' + namaNada(nada()) + '), keras ' + Math.round(keras() * 100) + '%. Pita suara membuka dan menutup ' + T.fmt(nada()) + ' kali tiap detik.</p>');
  }

  function gambar(waktu) {
    const t = waktu / 1000;
    ctx.clearRect(0, 0, kanvas.width, kanvas.height);
    ctx.fillStyle = '#171923';
    ctx.fillRect(0, 0, kanvas.width, kanvas.height);
    const tengahY = 110;
    const buka = jalan ? bukaanPita(t, nada(), keras()) : 0.15;
    const celah = 4 + buka * 46;
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.moveTo(40, tengahY - celah);
    ctx.bezierCurveTo(200, tengahY - celah - 34, 480, tengahY - celah - 34, 640, tengahY - celah);
    ctx.lineTo(640, tengahY - celah - 40);
    ctx.bezierCurveTo(480, tengahY - celah - 74, 200, tengahY - celah - 74, 40, tengahY - celah - 40);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(40, tengahY + celah);
    ctx.bezierCurveTo(200, tengahY + celah + 34, 480, tengahY + celah + 34, 640, tengahY + celah);
    ctx.lineTo(640, tengahY + celah + 40);
    ctx.bezierCurveTo(480, tengahY + celah + 74, 200, tengahY + celah + 74, 40, tengahY + celah + 40);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Pita suara atas', 48, tengahY - celah - 48);
    ctx.fillText('Pita suara bawah', 48, tengahY + celah + 62);
    ctx.fillStyle = '#fff';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(jalan ? 'Bukaan: ' + Math.round(buka * 100) + '%' : 'Dijeda', 48, 24);
    ctx.strokeStyle = 'rgba(255,255,255,.25)';
    ctx.beginPath();
    ctx.moveTo(0, 250); ctx.lineTo(kanvas.width, 250);
    ctx.stroke();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= kanvas.width; x += 2) {
      const tt = t + (x / kanvas.width) * (3 / nada());
      const y = 250 - gelombang(tt, nada(), keras()) * 30;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('Gelombang suara', 48, 292);
  }

  function putar(waktu) {
    gambar(waktu);
    animId = requestAnimationFrame(putar);
  }

  const jedaBtn = T.btn('Jeda gambar', () => {
    jalan = !jalan;
    jedaBtn.textContent = jalan ? 'Jeda gambar' : 'Lanjutkan gambar';
  });
  const bunyiBtn = T.btn('Dengarkan nadanya', () => {
    if (osilator) {
      try { osilator.stop(); } catch (e) { /* sudah berhenti */ }
      osilator = null;
      bunyiBtn.textContent = 'Dengarkan nadanya';
      return;
    }
    try {
      audioCtx = audioCtx || actx();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      osilator = audioCtx.createOscillator();
      penguat = audioCtx.createGain();
      osilator.type = 'sawtooth';
      osilator.frequency.value = nada();
      penguat.gain.value = 0.06 * keras();
      osilator.connect(penguat);
      penguat.connect(audioCtx.destination);
      osilator.start();
      bunyiBtn.textContent = 'Berhenti';
    } catch (e) {
      T.toast('Suara tidak bisa diputar di perangkat ini');
    }
  });
  const perbaruiBunyi = () => {
    perbaruiInfo();
    if (osilator) {
      osilator.frequency.value = nada();
      if (penguat) penguat.gain.value = 0.06 * keras();
    }
  };
  nadaI.addEventListener('input', perbaruiBunyi);
  kerasI.addEventListener('input', perbaruiBunyi);
  onLeave(() => {
    if (animId) cancelAnimationFrame(animId);
    if (osilator) { try { osilator.stop(); } catch (e) { /* abaikan */ } }
  });

  root.appendChild(T.el('<p class="hint">Saat kamu bersuara, dua pita suara di tenggorokan membuka dan menutup ratusan kali tiap detik. Makin cepat getarannya, makin tinggi nadanya. Ini gambar yang disederhanakan, bukan alat medis.</p>'));
  root.appendChild(T.field('Nada (Hz)', nadaI, 'Suara pria dewasa biasanya 85 sampai 180 Hz, wanita dewasa 165 sampai 255 Hz.'));
  root.appendChild(T.field('Kerasnya suara', kerasI, 'Makin keras, makin lebar bukaan pita suaranya.'));
  root.appendChild(kanvas);
  root.appendChild(infoNada);
  root.appendChild(T.row(jedaBtn, bunyiBtn));
  root.appendChild(box);
  perbaruiInfo();
  T.show(box, '<p class="hint">Geser nada dan kerasnya untuk melihat gambar berubah. Tekan "Dengarkan nadanya" untuk mendengar bunyi pada nada itu.</p>');
  animId = requestAnimationFrame(putar);
}
