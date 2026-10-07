import { h as T, LOCAL_NOTE, dlNodePng } from '../../core.js?v=6.9.5';

export const meta = {"id":"fake-boarding-pass","name":"Fake Boarding Pass","cat":"fakesos","icon":"✈️","desc":"Bikin boarding pass pesawat palsu buat prank + unduh PNG.","keywords":"boarding pass,pesawat,tiket,bandara,airport,fake,palsu,prank"};

const FBP_FONT = '-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,Helvetica,Arial,sans-serif';
const FBP_PLANE = '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" aria-hidden="true"><path d="M21.5 15.5v-2l-8.5-5V3.2a1.2 1.2 0 0 0-2.4 0v5.3l-8.5 5v2l8.5-2.5v5.6l-2.3 1.7v1.5l3.5-1 3.5 1v-1.5l-2.3-1.7V13l8.5 2.5z"/></svg>';
const FBP_CUT = '<svg viewBox="0 0 24 24" width="15" height="15" fill="#9aa0a6" aria-hidden="true"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.5 8.2l11.3 11.3-1.4 1.4L7.1 9.6zM20.5 3.5l-1.4-1.4L7.8 13.4l1.4 1.4z" opacity=".9"/></svg>';

/* Warna maskapai otomatis dari nama (fallback hitam TikTok-ish). */
const FBP_COLORS = [
  [/garuda/i, '#1E4FA3'], [/lion/i, '#E1251B'], [/batik/i, '#8B1E3F'],
  [/citilink/i, '#009A44'], [/air\s?asia/i, '#DA291C'], [/super\s?air/i, '#F7941D'],
  [/sriwijaya/i, '#1B2A6B'], [/trigana/i, '#C8102E'], [/pelita/i, '#0B6E4F'],
  [/trans\s?nusa/i, '#7B2D8B']
];
function fbpColor(name) {
  for (const [re, c] of FBP_COLORS) if (re.test(name)) return c;
  return '#161823';
}

const FBP_CSS = `
.fbp-wrap{max-width:400px;margin:12px auto;font-family:${FBP_FONT};font-size:15px;line-height:1.35}
.fbp-card{position:relative;background:#fff;color:#161823;border:1px solid #dbdbdb;border-radius:16px;overflow:hidden}
.fbp-head{display:flex;align-items:center;gap:10px;padding:14px 16px;color:#fff}
.fbp-head .fbp-plane{width:26px;height:26px;flex:none}
.fbp-air{flex:1;min-width:0;font-size:17px;font-weight:800;letter-spacing:.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fbp-bplabel{font-size:11px;font-weight:700;letter-spacing:2px;opacity:.92;flex:none}
.fbp-route{display:flex;align-items:center;justify-content:space-between;padding:18px 20px 6px}
.fbp-ap{flex:1;min-width:0}
.fbp-ap.r{text-align:right}
.fbp-code{font-size:38px;font-weight:800;letter-spacing:1px}
.fbp-city{font-size:13px;color:#5f6368;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fbp-mid{width:44px;height:44px;flex:none;color:#5f6368;opacity:.85}
.fbp-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px 10px;padding:14px 20px 4px}
.fbp-f{font-size:10.5px;font-weight:700;letter-spacing:1.2px;color:#9aa0a6;text-transform:uppercase}
.fbp-v{font-size:16px;font-weight:700;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fbp-name{padding:10px 20px 2px}
.fbp-name .fbp-v{font-size:17px}
.fbp-div{display:flex;align-items:center;margin:14px 0 4px}
.fbp-div .ln{flex:1;border-top:2px dashed #cfd3d8}
.fbp-div .nc{width:22px;height:22px;flex:none;background:#fff;border:1px solid #dbdbdb;border-radius:50%;margin:0 -11px;position:relative;z-index:2}
.fbp-stub{padding:2px 20px 8px}
.fbp-barcode{display:flex;align-items:flex-end;gap:0;height:56px;background:#fff}
.fbp-barcode i{display:block;background:#161823;height:100%}
.fbp-bcode{text-align:center;font-size:15px;font-weight:800;letter-spacing:6px;margin:6px 0 2px}
.fbp-stamp{position:absolute;top:44%;left:50%;transform:translate(-50%,-50%) rotate(-11deg);border:4px solid #E1251B;color:#E1251B;font-size:26px;font-weight:900;letter-spacing:3px;padding:8px 18px;border-radius:10px;background:rgba(255,255,255,.82);white-space:nowrap;z-index:3;pointer-events:none}
.fbp-foot{padding:8px 16px 12px;text-align:center;font-size:11.5px;color:#9aa0a6}
.fbp-foot b{color:#E1251B}
.fbp-note{font-size:12px;color:#8b8b93;line-height:1.5}
`;

function fbpBarcode() {
  let s = '';
  let x = 0;
  while (x < 60) {
    const w = 1 + Math.floor(Math.random() * 3);
    s += '<i style="width:' + w + 'px;margin-right:' + (Math.random() < 0.5 ? 1 : 2) + 'px"></i>';
    x += w;
  }
  return '<div class="fbp-barcode">' + s + '</div>';
}

const FBP_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function fbpRandCode() {
  let s = '';
  for (let i = 0; i < 6; i++) s += FBP_CHARS[Math.floor(Math.random() * FBP_CHARS.length)];
  return s;
}

export function render(root) {
  const style = document.createElement('style');
  style.textContent = FBP_CSS;
  root.appendChild(style);

  const namaI = T.input('text', 'cth: ADIP PRATAMA', 'ADIP PRATAMA');
  const maskapaiI = T.input('text', 'cth: Garuda Indonesia', 'Garuda Indonesia');
  const flightI = T.input('text', 'cth: GA-214', 'GA-214');
  const asalI = T.input('text', 'cth: CGK', 'CGK');
  const tujuI = T.input('text', 'cth: DPS', 'DPS');
  const kotaAI = T.input('text', 'cth: Jakarta', 'Jakarta');
  const kotaBI = T.input('text', 'cth: Denpasar · Bali', 'Denpasar · Bali');
  const tglI = T.input('text', 'cth: 12 Okt 2026', '12 Okt 2026');
  const boardI = T.input('text', 'cth: 07.40', '07.40');
  const gateI = T.input('text', 'cth: 5', '5');
  const seatI = T.input('text', 'cth: 12A', '12A');
  const kelasSel = T.select([['Ekonomi', 'Ekonomi'], ['Bisnis', 'Bisnis'], ['First', 'First']], 'Ekonomi');
  const kodeI = T.input('text', 'Kode booking', fbpRandCode());
  const preview = T.out();

  function acakKode() { kodeI.value = fbpRandCode(); draw(); }

  function draw() {
    const color = fbpColor(maskapaiI.value.trim());
    const nama = (namaI.value.trim() || 'NAMA PENUMPANG').toUpperCase();
    const maskapai = maskapaiI.value.trim() || 'Maskapai';
    const flight = (flightI.value.trim() || 'XX-000').toUpperCase();
    const asal = (asalI.value.trim() || 'CGK').toUpperCase().slice(0, 4);
    const tuju = (tujuI.value.trim() || 'DPS').toUpperCase().slice(0, 4);

    let h = '';
    h += '<div class="fbp-head" style="background:' + color + '">'
      + '<span class="fbp-plane">' + FBP_PLANE + '</span>'
      + '<span class="fbp-air">' + T.esc(maskapai) + '</span>'
      + '<span class="fbp-bplabel">BOARDING PASS</span></div>';
    h += '<div class="fbp-route">'
      + '<div class="fbp-ap"><div class="fbp-code">' + T.esc(asal) + '</div><div class="fbp-city">' + T.esc(kotaAI.value.trim() || '—') + '</div></div>'
      + '<div class="fbp-mid">' + FBP_PLANE + '</div>'
      + '<div class="fbp-ap r"><div class="fbp-code">' + T.esc(tuju) + '</div><div class="fbp-city">' + T.esc(kotaBI.value.trim() || '—') + '</div></div>'
      + '</div>';
    h += '<div class="fbp-name"><div class="fbp-f">Nama penumpang</div><div class="fbp-v">' + T.esc(nama) + '</div></div>';
    h += '<div class="fbp-grid">'
      + '<div><div class="fbp-f">Penerbangan</div><div class="fbp-v">' + T.esc(flight) + '</div></div>'
      + '<div><div class="fbp-f">Tanggal</div><div class="fbp-v">' + T.esc(tglI.value.trim() || '—') + '</div></div>'
      + '<div><div class="fbp-f">Boarding</div><div class="fbp-v">' + T.esc(boardI.value.trim() || '—') + '</div></div>'
      + '<div><div class="fbp-f">Gate</div><div class="fbp-v">' + T.esc(gateI.value.trim() || '—') + '</div></div>'
      + '<div><div class="fbp-f">Seat</div><div class="fbp-v">' + T.esc(seatI.value.trim().toUpperCase() || '—') + '</div></div>'
      + '<div><div class="fbp-f">Kelas</div><div class="fbp-v">' + T.esc(kelasSel.value) + '</div></div>'
      + '</div>';
    h += '<div class="fbp-div"><span class="nc"></span><span class="ln"></span><span class="nc"></span></div>';
    h += '<div class="fbp-stub">' + fbpBarcode()
      + '<div class="fbp-bcode">' + T.esc((kodeI.value.trim() || 'XXXXXX').toUpperCase()) + '</div></div>';
    h += '<div class="fbp-stamp">PALSU · CUMA PRANK</div>';
    h += '<div class="fbp-foot">Dokumen ini <b>PALSU</b> — dibuat untuk prank, <b>bukan tiket asli</b> dan tidak berlaku untuk terbang.</div>';

    T.show(preview, '<div class="fbp-wrap"><div class="fbp-card">' + h + '</div></div>');
  }

  [namaI, maskapaiI, flightI, asalI, tujuI, kotaAI, kotaBI, tglI, boardI, gateI, seatI, kelasSel, kodeI].forEach((elx) => { elx.addEventListener('input', draw); elx.addEventListener('change', draw); });

  function contoh() {
    namaI.value = 'ADIP PRATAMA';
    maskapaiI.value = 'Garuda Indonesia';
    flightI.value = 'GA-214';
    asalI.value = 'CGK'; tujuI.value = 'DPS';
    kotaAI.value = 'Jakarta'; kotaBI.value = 'Denpasar · Bali';
    tglI.value = '12 Okt 2026'; boardI.value = '07.40';
    gateI.value = '5'; seatI.value = '12A'; kelasSel.value = 'Ekonomi';
    kodeI.value = fbpRandCode();
    draw();
    T.scrollToPreview(preview);
    T.toast('Contoh dimuat');
  }

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.grid2(T.field('Nama penumpang', namaI), T.field('Maskapai', maskapaiI)));
  root.appendChild(T.grid2(T.field('Kode penerbangan', flightI), T.field('Kelas', kelasSel)));
  root.appendChild(T.grid2(
    T.field('Asal (kode bandara)', asalI, 'cth: CGK'),
    T.field('Kota asal', kotaAI)
  ));
  root.appendChild(T.grid2(
    T.field('Tujuan (kode bandara)', tujuI, 'cth: DPS'),
    T.field('Kota tujuan', kotaBI)
  ));
  root.appendChild(T.grid2(T.field('Tanggal', tglI), T.field('Jam boarding', boardI)));
  root.appendChild(T.grid2(T.field('Gate', gateI), T.field('Seat', seatI, 'cth: 12A')));
  root.appendChild(T.field('Kode booking', kodeI, 'Otomatis acak 6 karakter. Tekan "🔀 Acak kode booking" untuk ganti.'));
  root.appendChild(T.row(
    T.btn('🔀 Acak kode booking', acakKode),
    T.btn('🎲 Contoh', contoh),
    T.btn('⬇️ Unduh PNG', () => { dlNodePng(preview, 'fake-boarding-pass.png'); }, true)
  ));
  root.appendChild(preview);
  draw();
}
