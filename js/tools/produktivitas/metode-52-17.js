import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id":"metode-52-17","name":"Metode 52-17","cat":"produktivitas","icon":"⏱️","desc":"Timer fokus 52 menit + istirahat 17 menit, siklusnya jalan otomatis.","keywords":"timer,fokus,52-17,istirahat,produktivitas,kerja,belajar,deep work,konsentrasi"};

export function render(root) {
  const FOKUS = 52 * 60;      // detik
  const ISTIRAHAT = 17 * 60;  // detik
  const CKEY = 'adip-tools:metode-52-17:siklus';

  let fase = 'idle'; // idle | fokus | istirahat
  let sisa = FOKUS;
  let endAt = 0;
  let timer = null;
  let jalan = false;
  let siklus = 0;
  try { siklus = parseInt(localStorage.getItem(CKEY) || '0', 10) || 0; } catch (e) { siklus = 0; }
  const simpanSiklus = () => { try { localStorage.setItem(CKEY, String(siklus)); } catch (e) {} };

  const mmss = (d) => {
    const m = Math.floor(d / 60), s = d % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  };

  const faseEl = T.el('<div class="center" style="font-size:13px;font-weight:800;letter-spacing:3px;margin-bottom:4px"></div>');
  const waktuEl = T.el('<div class="center" style="font-size:56px;font-weight:800;font-variant-numeric:tabular-nums;line-height:1.1"></div>');
  const barWrap = T.el('<div style="height:8px;border-radius:99px;background:#ffffff14;margin:14px 0 6px;overflow:hidden"></div>');
  const bar = T.el('<div style="height:100%;width:0%;border-radius:99px;background:#fff;transition:width .5s"></div>');
  barWrap.appendChild(bar);
  const siklusEl = T.el('<p class="center mut" style="font-size:12.5px"></p>');

  const total = () => (fase === 'istirahat' ? ISTIRAHAT : FOKUS);
  const gambar = () => {
    const label = fase === 'fokus' ? 'FOKUS' : fase === 'istirahat' ? 'ISTIRAHAT' : 'SIAP';
    faseEl.textContent = label;
    faseEl.style.color = fase === 'fokus' ? '#6ee7b7' : fase === 'istirahat' ? '#93c5fd' : '';
    waktuEl.textContent = mmss(sisa);
    bar.style.width = fase === 'idle' ? '0%' : Math.min(100, Math.max(0, ((total() - sisa) / total()) * 100)) + '%';
    siklusEl.textContent = 'Siklus selesai: ' + siklus;
    btnMulai.disabled = jalan;
    btnJeda.disabled = !jalan;
  };

  const bunyi = (nada) => nada.forEach((f, i) => T.beep(f, 0.18, 'sine', i * 0.28));

  const gantiFase = () => {
    if (fase === 'fokus') {
      fase = 'istirahat';
      sisa = ISTIRAHAT;
      bunyi([880, 880, 880]);
      T.toast('52 menit beres. Istirahat 17 menit, jauhin dulu kerjaannya.');
    } else {
      fase = 'fokus';
      sisa = FOKUS;
      siklus++;
      simpanSiklus();
      bunyi([523, 659, 784]);
      T.toast('Istirahat selesai. Balik fokus.');
    }
    endAt = Date.now() + sisa * 1000;
    gambar();
  };

  const tick = () => {
    sisa = Math.max(0, Math.round((endAt - Date.now()) / 1000));
    if (sisa <= 0) { gantiFase(); return; }
    gambar();
  };

  const mulai = () => {
    if (jalan) return;
    if (fase === 'idle') { fase = 'fokus'; sisa = FOKUS; }
    jalan = true;
    endAt = Date.now() + sisa * 1000;
    clearInterval(timer);
    timer = setInterval(tick, 1000);
    gambar();
  };
  const jeda = () => { jalan = false; clearInterval(timer); gambar(); };
  const reset = () => { jeda(); fase = 'idle'; sisa = FOKUS; gambar(); };

  const btnMulai = T.btn('Mulai', mulai, true);
  const btnJeda = T.btn('Jeda', jeda);
  const btnReset = T.btn('Reset', reset);
  T.onLeave(() => clearInterval(timer));

  root.appendChild(T.el('<p class="hint">Risetnya bilang 52 menit fokus + 17 menit istirahat itu ritme paling enak buat kerja lama. Timer ini pindah fase sendiri dan bunyi tiap ganti — kamu tinggal ngikutin.</p>'));
  root.appendChild(faseEl);
  root.appendChild(waktuEl);
  root.appendChild(barWrap);
  root.appendChild(siklusEl);
  root.appendChild(T.row(btnMulai, btnJeda, btnReset));
  gambar();
}
