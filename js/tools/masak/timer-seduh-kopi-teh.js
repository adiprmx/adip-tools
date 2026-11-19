import { h as T, p2, utils, errBox } from '../../core.js';

export const meta = {"id": "timer-seduh-kopi-teh", "name": "Timer Seduh Kopi/Teh", "cat": "masak", "icon": "☕", "desc": "Timer seduh per tahap: V60, french press, tubruk, sampai teh.", "keywords": "timer,kopi,teh,seduh,v60,french press,tubruk,aeropress", "since": "6.19.0"};

// Tahap seduh per metode. Tiap tahap: label + durasi detik. Angka mengikuti
// panduan seduh umum (Specialty Coffee Association dan panduan produsen);
// suhu air dicantumkan sebagai patokan, bukan hasil ukur.
export const PRESET_SEDUH = {
  v60: {
    label: 'V60 / pour over',
    suhu: '92-96 derajat C',
    rasio: '1 gram kopi : 15 ml air',
    tahap: [
      { label: 'Basahi kertas filter, masukkan kopi', detik: 30 },
      { label: 'Blooming: tuang sedikit air, tunggu mengembang', detik: 45 },
      { label: 'Tuang pertama sampai separuh air', detik: 60 },
      { label: 'Tuang kedua sampai air habis', detik: 60 },
      { label: 'Biarkan menetes sampai selesai', detik: 45 },
    ],
  },
  french: {
    label: 'French press',
    suhu: '93-96 derajat C',
    rasio: '1 gram kopi : 14 ml air',
    tahap: [
      { label: 'Masukkan kopi, tuang air, aduk pelan', detik: 30 },
      { label: 'Tutup, biarkan terendam', detik: 210 },
      { label: 'Tekan pelan, tuang dan sajikan', detik: 30 },
    ],
  },
  tubruk: {
    label: 'Kopi tubruk',
    suhu: 'Air baru mendidih, diamkan 1 menit',
    rasio: '1 gram kopi : 15 ml air',
    tahap: [
      { label: 'Tuang air ke kopi, aduk sekali', detik: 30 },
      { label: 'Biarkan ampas mengendap', detik: 210 },
      { label: 'Siap diminum, jangan diaduk lagi', detik: 30 },
    ],
  },
  aeropress: {
    label: 'AeroPress',
    suhu: '85-92 derajat C',
    rasio: '1 gram kopi : 13 ml air',
    tahap: [
      { label: 'Tuang air, aduk 10 detik', detik: 30 },
      { label: 'Biarkan terendam', detik: 60 },
      { label: 'Tekan pelan sampai habis', detik: 30 },
    ],
  },
  tehHijau: {
    label: 'Teh hijau',
    suhu: '70-80 derajat C, jangan air mendidih',
    rasio: '1 sendok teh daun : 200 ml air',
    tahap: [
      { label: 'Tuang air, biarkan daun terendam', detik: 150 },
      { label: 'Angkat daun, teh siap diminum', detik: 30 },
    ],
  },
  tehHitam: {
    label: 'Teh hitam',
    suhu: '95-100 derajat C',
    rasio: '1 sendok teh daun : 200 ml air',
    tahap: [
      { label: 'Tuang air mendidih, biarkan terendam', detik: 240 },
      { label: 'Angkat daun, teh siap diminum', detik: 30 },
    ],
  },
  tehHerbal: {
    label: 'Teh herbal',
    suhu: 'Air mendidih',
    rasio: '1 sendok makan bahan : 200 ml air',
    tahap: [
      { label: 'Tuang air mendidih, tutup cangkir', detik: 360 },
      { label: 'Saring, teh siap diminum', detik: 30 },
    ],
  },
};

// Total detik satu preset. Fungsi murni, diuji di Node.
export function totalDetikPreset(preset) {
  const p = PRESET_SEDUH[preset];
  if (!p) return 0;
  return p.tahap.reduce((t, s) => t + s.detik, 0);
}

// Tahap yang sedang berjalan pada detik ke-n (0 = sebelum mulai).
export function tahapPada(preset, detikBerjalan) {
  const p = PRESET_SEDUH[preset];
  if (!p) return { indeks: -1, sisa: 0, selesai: true };
  let akum = 0;
  for (let i = 0; i < p.tahap.length; i++) {
    akum += p.tahap[i].detik;
    if (detikBerjalan < akum) return { indeks: i, sisa: akum - detikBerjalan, selesai: false };
  }
  return { indeks: p.tahap.length - 1, sisa: 0, selesai: true };
}
utils.totalDetikPreset = totalDetikPreset;

export function render(root) {
  const presetSel = T.select(Object.keys(PRESET_SEDUH).map((k) => [k, PRESET_SEDUH[k].label]), 'v60');
  const infoBox = T.out();
  const disp = T.el('<div class="big center" style="font-size:56px">--:--</div>');
  const tahapBox = T.out();
  const barWrap = T.el('<div style="margin:12px 0" hidden></div>');
  const barFill = T.el('<div style="height:8px;width:0%;background:#ff6f61;border-radius:99px;transition:width .3s"></div>');
  const barTrack = T.el('<div style="height:8px;background:#27272a;border-radius:99px;overflow:hidden"></div>');
  barTrack.appendChild(barFill);
  barWrap.appendChild(barTrack);

  let timer = null, mulaiAt = 0, total = 0, presetAktif = 'v60', tahapTerakhir = -1, jalan = false;

  const gambarTahap = () => {
    const p = PRESET_SEDUH[presetAktif];
    const berjalan = Math.floor((Date.now() - mulaiAt) / 1000);
    const st = tahapPada(presetAktif, jalan ? berjalan : 0);
    const html = p.tahap.map((s, i) => {
      const status = st.selesai || i < st.indeks ? '✓' : i === st.indeks ? '●' : '○';
      const gaya = i === st.indeks && !st.selesai ? 'color:#fff' : '';
      const menit = Math.floor(s.detik / 60), dtk = s.detik % 60;
      const dur = (menit ? menit + ' mnt ' : '') + (dtk ? dtk + ' dtk' : '');
      return '<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid #27272a;' + gaya + '">' +
        '<span style="min-width:20px">' + status + '</span><span style="flex:1;line-height:1.5">' + T.esc(s.label) + '</span>' +
        '<span class="dim">' + dur + '</span></div>';
    }).join('');
    T.show(tahapBox, html);
    return st;
  };

  const gambar = () => {
    const berjalan = Math.floor((Date.now() - mulaiAt) / 1000);
    const st = tahapPada(presetAktif, berjalan);
    if (st.selesai) { selesai(); return; }
    disp.textContent = p2(Math.floor(st.sisa / 60)) + ':' + p2(st.sisa % 60);
    barFill.style.width = Math.min(100, Math.round((berjalan / total) * 100)) + '%';
    if (st.indeks !== tahapTerakhir) {
      tahapTerakhir = st.indeks;
      try { T.beep(880, 0.25, 'sine'); } catch (e) {}
      if (navigator.vibrate) { try { navigator.vibrate(120); } catch (e) {} }
    }
    gambarTahap();
  };

  const hentikan = () => { if (timer) { clearInterval(timer); timer = null; } jalan = false; };

  const selesai = () => {
    hentikan();
    disp.textContent = 'Selesai!';
    barFill.style.width = '100%';
    gambarTahap();
    try { T.beep(880, 0.3, 'sine'); T.beep(880, 0.3, 'sine', 0.4); T.beep(1174, 0.5, 'sine', 0.8); } catch (e) {}
    if (navigator.vibrate) { try { navigator.vibrate([200, 100, 200, 100, 400]); } catch (e) {} }
    T.toast('Seduhan selesai');
  };

  const mulai = () => {
    presetAktif = presetSel.value;
    total = totalDetikPreset(presetAktif);
    hentikan();
    mulaiAt = Date.now();
    jalan = true;
    tahapTerakhir = -1;
    barWrap.hidden = false;
    timer = setInterval(gambar, 250);
    gambar();
  };

  const batal = () => {
    hentikan();
    disp.textContent = '--:--';
    barWrap.hidden = true;
    barFill.style.width = '0%';
    presetAktif = presetSel.value;
    gambarTahap();
  };

  const refreshInfo = () => {
    const p = PRESET_SEDUH[presetSel.value];
    const t = totalDetikPreset(presetSel.value);
    T.show(infoBox,
      '<div class="kv"><span class="k">Suhu air</span><span class="v">' + T.esc(p.suhu) + '</span></div>' +
      '<div class="kv"><span class="k">Takaran</span><span class="v">' + T.esc(p.rasio) + '</span></div>' +
      '<div class="kv"><span class="k">Total waktu</span><span class="v">' + Math.floor(t / 60) + ' menit ' + (t % 60 ? (t % 60) + ' detik' : '') + '</span></div>');
    if (!jalan) { presetAktif = presetSel.value; gambarTahap(); }
  };

  presetSel.addEventListener('change', refreshInfo);
  T.onLeave(hentikan);

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Pilih metode seduh, ikuti tahapnya. Timer bunyi tiap ganti tahap dan saat selesai. Durasi dan suhu memakai patokan umum, sesuaikan dengan seleramu.</p>'));
  root.appendChild(T.field('Metode seduh', presetSel));
  root.appendChild(infoBox);
  root.appendChild(disp);
  root.appendChild(barWrap);
  root.appendChild(T.row(T.btn('Mulai timer', mulai, true), T.btn('Batalkan', batal)));
  root.appendChild(tahapBox);
  root.appendChild(T.el('<p class="hint">Timer jalan selama halaman ini dibuka. Bunyi butuh suara HP aktif.</p>'));
  refreshInfo();
}
