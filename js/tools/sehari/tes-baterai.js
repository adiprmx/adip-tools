import { h as T, kv } from '../../core.js?v=6.13.0';

export const meta = {"id": "tes-baterai", "name": "Tes Baterai", "cat": "sehari", "icon": "🔋", "desc": "Lihat sisa baterai, status pengisian, dan perkiraan waktu pakai.", "keywords": "baterai,charging,daya,level,charge", "since": "6.11.0"};

const fmtWaktu = (detik) => {
  if (detik == null || !isFinite(detik)) return 'Tidak diketahui';
  const m = Math.round(detik / 60);
  if (m < 60) return m + ' menit';
  const j = Math.floor(m / 60);
  const s = m % 60;
  return j + ' jam' + (s ? ' ' + s + ' menit' : '');
};

export function render(root) {
  const info = T.el('<p class="mut" style="font-size:13px">Info baterai dibaca langsung dari perangkat. Angka diperbarui otomatis saat baterai berubah.</p>');
  const stateBox = T.out();
  const barWrap = T.el('<div hidden></div>');
  const bar = T.el('<div style="height:16px;background:rgba(255,255,255,.08);border-radius:8px;overflow:hidden"><div style="height:100%;width:0%;background:#fff;border-radius:8px"></div></div>');
  const big = T.el('<div class="big center" style="font-variant-numeric:tabular-nums"></div>');
  barWrap.appendChild(big);
  barWrap.appendChild(bar);

  let battery = null;

  const paint = () => {
    if (!battery) return;
    const pct = Math.round(battery.level * 100);
    big.textContent = pct + '%';
    bar.firstChild.style.width = pct + '%';
    T.show(stateBox,
      kv('Status', battery.charging ? 'Sedang dicas' : 'Tidak dicas') +
      kv('Perkiraan waktu sampai penuh', battery.charging ? fmtWaktu(battery.chargingTime) : 'Tidak dicas') +
      kv('Perkiraan waktu sampai habis', !battery.charging ? fmtWaktu(battery.dischargingTime) : 'Sedang dicas'));
  };

  const onChange = paint;

  if (!('getBattery' in navigator)) {
    T.show(stateBox, '<div class="big warn">Browser ini tidak menyediakan info baterai</div><p class="mut" style="font-size:13px">Fitur ini umumnya hanya ada di Chrome di Android dan laptop. Firefox dan Safari tidak menyediakannya, jadi tidak ada yang bisa ditampilkan di sini.</p>');
  } else {
    T.show(stateBox, '<p class="mut" style="font-size:13px">Membaca info baterai…</p>');
    navigator.getBattery().then((b) => {
      battery = b;
      barWrap.hidden = false;
      paint();
      b.addEventListener('levelchange', onChange);
      b.addEventListener('chargingchange', onChange);
      b.addEventListener('chargingtimechange', onChange);
      b.addEventListener('dischargingtimechange', onChange);
    }).catch(() => {
      T.show(stateBox, '<div class="big warn">Info baterai tidak bisa dibaca</div><p class="mut" style="font-size:13px">Browser menolak memberi info baterai di perangkat ini.</p>');
    });
  }

  T.onLeave(() => {
    if (!battery) return;
    battery.removeEventListener('levelchange', onChange);
    battery.removeEventListener('chargingchange', onChange);
    battery.removeEventListener('chargingtimechange', onChange);
    battery.removeEventListener('dischargingtimechange', onChange);
  });

  root.appendChild(info);
  root.appendChild(barWrap);
  root.appendChild(stateBox);
  root.appendChild(T.el('<p class="mut" style="font-size:12px">Perkiraan waktu berasal dari sistem perangkat dan bisa berubah-ubah. Diproses di browser.</p>'));
}
