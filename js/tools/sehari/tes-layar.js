import { h as T, kv } from '../../core.js?v=6.12.2';

export const meta = {"id": "tes-layar", "name": "Tes Layar", "cat": "sehari", "icon": "🖥️", "desc": "Info resolusi dan layar, perkiraan refresh rate, dan tes gradasi warna.", "keywords": "layar,resolusi,refresh rate,hz,gradasi,monitor", "since": "6.11.0"};

export function render(root) {
  const info = T.el('<p class="mut" style="font-size:13px">Angka di bawah dibaca langsung dari browser. Refresh rate hanya perkiraan dari kecepatan gambar browser, bukan angka resmi perangkat.</p>');
  const infoBox = T.out();
  const hzBox = T.out();

  const paintInfo = () => {
    const w = window.screen.width, h = window.screen.height;
    const orient = window.screen.orientation ? window.screen.orientation.type : (w >= h ? 'landscape' : 'portrait');
    const ratio = (w && h) ? (w / h).toFixed(2) + ' : 1' : 'Tidak terbaca';
    T.show(infoBox,
      kv('Resolusi layar', w + ' × ' + h + ' px') +
      kv('Ukuran jendela browser', window.innerWidth + ' × ' + window.innerHeight + ' px') +
      kv('Rasio layar', ratio) +
      kv('Skala piksel', window.devicePixelRatio ? window.devicePixelRatio + 'x' : 'Tidak terbaca') +
      kv('Kedalaman warna', window.screen.colorDepth ? window.screen.colorDepth + ' bit' : 'Tidak terbaca') +
      kv('Orientasi', T.esc(orient)) +
      kv('Layar sentuh', navigator.maxTouchPoints ? 'Ya (' + navigator.maxTouchPoints + ' titik)' : 'Tidak terdeteksi'));
  };

  let hzRaf = null, hzFrames = 0, hzT0 = 0, hzRunning = false;

  const measureHz = () => {
    if (hzRunning) return;
    hzRunning = true;
    hzFrames = 0;
    hzT0 = performance.now();
    T.show(hzBox, '<p class="mut" style="font-size:13px">Mengukur… jangan pindah tab selama 2 detik.</p>');
    const step = () => {
      hzFrames++;
      const el = performance.now() - hzT0;
      if (el >= 2000) {
        const hz = Math.round(hzFrames / (el / 1000));
        hzRunning = false;
        T.show(hzBox,
          '<div class="big center" style="font-variant-numeric:tabular-nums">Sekitar ' + hz + ' Hz</div>' +
          '<p class="mut center" style="font-size:12px">Perkiraan dari ' + hzFrames + ' gambar dalam ' + (el / 1000).toFixed(1) + ' detik. Angka ini bisa turun kalau perangkat sedang sibuk atau mode hemat baterai aktif.</p>');
        return;
      }
      hzRaf = requestAnimationFrame(step);
    };
    hzRaf = requestAnimationFrame(step);
  };

  const gradasi = T.el('<div style="margin-top:14px"></div>');
  const grad1 = T.el('<div style="height:56px;border-radius:10px;background:linear-gradient(90deg,#000,#fff);border:1px solid rgba(255,255,255,.14)"></div>');
  const grad2 = T.el('<div style="height:56px;border-radius:10px;background:linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00);border:1px solid rgba(255,255,255,.14);margin-top:8px"></div>');
  const steps = T.el('<div style="display:flex;height:44px;border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,.14);margin-top:8px"></div>');
  for (let i = 0; i < 10; i++) {
    const g = Math.round(i * 255 / 9);
    const s = T.el('<div style="flex:1;background:rgb(' + g + ',' + g + ',' + g + ')"></div>');
    steps.appendChild(s);
  }
  gradasi.appendChild(T.el('<p style="font-size:13px;margin:0 0 6px">Tes gradasi warna:</p>'));
  gradasi.appendChild(grad1);
  gradasi.appendChild(grad2);
  gradasi.appendChild(steps);
  gradasi.appendChild(T.el('<p class="mut" style="font-size:12px;margin-top:8px">Kalau gradasi hitam ke putih terlihat bergaris-garis kasar, layar kurang halus menampilkan gradasi. Sepuluh kotak abu-abu di bawah seharusnya terlihat beda satu sama lain.</p>'));

  const onResize = paintInfo;
  window.addEventListener('resize', onResize);

  T.onLeave(() => {
    if (hzRaf) cancelAnimationFrame(hzRaf);
    window.removeEventListener('resize', onResize);
  });

  root.appendChild(info);
  root.appendChild(infoBox);
  root.appendChild(T.row(T.btn('Ukur refresh rate', measureHz, true)));
  root.appendChild(hzBox);
  root.appendChild(gradasi);
  root.appendChild(T.el('<p class="mut" style="font-size:12px">Diproses di browser.</p>'));
  paintInfo();
  measureHz();
}
