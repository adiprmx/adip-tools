import { h as T, utils } from '../../core.js';

// Perbaiki piksel nyangkut (stuck pixel): pola warna yang berkedip cepat
// kadang bisa membangunkan piksel yang macet di satu warna. Tidak ada
// jaminan berhasil, dan tidak berlaku untuk piksel mati total (hitam
// pekat). Berhenti bila pusing atau mata lelah.
export const WARNA_KEDIP = ['#ff0000', '#00ff00', '#0000ff', '#ffffff', '#000000', '#ffff00', '#00ffff', '#ff00ff'];
export const WARNA_SOLID = ['#ff0000', '#00ff00', '#0000ff', '#ffffff', '#000000'];
export function warnaBerikutnya(idx, daftar) {
  const list = daftar && daftar.length ? daftar : WARNA_KEDIP;
  return list[(idx + 1) % list.length];
}
utils.pikselNyangkut = { WARNA_KEDIP, WARNA_SOLID, warnaBerikutnya };

export const meta = {"id": "perbaiki-piksel-nyangkut", "name": "Perbaiki Piksel Nyangkut", "cat": "sehari", "icon": "🖥️", "desc": "Coba bangunkan piksel layar yang macet di satu warna dengan pola warna berkedip.", "keywords": "piksel nyangkut,stuck pixel,piksel mati,layar,dead pixel,perbaiki layar", "since": "6.19.0"};
export function render(root) {
  const modeSel = T.select([
    ['kedip', 'Warna berkedip cepat'],
    ['solid', 'Warna solid bergantian (pelan)'],
  ], 'kedip');
  const durasiSel = T.select([['60', '1 menit'], ['300', '5 menit'], ['600', '10 menit'], ['0', 'Sampai dihentikan']], '300');
  root.appendChild(T.el('<style>.pxn-area:fullscreen{width:100vw!important;height:100vh!important;border-radius:0!important;border:none!important;margin:0!important}</style>'));
  const area = T.el('<div class="pxn-area" style="height:220px;border-radius:12px;border:1px solid rgba(127,127,127,.35);background:#111;display:flex;align-items:center;justify-content:center;margin:12px 0;overflow:hidden"><p class="mut" style="font-size:13px;padding:0 16px;text-align:center">Pola warna muncul di sini setelah tombol mulai ditekan. Tekan Layar penuh agar polanya menutupi seluruh layar, lalu dekatkan ke piksel yang nyangkut.</p></div>');
  const statusBox = T.out();
  const tombolBox = T.el('<div style="display:flex;gap:8px;flex-wrap:wrap"></div>');
  let timer = null;
  let detikJalan = 0;
  let idxWarna = 0;
  let jalan = false;

  const berhenti = (pesan) => {
    if (timer) { clearInterval(timer); timer = null; }
    jalan = false;
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    area.style.background = '#111';
    area.innerHTML = '<p class="mut" style="font-size:13px;padding:0 16px;text-align:center">' + T.esc(pesan || 'Berhenti. Cek apakah pikselnya sudah normal dengan latar gelap dan terang.') + '</p>';
    T.show(statusBox, '<p class="mut" style="font-size:13px">Jalan ' + detikJalan + ' detik. ' + T.esc(pesan || 'Cek hasilnya sekarang.') + '</p>');
    tombolMulai.disabled = false;
    tombolStop.disabled = true;
  };
  const tombolMulai = T.btn('Mulai', () => {
    if (jalan) return;
    jalan = true;
    detikJalan = 0;
    idxWarna = 0;
    area.innerHTML = '';
    const daftar = modeSel.value === 'solid' ? WARNA_SOLID : WARNA_KEDIP;
    const jeda = modeSel.value === 'solid' ? 1000 : 120;
    const durasi = Number(durasiSel.value);
    tombolMulai.disabled = true;
    tombolStop.disabled = false;
    T.show(statusBox, '<p class="mut" style="font-size:13px">Berjalan... hentikan bila pusing atau mata lelah.</p>');
    area.style.background = daftar[0];
    timer = setInterval(() => {
      idxWarna += 1;
      area.style.background = daftar[idxWarna % daftar.length];
      if (jeda >= 1000 || idxWarna % 8 === 0) detikJalan += Math.round(jeda * (jeda >= 1000 ? 1 : 8) / 1000);
      if (durasi > 0 && detikJalan >= durasi) berhenti('Waktu habis. Cek apakah pikselnya sudah normal.');
    }, jeda);
  }, true);
  const tombolStop = T.btn('Berhenti', () => berhenti(), false, true);
  const tombolLayar = T.btn('Layar penuh', () => {
    if (document.fullscreenElement) { if (document.exitFullscreen) document.exitFullscreen().catch(() => {}); return; }
    if (area.requestFullscreen) area.requestFullscreen().catch(() => T.toast('Layar penuh tidak bisa dibuka di perangkat ini'));
    else T.toast('Layar penuh tidak tersedia di perangkat ini');
  });
  tombolBox.appendChild(tombolMulai);
  tombolBox.appendChild(tombolStop);
  tombolBox.appendChild(tombolLayar);

  T.onLeave(() => { if (timer) clearInterval(timer); });

  root.appendChild(T.el('<p class="note">Piksel nyangkut itu titik kecil di layar yang macet di satu warna (merah, hijau, atau biru). Pola warna berkedip kadang bisa membangunkan piksel itu.</p>'));
  root.appendChild(T.el('<div class="warn" style="border:1px solid rgba(255,180,0,.5);border-radius:10px;padding:10px 12px;font-size:13px;line-height:1.5;margin-bottom:12px">Hentikan langsung bila pusing, mual, atau mata lelah. Jangan dipakai bila kamu sensitif terhadap cahaya berkedip. Cara ini tidak selalu berhasil dan bukan perbaikan resmi, tidak ada jaminan pikselnya kembali normal. Piksel yang hitam pekat total (mati) tidak bisa diperbaiki dengan cara ini.</div>'));
  root.appendChild(T.field('Pola', modeSel, 'Kedip cepat lebih agresif, solid pelan lebih nyaman di mata'));
  root.appendChild(T.field('Durasi', durasiSel));
  root.appendChild(area);
  root.appendChild(tombolBox);
  root.appendChild(statusBox);
  root.appendChild(T.el('<p class="hint">Tips: jalankan 5 sampai 10 menit, lalu cek dengan latar hitam dan putih. Bila belum berhasil, ulangi besok. Bila pikselnya makin banyak atau layar bergaris, itu masalah perangkat keras, bawa ke tempat servis.</p>'));
}
