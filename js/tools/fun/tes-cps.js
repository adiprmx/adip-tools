import { h as T } from '../../core.js';

// Tes CPS: seberapa cepat kamu bisa mengeklik? Ketuk area secepat mungkin
// selama waktu yang dipilih, lalu lihat klik per detikmu (CPS) dan
// grafiknya per detik. Peringkatnya patokan umum yang dipakai situs-situs
// tes CPS, bukan standar resmi.
export const meta = {"id": "tes-cps", "name": "Tes CPS", "cat": "fun", "icon": "🖱️", "desc": "Tes kecepatan klik: berapa klik per detik yang bisa kamu capai?", "keywords": "tes cps,klik per detik,click test,kecepatan klik,cps test,tes klik", "since": "6.18.0"};

const LS_KEY = 'adip-tools:tes-cps-terbaik';

// Klik per detik. Murni, bisa diuji di Node.
export function hitungCps(jumlahKlik, detik) {
  const k = Number(jumlahKlik);
  const d = Number(detik);
  if (!isFinite(k) || !isFinite(d) || d <= 0 || k < 0) return null;
  return k / d;
}

// Peringkat CPS (patokan umum situs tes CPS). Murni, bisa diuji di Node.
export function peringkatCps(cps) {
  const c = Number(cps);
  if (!isFinite(c) || c < 0) return null;
  if (c < 4) return { label: 'Santai', keterangan: 'Di bawah rata-rata. Coba lagi dengan jari yang lebih rileks.' };
  if (c < 6) return { label: 'Rata-rata', keterangan: 'Kecepatan kebanyakan orang.' };
  if (c < 8) return { label: 'Cepat', keterangan: 'Di atas rata-rata.' };
  if (c < 10) return { label: 'Sangat cepat', keterangan: 'Setara pemain game yang terlatih.' };
  return { label: 'Luar biasa', keterangan: 'Kecepatan kelas atas, jarang yang sampai sini.' };
}

// Kelompokkan stempel klik (ms) ke ember per detik. Murni, bisa diuji di Node.
export function emberPerDetik(stempel, durasiDetik) {
  const ember = new Array(Math.max(1, Math.floor(Number(durasiDetik) || 1))).fill(0);
  (stempel || []).forEach((t) => {
    const detik = Math.floor(Number(t) / 1000);
    if (detik >= 0 && detik < ember.length) ember[detik]++;
  });
  return ember;
}

export function render(root) {
  const durasiI = T.select([['1', '1 detik'], ['5', '5 detik'], ['10', '10 detik'], ['30', '30 detik'], ['60', '60 detik']], '10');
  const area = T.el('<button type="button" class="out center" style="min-height:180px;display:flex;flex-direction:column;justify-content:center;cursor:pointer;user-select:none;width:100%;font-family:inherit;color:inherit" aria-live="polite"></button>');
  const statBox = T.out();
  const grafikBox = T.out();
  let jalan = false, mulai = 0, timer = null, stempel = [], durasi = 10;

  let terbaik = 0;
  try { terbaik = Number(localStorage.getItem(LS_KEY)) || 0; } catch (e) { /* abaikan */ }

  const cat = (bg, teks, sub) => {
    area.style.background = bg;
    area.innerHTML = '<div class="big">' + teks + '</div>' + (sub ? '<div class="dim" style="margin-top:6px">' + sub + '</div>' : '');
    area.setAttribute('aria-label', 'Tes CPS: ' + teks + (sub ? '. ' + sub : ''));
  };

  const berhenti = () => {
    jalan = false;
    if (timer) { clearTimeout(timer); timer = null; }
    const jumlah = stempel.length;
    const cps = hitungCps(jumlah, durasi);
    const peringkat = peringkatCps(cps);
    const baru = cps > terbaik;
    if (baru) {
      terbaik = cps;
      try { localStorage.setItem(LS_KEY, String(terbaik)); } catch (e) { /* abaikan */ }
    }
    const ember = emberPerDetik(stempel, durasi);
    const maks = Math.max.apply(null, ember.concat([1]));
    cat('#222', 'Waktu habis!', jumlah + ' klik dalam ' + durasi + ' detik');
    T.show(statBox,
      '<div class="center"><div class="dim">Klik per detikmu</div><div class="big">' + (Math.round(cps * 100) / 100 + '').replace('.', ',') + ' CPS</div>' +
      '<div class="info">' + T.esc(peringkat.label) + ': ' + T.esc(peringkat.keterangan) + '</div>' +
      '<p class="mut">Terbaikmu sejauh ini: ' + (Math.round(terbaik * 100) / 100 + '').replace('.', ',') + ' CPS' + (baru ? ' (rekor baru!)' : '') + '</p></div>');
    T.show(grafikBox, '<div class="dim" style="margin-bottom:6px">Klik per detik</div>' +
      ember.map((n, i) => '<div style="display:flex;align-items:center;gap:8px;margin:3px 0"><span class="dim" style="width:36px;text-align:right">' + (i + 1) + ' dtk</span>' +
        '<div style="flex:1;height:14px;background:rgba(127,127,127,.18);border-radius:4px;overflow:hidden"><div style="height:100%;width:' + Math.round((n / maks) * 100) + '%;background:#ff6b4a;border-radius:4px"></div></div>' +
        '<span style="width:28px;font-size:13px">' + n + '</span></div>').join(''));
    T.beep(880, 0.2);
  };

  const klik = () => {
    if (!jalan) {
      jalan = true;
      stempel = [];
      durasi = Number(durasiI.value);
      mulai = Date.now();
      T.hide(statBox); T.hide(grafikBox);
      cat('#1d3a2a', 'Klik secepat mungkin!', 'Sisa ' + durasi + ' detik');
      timer = setTimeout(berhenti, durasi * 1000);
      return;
    }
    stempel.push(Date.now() - mulai);
    const sisa = Math.max(0, durasi - (Date.now() - mulai) / 1000);
    cat('#1d3a2a', stempel.length + ' klik', 'Sisa ' + (Math.round(sisa * 10) / 10 + '').replace('.', ',') + ' detik');
  };

  area.addEventListener('click', klik);
  T.onLeave(() => { if (timer) clearTimeout(timer); });

  root.appendChild(T.el('<p class="note">Ketuk area di bawah untuk mulai, lalu ketuk secepat mungkin sampai waktunya habis. Klik pertama memulai hitungan waktu.</p>'));
  root.appendChild(T.field('Lama tes', durasiI));
  root.appendChild(area);
  root.appendChild(statBox);
  root.appendChild(grafikBox);
  cat('#222', 'Ketuk di sini untuk mulai', 'Pilih lama tes di atas dulu');
}
