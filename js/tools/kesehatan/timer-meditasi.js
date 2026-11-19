import { h as T, p2, utils } from '../../core.js';

// Timer meditasi: hitung mundur dengan bunyi lembut di awal dan akhir,
// ditambah lonceng interval tiap 5 menit bila diaktifkan. Sesi yang
// selesai dicatat di perangkat (jumlah sesi dan total menit).
export function fmtWaktu(detik) {
  const d = Math.max(0, Math.round(detik));
  return p2(Math.floor(d / 60)) + ':' + p2(d % 60);
}
utils.fmtWaktu = fmtWaktu;

const KUNCI = 'adip-tools-meditasi';

function muatCatatan() {
  try {
    const c = JSON.parse(localStorage.getItem(KUNCI) || '{}');
    return { sesi: Number(c.sesi) || 0, menit: Number(c.menit) || 0 };
  } catch (e) { return { sesi: 0, menit: 0 }; }
}

function simpanCatatan(c) {
  try { localStorage.setItem(KUNCI, JSON.stringify(c)); } catch (e) { /* abaikan */ }
}

function bel(akhir) {
  try {
    if (akhir) {
      T.beep(528, 1.2, 'sine');
      T.beep(528, 1.2, 'sine', 1.4);
      T.beep(528, 1.8, 'sine', 2.8);
    } else {
      T.beep(528, 1.0, 'sine');
    }
  } catch (e) { /* audio tidak tersedia */ }
}

export const meta = {"id": "timer-meditasi", "name": "Timer Meditasi", "cat": "kesehatan", "icon": "🧘", "desc": "Timer meditasi dengan bunyi lembut di awal dan akhir, lonceng interval tiap 5 menit, dan catatan sesi di perangkatmu.", "keywords": "timer meditasi,meditasi,mindfulness,relaksasi,tenang,napas,lonceng meditasi", "since": "6.19.0"};
export function render(root) {
  const PRESETS = [5, 10, 15, 20, 30];
  const customI = T.input('number', 'cth: 45', '');
  const lonceng = document.createElement('input');
  lonceng.type = 'checkbox';
  lonceng.checked = true;
  lonceng.id = 'f-lonceng-meditasi';
  const disp = T.el('<div class="big center" style="font-size:56px">--:--</div>');
  const bar = T.el('<div style="height:8px;border-radius:99px;background:var(--line,#ddd);overflow:hidden;margin:8px 0"><div data-bar style="height:100%;width:0%;background:var(--acc,#fff);border-radius:99px"></div></div>');
  const labelBox = T.out();
  const catatBox = T.out();
  let timer = null, sisa = 0, total = 0, jalan = false, sudahBelInterval = 0;

  const hentikan = () => { if (timer) { clearInterval(timer); timer = null; } };

  const gambar = () => {
    disp.textContent = fmtWaktu(sisa);
    const isi = bar.querySelector('[data-bar]');
    if (isi && total > 0) isi.style.width = Math.round((1 - sisa / total) * 100) + '%';
  };

  const tampilCatatan = () => {
    const c = muatCatatan();
    T.show(catatBox, '<p class="center dim">Sesi selesai: ' + c.sesi + ' kali, total ' + c.menit + ' menit. Catatan ini tersimpan di perangkatmu.</p>');
  };

  const selesai = () => {
    hentikan();
    jalan = false;
    disp.textContent = '00:00';
    const isi = bar.querySelector('[data-bar]');
    if (isi) isi.style.width = '100%';
    const c = muatCatatan();
    c.sesi += 1;
    c.menit += Math.round(total / 60);
    simpanCatatan(c);
    T.show(labelBox, '<p class="center">Sesi meditasi selesai. Tarik napas dalam sekali lagi, lalu buka mata pelan-pelan.</p>');
    bel(true);
    if (navigator.vibrate) { try { navigator.vibrate([300, 200, 300]); } catch (e) {} }
    tampilCatatan();
  };

  const mulai = (menit) => {
    const m = T.num(menit);
    if (!isFinite(m) || m <= 0 || m > 180) { T.toast('Durasi harus 1 sampai 180 menit'); return; }
    hentikan();
    total = Math.round(m * 60);
    sisa = total;
    sudahBelInterval = 0;
    jalan = true;
    T.show(labelBox, '<p class="center dim">Duduk nyaman, pejamkan mata, ikuti napasmu. Bunyi lembut menandai akhir sesi.</p>');
    gambar();
    bel(false);
    timer = setInterval(() => {
      sisa -= 1;
      if (lonceng.checked && sisa > 0 && (total - sisa) % 300 === 0) {
        sudahBelInterval += 1;
        bel(false);
      }
      if (sisa <= 0) { selesai(); return; }
      gambar();
    }, 1000);
  };

  const jeda = () => {
    if (!jalan) return;
    hentikan();
    jalan = false;
    T.show(labelBox, '<p class="center dim">Dijeda di ' + fmtWaktu(sisa) + '. Tekan "Lanjut" untuk meneruskan.</p>');
  };

  const lanjut = () => {
    if (jalan || sisa <= 0 || total <= 0) return;
    jalan = true;
    T.show(labelBox, '<p class="center dim">Meditasi berjalan lagi. Ikuti napasmu.</p>');
    timer = setInterval(() => {
      sisa -= 1;
      if (lonceng.checked && sisa > 0 && (total - sisa) % 300 === 0) {
        sudahBelInterval += 1;
        bel(false);
      }
      if (sisa <= 0) { selesai(); return; }
      gambar();
    }, 1000);
  };

  const batal = () => {
    hentikan();
    jalan = false;
    sisa = 0;
    total = 0;
    disp.textContent = '--:--';
    const isi = bar.querySelector('[data-bar]');
    if (isi) isi.style.width = '0%';
    T.show(labelBox, '<p class="center dim">Timer dibatalkan. Tidak apa-apa, meditasi bisa dimulai kapan saja.</p>');
  };

  T.onLeave(hentikan);

  root.appendChild(T.el('<p class="note">Pilih durasi, tekan mulai, dan biarkan bunyi lembut yang menandai waktumu. Tidak ada target yang harus dikejar.</p>'));
  root.appendChild(T.grid2(...PRESETS.map((m) => T.btn(m + ' menit', () => mulai(m)))));
  root.appendChild(T.field('Atau isi sendiri (menit)', customI, 'Maksimal 180 menit.'));
  root.appendChild(T.el('<label for="f-lonceng-meditasi" style="display:flex;gap:8px;align-items:center;margin:8px 0;font-size:14px"></label>'));
  const lbl = root.querySelector('label[for="f-lonceng-meditasi"]');
  lbl.appendChild(lonceng);
  lbl.appendChild(document.createTextNode('Bunyikan lonceng lembut tiap 5 menit'));
  root.appendChild(T.row(
    T.btn('Mulai', () => mulai(customI.value), true),
    T.btn('Jeda', jeda),
    T.btn('Lanjut', lanjut),
    T.btn('Batal', batal),
  ));
  root.appendChild(disp);
  root.appendChild(bar);
  root.appendChild(labelBox);
  root.appendChild(catatBox);
  tampilCatatan();
}
